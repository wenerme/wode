import { RelayMcpServerDef, type CreateRelayMcpServerOptions } from '@wener/ai/mcp/relay';
import { HeaderNames, type RelayConfig } from '../../server/schema';
import { defineMcpServerHandler, registerMcpServerHandler } from '../McpServerHandlerDef';

export const RelayMcpServerHandlerDef = defineMcpServerHandler<CreateRelayMcpServerOptions, RelayConfig>(
	RelayMcpServerDef,
	{
		headerMappings: [
			{ header: HeaderNames.MCP_URL, property: 'url', required: true },
			{ header: HeaderNames.MCP_TYPE, property: 'transport', default: 'http' },
		],

		resolveConfig(config, headers) {
			const url = config.url || headers?.get(HeaderNames.MCP_URL) || config.headers?.[HeaderNames.MCP_URL];
			const transport =
				(config.transport as 'http' | 'sse') ||
				(headers?.get(HeaderNames.MCP_TYPE) as 'http' | 'sse') ||
				(config.headers?.[HeaderNames.MCP_TYPE] as 'http' | 'sse') ||
				'http';

			if (!url) return null;

			return { url, transport, headers: config.headers };
		},
	},
);

registerMcpServerHandler(RelayMcpServerHandlerDef);

// backward compatibility
export { RelayMcpServerHandlerDef as RelayMcpServerDef };
