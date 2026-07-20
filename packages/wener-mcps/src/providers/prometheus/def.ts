import { type CreatePrometheusMcpServerOptions, PrometheusMcpServerDef } from '@wener/ai/mcp/prometheus';
import type { PrometheusConfig } from '../../server/schema';
import { defineMcpServerHandler } from '../McpServerHandlerDef';

export const PrometheusHeaderNames = Object.freeze({
	__proto__: null,
	SERVICE_URL: 'X-SERVICE-URL',
} as const);

export const PrometheusMcpServerHandlerDef = defineMcpServerHandler<CreatePrometheusMcpServerOptions, PrometheusConfig>(
	PrometheusMcpServerDef,
	{
		headerMappings: [{ header: PrometheusHeaderNames.SERVICE_URL, property: 'url', required: true }],

		resolveConfig(config, headers) {
			const url =
				config.url ||
				headers?.get(PrometheusHeaderNames.SERVICE_URL) ||
				config.headers?.[PrometheusHeaderNames.SERVICE_URL];
			if (!url) return null;
			return { url };
		},
	},
);
