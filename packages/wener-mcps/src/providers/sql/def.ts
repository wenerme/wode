import { SqlMcpServerDef, type CreateSqlMcpServerOptions } from '@wener/ai/mcp/sql';
import type { SqlConfig } from '../../server/schema';
import { defineMcpServerHandler } from '../McpServerHandlerDef';

export const SqlHeaderNames = Object.freeze({
	__proto__: null,
	DB_URL: 'X-DB-URL',
	DB_READ_URL: 'X-DB-READ-URL',
	DB_WRITE_URL: 'X-DB-WRITE-URL',
} as const);

export const SqlMcpServerHandlerDef = defineMcpServerHandler<CreateSqlMcpServerOptions, SqlConfig>(SqlMcpServerDef, {
	headerMappings: [
		{ header: SqlHeaderNames.DB_URL, property: 'url' },
		{ header: SqlHeaderNames.DB_READ_URL, property: 'readUrl' },
		{ header: SqlHeaderNames.DB_WRITE_URL, property: 'writeUrl' },
	],

	resolveConfig(config, headers) {
		const readUrl =
			config.dbReadUrl ||
			config.dbUrl ||
			headers?.get(SqlHeaderNames.DB_READ_URL) ||
			headers?.get(SqlHeaderNames.DB_URL) ||
			config.headers?.[SqlHeaderNames.DB_READ_URL] ||
			config.headers?.[SqlHeaderNames.DB_URL];

		const writeUrl =
			config.dbWriteUrl ||
			headers?.get(SqlHeaderNames.DB_WRITE_URL) ||
			config.headers?.[SqlHeaderNames.DB_WRITE_URL];

		const url = readUrl || writeUrl;
		if (!url) return null;

		return {
			url,
			...(writeUrl ? { writeUrl } : {}),
		};
	},
});
