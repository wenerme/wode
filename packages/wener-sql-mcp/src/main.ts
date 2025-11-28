import { setContractHandler } from 'common/mcp';
import { runMcpServerCommand } from 'common/mcp/server';
import knex from 'knex';
import { createKnexConfig, getSqlConfig } from './server/config';
import { createKnexSqlServiceImpl } from './sql/createKnexSqlServiceImpl';
import { SqlServiceContract } from './sql/SqlServiceContract';

const AppInfo = {
	name: process.env.PACKAGE_NAME || 'wener-sql-mcp',
	version: process.env.PACKAGE_VERSION || '1.0.0',
};

await runMcpServerCommand({
	name: AppInfo.name,
	transport: 'stdio',
	port: 3000,
	onServer: async (config) => {
		const { logger, server } = config;

		// Initialize SQL configuration
		const sqlConfig = getSqlConfig({ logger });

		logger.info(`Connecting to ${sqlConfig.client} database...`);

		// Create Knex instance
		const knexConfig = createKnexConfig(sqlConfig);
		const db = knex(knexConfig);

		// Test connection
		try {
			await db.raw('SELECT 1');
			logger.success(`Connected to ${sqlConfig.client} database successfully`);
		} catch (error) {
			logger.error('Failed to connect to database:', error);
			throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}

		setContractHandler(server, {
			contract: SqlServiceContract,
			impl: createKnexSqlServiceImpl({
				knex: db,
				readonly: sqlConfig.readonly,
			}),
		});

		// Cleanup on server shutdown
		config.server.close = async () => {
			await db.destroy();
			logger.info('Database connection closed');
		};
	},
});
