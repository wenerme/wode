# @wener/sql-mcp

Unified SQL MCP (Model Context Protocol) server using Knex.js. This package provides a single interface for working with different SQL databases (MySQL, PostgreSQL, SQLite) through the MCP protocol.

## Features

- **Unified Interface**: Single API for MySQL, PostgreSQL, and SQLite databases
- **Knex.js Integration**: Built on top of Knex.js for robust SQL query building
- **MCP Protocol**: Full Model Context Protocol implementation
- **Read/Write Operations**: Support for both read-only and read-write operations
- **Object Management**: List and describe database objects (tables, views, indexes)
- **Resource Management**: MCP resource listing and reading capabilities
- **Type Safety**: Full TypeScript support with Zod validation

## Installation

```bash
npm install @wener/sql-mcp knex
# For specific database drivers
npm install pg mysql2 sqlite3
```

## Usage

### Basic Setup

```typescript
import { createWenerSqlMcpServer } from '@wener/sql-mcp';
import knex from 'knex';

// Create Knex instance
const db = knex({
  client: 'postgresql', // or 'mysql2', 'sqlite3'
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'username',
    password: 'password',
    database: 'mydb'
  }
});

// Create MCP server
const mcpServer = createWenerSqlMcpServer({
  knex: db,
  readonly: false, // Set to true for read-only access
  prefix: 'sql' // Optional prefix for tool names
});

// Use with MCP client
const tools = await mcpServer.listTool({});
console.log('Available tools:', tools.tools.map(t => t.name));
```

### Database-Specific Examples

#### PostgreSQL
```typescript
import knex from 'knex';

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
```

#### MySQL
```typescript
import knex from 'knex';

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
```

#### SQLite
```typescript
import knex from 'knex';

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './database.sqlite'
  }
});
```

## Available Tools

The MCP server provides the following tools:

### Query Tools
- `queryCsv`: Execute read-only SQL queries and return results in CSV format
- `queryJson`: Execute read-only SQL queries and return results in JSON format
- `executeSql`: Execute any SQL operation (requires readwrite mode for write operations)

### Data Manipulation
- `executeDml`: Execute DML operations (INSERT, UPDATE, DELETE, MERGE, REPLACE)
- `executeDdl`: Execute DDL operations (CREATE, ALTER, DROP, TRUNCATE)

### Database Information
- `getVersion`: Get database server version information
- `listObjects`: List database objects (tables, views, indexes, etc.)
- `describeObject`: Describe a specific database object (table, view, etc.)

### Resource Management
- `listResources`: List available database resources (tables, views, etc.)
- `readResource`: Read data from a specific database resource

## Configuration

### WenerSqlMcpConfig

```typescript
interface WenerSqlMcpConfig {
  knex: Knex;           // Knex instance
  readonly?: boolean;   // Enable read-only mode (default: false)
  prefix?: string;      // Prefix for tool names (optional)
}
```

### KnexSqlServiceConfig

```typescript
interface KnexSqlServiceConfig {
  knex: Knex;           // Knex instance
  readonly?: boolean;   // Enable read-only mode (default: false)
}
```

## Error Handling

The service includes comprehensive error handling for:
- SQL syntax errors
- Database connection issues
- Permission violations
- Invalid resource URIs
- Unsupported operations in read-only mode

## Type Safety

All inputs and outputs are validated using Zod schemas, providing:
- Runtime type checking
- TypeScript type inference
- Clear error messages for invalid inputs

## License

MIT