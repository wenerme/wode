import { defineMcpServer } from '../McpServerDef';
import { type CreatePrometheusMcpServerOptions, createPrometheusMcpServer } from './server';

export const PrometheusMcpServerDef = defineMcpServer<CreatePrometheusMcpServerOptions>({
	name: 'prometheus',
	title: 'Prometheus',
	description: 'Prometheus metrics query MCP Server with PromQL support',
	version: '1.0.0',
	tags: ['monitoring', 'metrics', 'prometheus', 'promql'],
	validateOptions(options) {
		if (!options.url) return { valid: false, error: 'Missing url for prometheus' };
		return { valid: true };
	},
	getCacheKey(options) {
		return `prom::${options.url}`;
	},
	create: createPrometheusMcpServer,
});
