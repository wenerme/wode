import { createMcpServerHandler } from './index';
import knex from 'knex';

// Example usage with different database types

// MySQL example
export function createMySQLHandler() {
	const mysqlKnex = knex({
		client: 'mysql2',
		connection: {
			host: 'localhost',
			user: 'root',
			password: 'password',
			database: 'mydb'
		}
	});

	return createMcpServerHandler(mysqlKnex, {
		databaseName: 'mydb',
		maxRows: 1000,
		readOnly: false
	});
}

// PostgreSQL example
export function createPostgreSQLHandler() {
	const pgKnex = knex({
		client: 'pg',
		connection: {
			host: 'localhost',
			port: 5432,
			user: 'postgres',
			password: 'password',
			database: 'mydb'
		}
	});

	return createMcpServerHandler(pgKnex, {
		databaseName: 'mydb',
		maxRows: 1000,
		readOnly: false
	});
}

// SQLite example
export function createSQLiteHandler() {
	const sqliteKnex = knex({
		client: 'sqlite3',
		connection: {
			filename: './database.sqlite'
		}
	});

	return createMcpServerHandler(sqliteKnex, {
		databaseName: 'database',
		maxRows: 1000,
		readOnly: false
	});
}

// Example MCP server setup
export async function createMcpServer() {
	// Choose your database handler
	const handler = createMySQLHandler(); // or createPostgreSQLHandler(), createSQLiteHandler()

	// Example: List available tools
	const tools = await handler.listTool({});
	console.log('Available tools:', tools.tools.map(t => t.name));

	// Example: List database resources
	const resources = await handler.listResources({});
	console.log('Available resources:', resources.resources.map(r => r.uri));

	// Example: Execute a query
	const queryResult = await handler.callTool({
		method: 'queryJson',
		params: { query: 'SELECT 1 as test' }
	});
	console.log('Query result:', queryResult);

	return handler;
}