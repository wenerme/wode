import { StreamableHTTPTransport } from '@hono/mcp';
import type { McpServerInstance } from '@wener/ai/mcp';
import consola from 'consola';
import type { Hono } from 'hono';
import type { LRUCache } from 'lru-cache';
import { findMcpServerDef } from '../providers/findMcpServerDef';
import { getMcpServerHandlerDef, type McpServerHandlerDef } from '../providers/McpServerHandlerDef';
import { createMcpLoggingHandler } from './mcp-handler';
import type { McpsConfig, ServerConfig } from './schema';

const log = consola.withTag('mcps');

export interface RegisterMcpRoutesOptions {
	app: Hono;
	config: McpsConfig;
	serverCache: LRUCache<string, McpServerInstance>;
}

/**
 * Register MCP routes for both pre-configured and dynamic endpoints.
 *
 * McpServer only supports one transport connection at a time, so we create
 * a fresh server instance per request instead of caching stateful servers.
 */
export function registerMcpRoutes({ app, config, serverCache: _serverCache }: RegisterMcpRoutesOptions) {
	const serverDefs = findMcpServerDef();

	// Register pre-configured servers from config
	for (const [name, serverConfig] of Object.entries(config.servers)) {
		const def = getMcpServerHandlerDef(serverConfig.type);
		if (!def) {
			log.warn(`Unknown server type for ${name}: ${serverConfig.type}`);
			continue;
		}

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

		const path = `/mcp/${name}`;
		log.info(`Registered MCP server: ${path} (${serverConfig.type})`);

		app.all(path, async (c) => {
			return handleMcpRequest(c, def, options, name);
		});
	}

	// Register dynamic endpoints for all server types (header-based config)
	for (const def of serverDefs) {
		const path = `/mcp/${def.name}`;
		log.debug(`Registering dynamic endpoint: ${path}`);

		app.all(path, async (c) => {
			const options = def.resolveConfig({ type: def.name } as any, c.req.raw.headers);

			if (!options) {
				const requiredHeaders =
					def.headerMappings
						?.filter((m) => m.required)
						.map((m) => m.header)
						.join(', ') || 'required headers';
				return c.text(`Missing ${requiredHeaders}`, 400);
			}

			const validation = def.validateOptions(options);
			if (!validation.valid) {
				return c.text(validation.error || `Invalid configuration for ${def.name}`, 400);
			}

			return handleMcpRequest(c, def, options, def.name);
		});
	}

	return { serverDefs };
}

async function handleMcpRequest(c: any, def: McpServerHandlerDef, options: any, name: string) {
	let item: McpServerInstance | undefined;
	try {
		item = def.create(options);
		if (!item) return c.text(`Failed to create ${name} server`, 500);
	} catch (e) {
		log.error(`Failed to create ${name} server:`, e);
		return c.text(`Failed to create ${name} server`, 500);
	}

	const transport = new StreamableHTTPTransport();
	try {
		await item.server.connect(transport);

		const prevOnclose = transport.onclose;
		transport.onclose = () => {
			prevOnclose?.();
			item?.close?.().catch((e) => log.debug(`[${name}] cleanup:`, e));
		};

		const handleRequest = createMcpLoggingHandler(transport, name);
		return await handleRequest(c);
	} catch (e) {
		log.error(`[${name}] Request error:`, e);
		item.close?.().catch(() => {});
		return c.text(`Internal server error: ${e instanceof Error ? e.message : 'Unknown error'}`, 500);
	}
}
