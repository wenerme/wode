import consola from 'consola';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { LRUCache } from 'lru-cache';
import { isDevelopment } from 'std-env';
import type { McpServerInstance } from '@wener/ai/mcp';
import { findMcpServerDef } from '../providers/findMcpServerDef';
import { registerApiRoutes } from './api-routes';
import { auditMiddleware, configureAudit } from './audit';
import { registerChatRoutes } from './chat-routes';
import { loadConfig, loadEnvFiles, substituteEnvVars } from './config';
import { registerMcpRoutes } from './mcp-routes';

const log = consola.withTag('mcps');

export interface CreateServerOptions {
	cwd?: string;
	port?: number;
	/** Enable server config discovery endpoints (default: false) */
	discoveryConfig?: boolean;
}

export function createServer(options: CreateServerOptions = {}) {
	const { cwd = process.cwd(), discoveryConfig: discoveryConfigOption } = options;

	const app = new Hono();

	// Request logging
	app.use(
		logger((v) => {
			log.debug(v);
		}),
	);

	// Audit middleware
	app.use(auditMiddleware());

	// Load .env files first
	loadEnvFiles(cwd);

	// Load config (with env var substitution)
	const config = substituteEnvVars(loadConfig(cwd));
	// discoveryConfig: CLI option overrides config file, defaults to false
	const discoveryConfig = discoveryConfigOption ?? config.discoveryConfig ?? false;

	// Log available server types from registry
	const serverDefs = findMcpServerDef();
	log.info(`Available server types: ${serverDefs.map((d) => d.name).join(', ')}`);
	log.info(`Loaded ${Object.keys(config.servers).length} servers from config (discoveryConfig: ${discoveryConfig})`);

	// Configure audit with lazy DB initialization
	// DB will only be initialized when the first audit event needs persistence
	configureAudit(config.audit, config.db);
	const auditEnabled = config.audit?.enabled !== false;
	const auditDbPath = config.audit?.db?.path ?? config.db?.path ?? '.mcps.db';
	log.info(`Audit configured: enabled=${auditEnabled}, db=${auditDbPath} (lazy init)`);

	// Unified cache for all MCP servers (both pre-configured and dynamic)
	// Keyed by cache key from def.getCacheKey() or `config::${name}` for pre-configured
	const serverCache = new LRUCache<string, McpServerInstance>({
		max: 100,
		dispose: (value, key) => {
			log.info(`Closing expired MCP server: ${key}`);
			value.close?.().catch((e: unknown) => log.error('Failed to close server', e));
		},
	});

	// =========================================================================
	// Register MCP routes (pre-configured and dynamic endpoints)
	// =========================================================================
	registerMcpRoutes({ app, config, serverCache });

	// =========================================================================
	// Register Chat/LLM Gateway routes
	// =========================================================================
	registerChatRoutes({ app, config });

	// =========================================================================
	// Health and info endpoints
	// =========================================================================
	app.get('/health', (c) => c.json({ status: 'ok' }));

	app.get('/', (c) => {
		return c.json({ message: 'hello' });
	});

	// Server info - only available in dev mode or when discoveryConfig is enabled
	if (isDevelopment || discoveryConfig) {
		app.get('/info', (c) => {
			// Dynamically get routes from Hono app
			const routes = app.routes
				.map((r) => ({ method: r.method, path: r.path }))
				.filter((r) => r.method !== 'ALL' || r.path.startsWith('/mcp/'))
				.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

			// Group routes by category
			const mcpRoutes = routes.filter((r) => r.path.startsWith('/mcp/')).map((r) => r.path);
			const apiRoutes = routes.filter((r) => r.path.startsWith('/api/')).map((r) => `${r.method} ${r.path}`);
			const chatRoutes = routes.filter((r) => r.path.startsWith('/v1/')).map((r) => `${r.method} ${r.path}`);

			// Get unique MCP paths
			const uniqueMcpPaths = [...new Set(mcpRoutes)];

			return c.json({
				name: '@wener/mcps',
				version: '0.1.0',
				servers: Object.keys(config.servers),
				serverTypes: findMcpServerDef().map((d) => d.name),
				models: config.models ? config.models.map((m) => m.name) : [],
				endpoints: {
					mcp: uniqueMcpPaths,
					api: [...new Set(apiRoutes)],
					chat: [...new Set(chatRoutes)],
				},
			});
		});
	}

	// =========================================================================
	// Register oRPC API routes
	// =========================================================================
	registerApiRoutes({ app, config });

	/**
	 * Print available endpoints grouped by category
	 */
	const printEndpoints = () => {
		const routes = app.routes;
		const mcpPaths = new Set<string>();
		const apiPaths = new Set<string>();
		const chatPaths = new Set<string>();
		const otherPaths = new Set<string>();

		for (const route of routes) {
			const path = route.path;
			if (path.startsWith('/mcp/')) {
				mcpPaths.add(path);
			} else if (path.startsWith('/api/')) {
				apiPaths.add(`${route.method} ${path}`);
			} else if (path.startsWith('/v1/')) {
				chatPaths.add(`${route.method} ${path}`);
			} else if (route.method !== 'ALL') {
				otherPaths.add(`${route.method} ${path}`);
			}
		}

		log.info('Available endpoints:');
		if (mcpPaths.size > 0) {
			log.info(`  MCP: ${[...mcpPaths].sort().join(', ')}`);
		}
		if (chatPaths.size > 0) {
			log.info(`  Chat: ${[...chatPaths].sort().join(', ')}`);
		}
		if (apiPaths.size > 0) {
			log.info(`  API: ${[...apiPaths].sort().join(', ')}`);
		}
		if (otherPaths.size > 0) {
			log.info(`  Other: ${[...otherPaths].sort().join(', ')}`);
		}
	};

	return { app, config, serverCache, printEndpoints };
}
