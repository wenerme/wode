import { defineMcpServer } from '../McpServerDef';
import { type CreateGrafanaMcpServerOptions, createGrafanaMcpServer } from './server';

export const GrafanaMcpServerDef = defineMcpServer<CreateGrafanaMcpServerOptions>({
	name: 'grafana',
	title: 'Grafana',
	description: 'Grafana MCP Server for datasource discovery, dashboard inspection, and Grafana API access',
	version: '1.0.0',
	tags: ['monitoring', 'grafana', 'dashboard', 'observability'],
	validateOptions(options) {
		if (!options.url) return { valid: false, error: 'Missing Grafana URL' };
		return { valid: true };
	},
	getCacheKey(options) {
		return [
			'grafana',
			options.url,
			options.orgId ?? '',
			options.serviceAccountToken ?? '',
			options.username ?? '',
			options.password ?? '',
		].join('::');
	},
	create: createGrafanaMcpServer,
});
