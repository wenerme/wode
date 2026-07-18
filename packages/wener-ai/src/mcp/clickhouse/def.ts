import { defineMcpServer } from '../McpServerDef';
import {
	type CreateClickHouseMcpServerOptions,
	createClickHouseMcpServer,
	DEFAULT_CLICKHOUSE_PROGRESS_HEADER_INTERVAL_MS,
	DEFAULT_CLICKHOUSE_REQUEST_TIMEOUT_MS,
} from './server';

export const ClickHouseMcpServerDef = defineMcpServer<CreateClickHouseMcpServerOptions>({
	name: 'clickhouse',
	title: 'ClickHouse',
	description: 'ClickHouse MCP Server using the official @clickhouse/client HTTP driver',
	version: '1.0.0',
	tags: ['database', 'clickhouse', 'analytics', 'olap'],
	validateOptions(options) {
		if (!options.url) return { valid: false, error: 'Missing ClickHouse URL' };
		return { valid: true };
	},
	getCacheKey(options) {
		return [
			'clickhouse',
			options.url,
			options.requestTimeoutMs ?? DEFAULT_CLICKHOUSE_REQUEST_TIMEOUT_MS,
			options.progressHeaders ?? true,
			String(options.progressHeaderIntervalMs ?? DEFAULT_CLICKHOUSE_PROGRESS_HEADER_INTERVAL_MS).replace(/_/g, ''),
		].join('::');
	},
	create: createClickHouseMcpServer,
});
