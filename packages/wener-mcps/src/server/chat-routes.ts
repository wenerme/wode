import consola from 'consola';
import type { Hono } from 'hono';
import { createChatHandler } from '../chat';
import { registerAgentRoutes } from '../chat/agent';
import type { McpsConfig, ModelConfig } from './schema';

const log = consola.withTag('mcps');

export interface RegisterChatRoutesOptions {
	app: Hono;
	config: McpsConfig;
}

/**
 * Register Chat/LLM Gateway routes
 */
export function registerChatRoutes({ app, config }: RegisterChatRoutesOptions) {
	if (!config.models || config.models.length === 0) {
		return;
	}

	log.info(`Registering chat gateway with ${config.models.length} models`);
	const chatHandler = createChatHandler({ config: { models: config.models } });
	app.route('/', chatHandler);

	// Helper function to resolve model config
	function resolveModelConfig(modelName: string): ModelConfig | null {
		const models = config.models || [];
		// Exact match first
		for (const modelConfig of models) {
			if (modelConfig.name === modelName) return modelConfig;
		}
		// Wildcard match
		for (const modelConfig of models) {
			const pattern = modelConfig.name;
			if (pattern.includes('*')) {
				const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
				if (regex.test(modelName)) return modelConfig;
			}
		}
		return null;
	}

	// Register agent routes with tool loop support
	registerAgentRoutes(app, {
		resolveModelConfig,
		// MCP tools will be loaded on-demand from configured servers
		getMcpTools: async (serverNames) => {
			if (!serverNames || serverNames.length === 0) {
				return {};
			}

			const allTools: Record<string, any> = {};
			const { createMCPClient } = await import('@ai-sdk/mcp');

			for (const serverName of serverNames) {
				const serverConfig = config.servers[serverName];
				if (!serverConfig) {
					log.warn(`MCP server not found: ${serverName}`);
					continue;
				}

				try {
					// Get the server URL - for configured servers, connect via HTTP
					// The server exposes MCP at /mcp/{serverName}
					const port = process.env.PORT || '3001';
					const serverUrl = `http://127.0.0.1:${port}/mcp/${serverName}`;

					// Create MCP client using SSE transport for HTTP-based MCP
					const { SSEClientTransport } = await import('@modelcontextprotocol/sdk/client/sse.js');
					const client = await createMCPClient({
						transport: new SSEClientTransport(new URL(serverUrl)),
					});

					// Get tools from this server
					const serverTools = await client.tools();
					for (const [toolName, tool] of Object.entries(serverTools)) {
						allTools[`${serverName}_${toolName}`] = tool;
					}

					log.info(`Loaded ${Object.keys(serverTools).length} tools from ${serverName}`);

					// Close the client after getting tools
					await client.close();
				} catch (err) {
					log.error(`Failed to load tools from ${serverName}:`, err);
				}
			}

			log.info(`Agent loaded ${Object.keys(allTools).length} total tools from servers: ${serverNames.join(', ')}`);
			return allTools;
		},
	});
	log.info('Registered agent routes at /v1/agent/*');
}
