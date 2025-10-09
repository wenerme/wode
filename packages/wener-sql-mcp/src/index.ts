import type { Knex } from 'knex';
import { createMcpServerHandler } from '@wener/common/mcp';
import { SqlServiceContract } from '@wener/common/mcp/sql';
import { createKnexSqlServiceImpl } from '@wener/common/mcp/sql/createKnexSqlServiceImpl';

export interface WenerSqlMcpConfig {
	knex: Knex;
	readonly?: boolean;
	prefix?: string;
}

export function createWenerSqlMcpServer(config: WenerSqlMcpConfig) {
	const { knex, readonly = false, prefix } = config;
	
	// Create the Knex-based SQL service implementation
	const sqlService = createKnexSqlServiceImpl({ knex, readonly });
	
	// Create the MCP server handler
	const mcpHandler = createMcpServerHandler(SqlServiceContract, sqlService, { prefix });
	
	return {
		...mcpHandler,
		// Expose the underlying SQL service for advanced usage
		sqlService,
		// Expose the Knex instance for direct database access
		knex,
	};
}

export type WenerSqlMcpServer = ReturnType<typeof createWenerSqlMcpServer>;

// Re-export types and utilities
export { SqlServiceContract } from '@wener/common/mcp/sql';
export { createKnexSqlServiceImpl } from '@wener/common/mcp/sql/createKnexSqlServiceImpl';
export type { KnexSqlServiceConfig } from '@wener/common/mcp/sql/createKnexSqlServiceImpl';