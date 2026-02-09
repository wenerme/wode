import { StreamableHTTPTransport } from '@hono/mcp';
import consola from 'consola';
import type { Hono } from 'hono';
import type { LRUCache } from 'lru-cache';
import type { McpServerInstance } from '@wener/ai/mcp';
import { getMcpServerHandlerDef, type McpServerHandlerDef } from '../providers/McpServerHandlerDef';
import { findMcpServerDef } from '../providers/findMcpServerDef';
import { createMcpLoggingHandler } from './mcp-handler';
import type { McpsConfig, ServerConfig } from './schema';

const log = consola.withTag('mcps');

export interface RegisterMcpRoutesOptions {
	app: Hono;
	config: McpsConfig;
	serverCache: LRUCache<string, McpServerInstance>;
}

/**
 * Register MCP routes for both pre-configured and dynamic endpoints
 */
export function registerMcpRoutes({ app, config, serverCache }: RegisterMcpRoutesOptions) {
	const serverDefs = findMcpServerDef();

	// Register pre-configured servers from config
	// These are named endpoints like /mcp/my-sql that use config from file
	for (const [name, serverConfig] of Object.entries(config.servers)) {
		const def = getMcpServerHandlerDef(serverConfig.type);
		if (!def) {
			log.warn(`Unknown server type for ${name}: ${serverConfig.type}`);
			continue;
		}

		// Resolve config using def (config comes from file, not headers)
		const options = def.resolveConfig(serverConfig);
		if (!options) {
			log.warn(`Failed to resolve config for ${name}`);
			continue;
		}

		const validation = def.validateOptions(options);
		if (!validation.valid) {
			log.warn(`Invalid config for ${name}: ${validation.error}`);
			continue;
		}

		// Create and cache the server instance at startup
		const cacheKey = `config::${name}`;
		const item = def.create(options);
		if (!item) {
			log.warn(`Failed to create server: ${name}`);
			continue;
		}
		serverCache.set(cacheKey, item);

		const path = `/mcp/${name}`;
		log.info(`Registered MCP server: ${path} (${serverConfig.type})`);

		app.all(path, async (c) => {
			const serverItem = serverCache.get(cacheKey);
			if (!serverItem) {
				return c.text('Server not found', 404);
			}
			// Create a new transport for each request to avoid "Transport already started" error
			const transport = new StreamableHTTPTransport();
			try {
				await serverItem.server.connect(transport);
				const handleRequest = createMcpLoggingHandler(transport, name);
				return await handleRequest(c);
			} catch (e) {
				log.error(`[${name}] Request error:`, e);
				return c.text(`Internal server error: ${e instanceof Error ? e.message : 'Unknown error'}`, 500);
			}
		});
	}

	// Register dynamic endpoints for all server types
	// These endpoints accept config via HTTP headers
	for (const def of serverDefs) {
		const path = `/mcp/${def.name}`;
		log.debug(`Registering dynamic endpoint: ${path}`);

		app.all(path, async (c) => {
			// Use def.resolveConfig to parse config from headers
			const options = def.resolveConfig({ type: def.name } as any, c.req.raw.headers);

			if (!options) {
				// Build error message from headerMappings
				const requiredHeaders =
					def.headerMappings
						?.filter((m) => m.required)
						.map((m) => m.header)
						.join(', ') || 'required headers';
				return c.text(`Missing ${requiredHeaders}`, 400);
			}

			// Validate options
			const validation = def.validateOptions(options);
			if (!validation.valid) {
				return c.text(validation.error || `Invalid configuration for ${def.name}`, 400);
			}

			// Get or create cached server instance
			const key = def.getCacheKey(options);
			let item = serverCache.get(key);
			if (!item) {
				log.info(`Creating new ${def.title} server: ${key}`);
				try {
					const newItem = def.create(options);
					if (!newItem) return c.text(`Failed to create ${def.name} server`, 500);
					item = newItem;
					serverCache.set(key, item);
				} catch (e) {
					log.error(`Failed to create ${def.name} server:`, e);
					return c.text(`Failed to create ${def.name} server`, 500);
				}
			}

			// Create a new transport for each request
			const transport = new StreamableHTTPTransport();
			try {
				await item.server.connect(transport);
				const handleRequest = createMcpLoggingHandler(transport, def.name);
				return await handleRequest(c);
			} catch (e) {
				log.error(`[${def.name}] Request error:`, e);
				return c.text(`Internal server error: ${e instanceof Error ? e.message : 'Unknown error'}`, 500);
			}
		});
	}

	return { serverDefs };
}
