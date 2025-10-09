#!/usr/bin/env node

import { createWenerSqlMcpServer } from './index';
import knex from 'knex';

interface CliOptions {
  client: 'postgresql' | 'mysql2' | 'sqlite3';
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  filename?: string;
  readonly?: boolean;
  prefix?: string;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    client: 'sqlite3', // default
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--client':
        options.client = nextArg as any;
        i++;
        break;
      case '--host':
        options.host = nextArg;
        i++;
        break;
      case '--port':
        options.port = parseInt(nextArg);
        i++;
        break;
      case '--user':
        options.user = nextArg;
        i++;
        break;
      case '--password':
        options.password = nextArg;
        i++;
        break;
      case '--database':
        options.database = nextArg;
        i++;
        break;
      case '--filename':
        options.filename = nextArg;
        i++;
        break;
      case '--readonly':
        options.readonly = true;
        break;
      case '--prefix':
        options.prefix = nextArg;
        i++;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Usage: wener-sql-mcp [options]

Options:
  --client <client>     Database client (postgresql, mysql2, sqlite3) [default: sqlite3]
  --host <host>         Database host
  --port <port>         Database port
  --user <user>         Database user
  --password <password> Database password
  --database <db>       Database name
  --filename <file>     SQLite database file path
  --readonly            Enable read-only mode
  --prefix <prefix>     Tool name prefix
  --help                Show this help message

Examples:
  # SQLite
  wener-sql-mcp --filename ./database.sqlite

  # PostgreSQL
  wener-sql-mcp --client postgresql --host localhost --port 5432 --user postgres --password secret --database mydb

  # MySQL
  wener-sql-mcp --client mysql2 --host localhost --port 3306 --user root --password secret --database mydb
`);
}

function createKnexConfig(options: CliOptions): knex.Knex.Config {
  const baseConfig: knex.Knex.Config = {
    client: options.client,
  };

  if (options.client === 'sqlite3') {
    return {
      ...baseConfig,
      connection: {
        filename: options.filename || ':memory:',
      },
      useNullAsDefault: true,
    };
  }

  return {
    ...baseConfig,
    connection: {
      host: options.host || 'localhost',
      port: options.port,
      user: options.user,
      password: options.password,
      database: options.database,
    },
  };
}

async function main() {
  const options = parseArgs();
  
  console.log('Creating MCP server with options:', options);

  try {
    const knexConfig = createKnexConfig(options);
    const db = knex(knexConfig);
    
    const mcpServer = createWenerSqlMcpServer({
      knex: db,
      readonly: options.readonly || false,
      prefix: options.prefix,
    });

    console.log('MCP server created successfully!');
    console.log('Available tools:');
    
    const tools = await mcpServer.listTool({});
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    console.log('\nMCP server is ready. Use an MCP client to interact with it.');
    console.log('Press Ctrl+C to exit.');

    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log('\nShutting down...');
      await db.destroy();
      process.exit(0);
    });

    // Keep alive
    setInterval(() => {}, 1000);

  } catch (error) {
    console.error('Error creating MCP server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}