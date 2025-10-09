# @wener/sql-mcp

Unified SQL MCP server supporting multiple database backends via Knex.

## Features

- Support for MySQL, PostgreSQL, SQLite, and other Knex-compatible databases
- Unified SQL interface through MCP protocol
- Resource management for database objects
- Type-safe contracts using ORPC and Zod

## Usage

```typescript
import { createKnexSqlServiceImpl } from '@wener/sql-mcp';
import { createMcpServerHandler } from '@wener/sql-mcp';

const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydb'
  }
});

const service = createKnexSqlServiceImpl(knex);
const handler = createMcpServerHandler(service);
```

## Supported Databases

- MySQL (via mysql2)
- PostgreSQL (via pg)
- SQLite (via sqlite3)
- Any other Knex-compatible database