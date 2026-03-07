import { type CreateRelayMcpServerOptions, RelayMcpServerDef } from '@wener/ai/mcp/relay';
import type { RelayConfig } from '../../server/schema';
import { defineMcpServerHandler } from '../McpServerHandlerDef';

export const RelayHeaderNames = Object.freeze({
	__proto__: null,
	MCP_URL: 'X-MCP-URL',
	MCP_TYPE: 'X-MCP-TYPE',
} as const);

export const RelayMcpServerHandlerDef = defineMcpServerHandler<CreateRelayMcpServerOptions, RelayConfig>(
	RelayMcpServerDef,
	{
		headerMappings: [
			{ header: RelayHeaderNames.MCP_URL, property: 'url', required: true },
			{ header: RelayHeaderNames.MCP_TYPE, property: 'transport', default: 'http' },
		],

		resolveConfig(config, headers) {
			const url = config.url || headers?.get(RelayHeaderNames.MCP_URL) || config.headers?.[RelayHeaderNames.MCP_URL];
			const transport =
				(config.transport as 'http' | 'sse') ||
				(headers?.get(RelayHeaderNames.MCP_TYPE) as 'http' | 'sse') ||
				(config.headers?.[RelayHeaderNames.MCP_TYPE] as 'http' | 'sse') ||
				'http';

			if (!url) return null;

			return { url, transport, headers: config.headers };
		},
	},
);
