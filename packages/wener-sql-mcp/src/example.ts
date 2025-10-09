import { createWenerSqlMcpServer } from './index';
import knex from 'knex';

// Example usage with different database types

// PostgreSQL example
export function createPostgresExample() {
  const db = knex({
    client: 'pg',
    connection: {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'password',
      database: 'mydb'
    }
  });

  return createWenerSqlMcpServer({
    knex: db,
    readonly: false,
    prefix: 'pg'
  });
}

// MySQL example
export function createMysqlExample() {
  const db = knex({
    client: 'mysql2',
    connection: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'password',
      database: 'mydb'
    }
  });

  return createWenerSqlMcpServer({
    knex: db,
    readonly: false,
    prefix: 'mysql'
  });
}

// SQLite example
export function createSqliteExample() {
  const db = knex({
    client: 'sqlite3',
    connection: {
      filename: './database.sqlite'
    }
  });

  return createWenerSqlMcpServer({
    knex: db,
    readonly: false,
    prefix: 'sqlite'
  });
}

// Example usage
export async function exampleUsage() {
  // Create a SQLite MCP server for demonstration
  const mcpServer = createSqliteExample();

  try {
    // List available tools
    const tools = await mcpServer.listTool({});
    console.log('Available tools:', tools.tools.map(t => t.name));

    // Execute a simple query
    const result = await mcpServer.callTool({
      method: 'sqlite_queryJson',
      params: {
        query: 'SELECT 1 as test, "hello" as message'
      }
    });
    console.log('Query result:', result);

    // List database objects
    const objects = await mcpServer.callTool({
      method: 'sqlite_listObjects',
      params: {}
    });
    console.log('Database objects:', objects);

    // Get database version
    const version = await mcpServer.callTool({
      method: 'sqlite_getVersion',
      params: {}
    });
    console.log('Database version:', version);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage().catch(console.error);
}