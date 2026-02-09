import { PrometheusMcpServerDef, type CreatePrometheusMcpServerOptions } from '@wener/ai/mcp/prometheus';
import { HeaderNames, type PrometheusConfig } from '../../server/schema';
import { defineMcpServerHandler, registerMcpServerHandler } from '../McpServerHandlerDef';

export const PrometheusMcpServerHandlerDef = defineMcpServerHandler<CreatePrometheusMcpServerOptions, PrometheusConfig>(
	PrometheusMcpServerDef,
	{
		headerMappings: [{ header: HeaderNames.SERVICE_URL, property: 'url', required: true }],

		resolveConfig(config, headers) {
			const url = config.url || headers?.get(HeaderNames.SERVICE_URL) || config.headers?.[HeaderNames.SERVICE_URL];
			if (!url) return null;
			return { url };
		},
	},
);

registerMcpServerHandler(PrometheusMcpServerHandlerDef);

// backward compatibility
export { PrometheusMcpServerHandlerDef as PrometheusMcpServerDef };
