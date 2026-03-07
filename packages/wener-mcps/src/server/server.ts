import type { McpServerInstance } from '@wener/ai/mcp';
import consola from 'consola';
import type { Context, Next } from 'hono';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { LRUCache } from 'lru-cache';
import { isDevelopment } from 'std-env';
import { findMcpServerDef } from '../providers/findMcpServerDef';
import { registerApiRoutes } from './api-routes';
import { registerChatRoutes } from './chat-routes';
import { loadConfig, loadEnvFiles, substituteEnvVars } from './config';
import { createMcpsEmitter, type McpsEmitter, McpsEventType } from './events';
import { registerMcpRoutes } from './mcp-routes';

const log = consola.withTag('mcps');

export interface McpsServerContext {
	app: Hono;
	config: import('./schema').McpsConfig;
	emitter: McpsEmitter;
	serverCache: LRUCache<string, McpServerInstance>;
	/** Plugins can register additional oRPC routers here */
	apiRouters: Record<string, any>;
	/** Plugins can register stats providers here */
	statsProvider?: StatsProvider;
}

export interface StatsProvider {
	getStats(options: { from?: string | null; to?: string | null }): {
		totalRequests: number;
		totalErrors: number;
		avgDurationMs: number;
		byServer: Array<{ name: string; count: number }>;
		byMethod: Array<{ method: string; count: number }>;
	};
	queryEvents(options: { limit?: number }): { events: Array<{ path: string }>; total: number };
}

export interface CreateServerOptions {
	cwd?: string;
	port?: number;
	/** Enable server config discovery endpoints (default: false) */
	discoveryConfig?: boolean;
	/**
	 * Called after core server is created but before routes are registered.
	 * Use this to set up optional plugins like audit via the emitter.
	 */
	setup?: (ctx: McpsServerContext) => void | Promise<void>;
}

export function createServer(options: CreateServerOptions = {}) {
	const { cwd = process.cwd(), discoveryConfig: discoveryConfigOption, setup } = options;

	const app = new Hono();
	const emitter = createMcpsEmitter();
	const apiRouters: Record<string, any> = {};

	// Request logging
	app.use(
		logger((v) => {
			log.debug(v);
		}),
	);

	// Request event middleware - emits events for subscribers (audit, monitoring, etc.)
	app.use(requestEventMiddleware(emitter));

	// Load .env files first
	loadEnvFiles(cwd);

	// Load config (with env var substitution)
	const config = substituteEnvVars(loadConfig(cwd));
	const discoveryConfig = discoveryConfigOption ?? config.discoveryConfig ?? false;

	// Log available server types from registry
	const serverDefs = findMcpServerDef();
	log.info(`Available server types: ${serverDefs.map((d) => d.name).join(', ')}`);
	log.info(`Loaded ${Object.keys(config.servers).length} servers from config (discoveryConfig: ${discoveryConfig})`);

	// Unified cache for all MCP servers
	const serverCache = new LRUCache<string, McpServerInstance>({
		max: 100,
		dispose: (value, key) => {
			log.info(`Closing expired MCP server: ${key}`);
			value.close?.().catch((e: unknown) => log.error('Failed to close server', e));
		},
	});

	const ctx: McpsServerContext = { app, config, emitter, serverCache, apiRouters };

	const finalize = async () => {
		// Allow plugins to set up before routes are registered
		await setup?.(ctx);

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
		app.get('/', (c) => c.json({ message: 'hello' }));

		if (isDevelopment || discoveryConfig) {
			app.get('/info', (c) => {
				const routes = app.routes
					.map((r) => ({ method: r.method, path: r.path }))
					.filter((r) => r.method !== 'ALL' || r.path.startsWith('/mcp/'))
					.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

				const mcpRoutes = routes.filter((r) => r.path.startsWith('/mcp/')).map((r) => r.path);
				const apiRoutes = routes.filter((r) => r.path.startsWith('/api/')).map((r) => `${r.method} ${r.path}`);
				const chatRoutes = routes.filter((r) => r.path.startsWith('/v1/')).map((r) => `${r.method} ${r.path}`);
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
		// Register oRPC API routes (with any plugin-provided routers)
		// =========================================================================
		registerApiRoutes({ app, config, apiRouters, statsProvider: ctx.statsProvider });
	};

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
		if (mcpPaths.size > 0) log.info(`  MCP: ${[...mcpPaths].sort().join(', ')}`);
		if (chatPaths.size > 0) log.info(`  Chat: ${[...chatPaths].sort().join(', ')}`);
		if (apiPaths.size > 0) log.info(`  API: ${[...apiPaths].sort().join(', ')}`);
		if (otherPaths.size > 0) log.info(`  Other: ${[...otherPaths].sort().join(', ')}`);
	};

	return { app, config, emitter, serverCache, printEndpoints, finalize };
}

function headersToRecord(headers: Headers): Record<string, string> {
	const record: Record<string, string> = {};
	headers.forEach((value, key) => {
		record[key] = value;
	});
	return record;
}

/**
 * Middleware that emits request events via the emitter.
 * Subscribers (like audit plugin) can listen and handle these events.
 */
function requestEventMiddleware(emitter: McpsEmitter) {
	return async (c: Context, next: Next) => {
		const startTime = Date.now();
		const path = c.req.path;

		let serverName: string | undefined;
		let serverType: string | undefined;

		const mcpMatch = path.match(/^\/mcp\/([^/]+)/);
		if (mcpMatch) {
			serverName = mcpMatch[1];
			if (['tencent-cls', 'sql', 'prometheus', 'relay'].includes(serverName)) {
				serverType = serverName;
			} else {
				serverType = 'custom';
			}
		}

		if (path.startsWith('/v1/')) {
			serverType = 'chat';
		}

		let error: string | undefined;

		try {
			await next();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			throw e;
		} finally {
			const durationMs = Date.now() - startTime;

			emitter.emit(McpsEventType.Request, {
				timestamp: new Date().toISOString(),
				method: c.req.method,
				path,
				serverName,
				serverType,
				status: c.res.status,
				durationMs,
				error,
				requestHeaders: headersToRecord(c.req.raw.headers),
			});
		}
	};
}
