import type { ClickHouseClientConfigOptions, ClickHouseSettings } from '@clickhouse/client';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerMetadataTools, registerQueryTools } from './tools';
import { type ClickHouseConnectionConfig, parseClickHouseUrl } from './utils';

export const DEFAULT_CLICKHOUSE_REQUEST_TIMEOUT_MS = 120_000;
export const DEFAULT_CLICKHOUSE_PROGRESS_HEADER_INTERVAL_MS = '50000';

export interface CreateClickHouseMcpServerOptions {
	/** ClickHouse connection URL (http://, https://, tcp://, clickhouse://) */
	url?: string;
	/** When true, only register read-only tools. Defaults to false. */
	readOnly?: boolean;
	/** HTTP request timeout in milliseconds. Defaults to 120s. */
	requestTimeoutMs?: number;
	/** Enable ClickHouse progress headers to keep long-running HTTP queries alive. Defaults to true. */
	progressHeaders?: boolean;
	/** Interval for progress headers in milliseconds. Defaults to 50s (below common 60s LB idle timeout). */
	progressHeaderIntervalMs?: number | string;
	/** Server name */
	name?: string;
	/** Server version */
	version?: string;
}

export interface ClickHouseContext {
	server: McpServer;
	readOnly: boolean;
	getClient: () => Promise<import('@clickhouse/client').ClickHouseClient>;
	textResult: (text: string) => { content: { type: 'text'; text: string }[] };
	jsonResult: (data: unknown) => { content: { type: 'text'; text: string }[] };
}

export function createClickHouseClientConfig(
	config: ClickHouseConnectionConfig,
	options: Pick<
		CreateClickHouseMcpServerOptions,
		'requestTimeoutMs' | 'progressHeaders' | 'progressHeaderIntervalMs'
	> = {},
): ClickHouseClientConfigOptions {
	const requestTimeout = options.requestTimeoutMs ?? DEFAULT_CLICKHOUSE_REQUEST_TIMEOUT_MS;
	const progressHeaders = options.progressHeaders ?? true;
	const progressHeaderIntervalMs = String(
		options.progressHeaderIntervalMs ?? DEFAULT_CLICKHOUSE_PROGRESS_HEADER_INTERVAL_MS,
	).replace(/_/g, '');
	const clickhouseSettings: ClickHouseSettings = {
		output_format_json_quote_64bit_integers: 0,
	};

	if (progressHeaders) {
		clickhouseSettings.send_progress_in_http_headers = 1;
		clickhouseSettings.http_headers_progress_interval_ms = progressHeaderIntervalMs;
	}

	return {
		url: config.url,
		username: config.username,
		password: config.password,
		database: config.database,
		request_timeout: requestTimeout,
		clickhouse_settings: clickhouseSettings,
	};
}

export function createClickHouseMcpServer(options: CreateClickHouseMcpServerOptions) {
	const { name = 'clickhouse-mcp-server', version = '1.0.0' } = options;

	let _client: import('@clickhouse/client').ClickHouseClient | undefined;
	let _loadPromise: Promise<import('@clickhouse/client').ClickHouseClient> | undefined;

	const server = new McpServer({ name, version });

	const getClient = async () => {
		if (_client) return _client;
		if (!_loadPromise) {
			_loadPromise = (async () => {
				const url = options.url;
				if (!url) throw new Error('ClickHouse URL must be provided');
				const config = parseClickHouseUrl(url);
				const { createClient } = await import('@clickhouse/client');
				const client = createClient(createClickHouseClientConfig(config, options));
				const ping = await client.ping();
				if (!ping.success) {
					throw new Error(`ClickHouse ping failed: ${ping.error.message}`);
				}
				_client = client;
				return client;
			})();
		}
		return _loadPromise;
	};

	const textResult = (text: string) => ({ content: [{ type: 'text' as const, text }] });
	const jsonResult = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });

	const readOnly = options.readOnly ?? false;
	const ctx: ClickHouseContext = { server, readOnly, getClient, textResult, jsonResult };

	registerQueryTools(ctx);
	registerMetadataTools(ctx);

	return {
		server,
		loadClient: getClient,

		async close() {
			if (_client) {
				await _client.close();
			}
			await server.close();
			_client = undefined;
			_loadPromise = undefined;
		},
	};
}
