import { SqlMcpServerDef, type CreateSqlMcpServerOptions } from '@wener/ai/mcp/sql';
import { HeaderNames, type SqlConfig } from '../../server/schema';
import { defineMcpServerHandler, registerMcpServerHandler } from '../McpServerHandlerDef';

export const SqlMcpServerHandlerDef = defineMcpServerHandler<CreateSqlMcpServerOptions, SqlConfig>(SqlMcpServerDef, {
	headerMappings: [
		{ header: HeaderNames.DB_URL, property: 'url' },
		{ header: HeaderNames.DB_READ_URL, property: 'readUrl' },
		{ header: HeaderNames.DB_WRITE_URL, property: 'writeUrl' },
	],

	resolveConfig(config, headers) {
		const url =
			config.dbUrl ||
			config.dbReadUrl ||
			config.dbWriteUrl ||
			headers?.get(HeaderNames.DB_URL) ||
			headers?.get(HeaderNames.DB_READ_URL) ||
			headers?.get(HeaderNames.DB_WRITE_URL) ||
			config.headers?.[HeaderNames.DB_URL] ||
			config.headers?.[HeaderNames.DB_READ_URL] ||
			config.headers?.[HeaderNames.DB_WRITE_URL];

		if (!url) return null;

		return { url };
	},
});

registerMcpServerHandler(SqlMcpServerHandlerDef);

// backward compatibility
export { SqlMcpServerHandlerDef as SqlMcpServerDef };
