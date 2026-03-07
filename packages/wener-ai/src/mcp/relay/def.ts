import { defineMcpServer } from '../McpServerDef';
import { type CreateRelayMcpServerOptions, createRelayMcpServer } from './server';

export const RelayMcpServerDef = defineMcpServer<CreateRelayMcpServerOptions>({
	name: 'relay',
	title: 'MCP Relay',
	description: 'MCP Relay Server for proxying requests to another MCP server',
	version: '1.0.0',
	tags: ['relay', 'proxy', 'mcp'],
	validateOptions(options) {
		if (!options.url) return { valid: false, error: 'Missing url for relay' };
		return { valid: true };
	},
	getCacheKey(options) {
		return `relay::${options.url}::${options.transport || 'http'}`;
	},
	create: createRelayMcpServer,
});
