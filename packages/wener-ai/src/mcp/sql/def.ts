import { defineMcpServer } from '../McpServerDef';
import { createSqlMcpServer, type CreateSqlMcpServerOptions } from './server';

export const SqlMcpServerDef = defineMcpServer<CreateSqlMcpServerOptions>({
	name: 'sql',
	title: 'SQL Database',
	description: 'SQL Database MCP Server supporting MySQL, PostgreSQL, SQLite, and MSSQL via Kysely',
	version: '1.0.0',
	tags: ['database', 'sql', 'mysql', 'postgres', 'sqlite', 'mssql'],
	validateOptions(options) {
		if (!options.url) return { valid: false, error: 'Missing database URL for sql' };
		return { valid: true };
	},
	getCacheKey(options) {
		return `sql::${options.url}`;
	},
	create: createSqlMcpServer,
});
