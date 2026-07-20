import { ClickHouseMcpServerDef, type CreateClickHouseMcpServerOptions } from '@wener/ai/mcp/clickhouse';
import type { ClickHouseConfig } from '../../server/schema';
import { defineMcpServerHandler } from '../McpServerHandlerDef';

export const ClickHouseHeaderNames = Object.freeze({
	__proto__: null,
	DB_URL: 'X-DB-URL',
} as const);

export const ClickHouseMcpServerHandlerDef = defineMcpServerHandler<CreateClickHouseMcpServerOptions, ClickHouseConfig>(
	ClickHouseMcpServerDef,
	{
		headerMappings: [{ header: ClickHouseHeaderNames.DB_URL, property: 'url' }],

		resolveConfig(config, headers) {
			const url =
				config.dbUrl || headers?.get(ClickHouseHeaderNames.DB_URL) || config.headers?.[ClickHouseHeaderNames.DB_URL];

			if (!url) return null;

			return { url };
		},
	},
);
