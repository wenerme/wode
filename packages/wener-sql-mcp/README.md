# @wener/sql-mcp

Unified SQL MCP (Model Context Protocol) server supporting PostgreSQL, MySQL, SQLite, and MSSQL via Knex.

## Features

- 🎯 **Unified Interface**: Single MCP server for PostgreSQL, MySQL, SQLite, and MSSQL
- 🔧 **Knex-Powered**: Built on Knex.js for consistent SQL across databases
- 🚀 **Dual Transport**: Supports both STDIO (for CLI) and HTTP transports
- 🔒 **Read-Only Mode**: Optional read-only mode for safe data exploration
- 📦 **Complete SQL Tools**: Query, DML, DDL, and database introspection tools
- 📚 **Resource API**: Expose database tables as MCP resources

## Installation

```bash
npm install -g @wener/sql-mcp
# or
pnpm add -g @wener/sql-mcp
```

## Quick Start

### PostgreSQL

```bash
# Using connection URL (auto-detects database type from protocol)
DB_URL=postgresql://user:password@localhost:5432/mydb sql-mcp --stdio

# Using individual parameters (requires DB_DRIVER)
DB_DRIVER=pg DB_HOST=localhost DB_PORT=5432 DB_USER=postgres DB_PASSWORD=secret DB_DATABASE=mydb sql-mcp --stdio
```

### MySQL

```bash
# Using connection URL (auto-detects database type)
DB_URL=mysql://user:password@localhost:3306/mydb sql-mcp --stdio

# Using individual parameters (requires DB_DRIVER)
DB_DRIVER=mysql2 DB_HOST=localhost DB_PORT=3306 DB_USER=root DB_PASSWORD=secret DB_DATABASE=mydb sql-mcp --stdio
```

### SQLite

```bash
# Using file path (auto-detects from sqlite:// protocol)
DB_URL=sqlite://./mydb.sqlite sql-mcp --stdio

# Or use file:// protocol
DB_URL=file://./mydb.sqlite sql-mcp --stdio

# In-memory database (requires DB_DRIVER)
DB_DRIVER=better-sqlite3 sql-mcp --stdio
```

### MSSQL (Microsoft SQL Server)

```bash
# Using connection URL (auto-detects database type)
DB_URL=mssql://user:password@localhost:1433/mydb sql-mcp --stdio

# Using individual parameters (requires DB_DRIVER)
DB_DRIVER=mssql DB_HOST=localhost DB_PORT=1433 DB_USER=sa DB_PASSWORD=YourPassword DB_DATABASE=mydb sql-mcp --stdio

# With Windows Authentication
DB_DRIVER=mssql DB_HOST=localhost DB_DATABASE=mydb DB_USER=domain\\username sql-mcp --stdio
```

## Configuration

### Auto-Detection from URL Protocol

The server can **automatically detect** the database type from the connection URL protocol, eliminating the need for `DB_DRIVER`:

| URL Protocol | Detected Database Type | Example |
|--------------|------------------------|---------|
| `postgresql://`, `postgres://`, `pg://` | PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `mysql://`, `mysql2://` | MySQL | `mysql://user:pass@host:3306/db` |
| `sqlite://`, `sqlite3://`, `file://` | SQLite | `sqlite://./database.db` |
| `mssql://`, `sqlserver://`, `tedious://` | MSSQL | `mssql://user:pass@host:1433/db` |

> **💡 Tip**: When using a connection URL with the protocol, you can omit `DB_DRIVER` entirely!

### Database Driver Aliases

If not using a connection URL, the `DB_DRIVER` environment variable supports common aliases:

| Database | Supported Aliases |
|----------|-------------------|
| PostgreSQL | `pg`, `postgres`, `postgresql` |
| MySQL | `mysql`, `mysql2` |
| SQLite | `sqlite`, `sqlite3`, `better-sqlite3` |
| MSSQL | `mssql`, `sqlserver`, `sql-server`, `ms-sql` |

All aliases are case-insensitive.

### Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DB_URL` | Database connection URL | - | `postgresql://localhost/mydb` |
| `DB_DRIVER` | Database driver (supports aliases) | `pg` | `pg`, `postgres`, `postgresql`, `mysql`, `mysql2`, `sqlite`, `sqlite3`, `better-sqlite3`, `mssql`, `sqlserver` |
| `DB_HOST` | Database host | `localhost` | `db.example.com` |
| `DB_PORT` | Database port | `5432` (pg) / `3306` (mysql) | `5432` |
| `DB_USER` | Database user | - | `postgres` |
| `DB_PASSWORD` | Database password | - | `secret` |
| `DB_DATABASE` | Database name | - | `mydb` |
| `DB_READONLY` | Enable read-only mode | `false` | `true`, `1` |

### CLI Options

```
Usage: sql-mcp [options]

SQL MCP (Model Context Protocol) Server supporting PostgreSQL, MySQL, and SQLite via Knex

Options:
  -V, --version         output the version number
  -v, --verbose         enable verbose logging
  --env-file <path>     load environment variables from file
  -p, --port <port>     HTTP server port (default: "3000")
  -h, --host <host>     HTTP server host (default: "localhost")
  --stdio               use STDIO transport instead of HTTP
  --help               display help for command
```

## Usage Examples

### STDIO Mode (for MCP clients like Claude Desktop)

```bash
# PostgreSQL
sql-mcp --stdio --env-file .env.postgres

# MySQL
sql-mcp --stdio --env-file .env.mysql

# SQLite
DB_DRIVER=better-sqlite3 DB_URL=./app.db sql-mcp --stdio

# MSSQL
sql-mcp --stdio --env-file .env.mssql
```

### HTTP Mode (for HTTP-based MCP clients)

```bash
# Start HTTP server on port 3000
sql-mcp --port 3000

# With custom host and port
sql-mcp --host 0.0.0.0 --port 8080
```

### With Environment File

Create `.env` file:

```env
DB_URL=postgresql://postgres:password@localhost:5432/mydb
DB_DRIVER=pg
DB_READONLY=false
```

Run:

```bash
sql-mcp --stdio --env-file .env
```

## MCP Client Configuration

### Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "postgres": {
      "command": "sql-mcp",
      "args": ["--stdio"],
      "env": {
        "DB_URL": "postgresql://postgres:password@localhost:5432/mydb",
        "DB_DRIVER": "pg"
      }
    },
    "mysql": {
      "command": "sql-mcp",
      "args": ["--stdio"],
      "env": {
        "DB_URL": "mysql://root:password@localhost:3306/mydb",
        "DB_DRIVER": "mysql2"
      }
    },
    "sqlite": {
      "command": "sql-mcp",
      "args": ["--stdio"],
      "env": {
        "DB_DRIVER": "better-sqlite3",
        "DB_URL": "/path/to/database.sqlite"
      }
    },
    "mssql": {
      "command": "sql-mcp",
      "args": ["--stdio"],
      "env": {
        "DB_URL": "mssql://sa:YourPassword@localhost:1433/mydb",
        "DB_DRIVER": "mssql"
      }
    }
  }
}
```

## Available Tools

### Query Tools (Read-Only)

- **query_csv**: Execute read-only SQL queries and return results in CSV format _(readOnlyHint: true)_
- **query_json**: Execute read-only SQL queries and return results in JSON format _(readOnlyHint: true)_

### Execution Tools

- **execute_sql**: Execute any SQL operation (requires readwrite mode for write operations)
- **execute_dml**: Execute DML operations (INSERT, UPDATE, DELETE, MERGE, REPLACE)
- **execute_ddl**: Execute DDL operations (CREATE, ALTER, DROP, TRUNCATE)

### Database Introspection (Read-Only)

- **get_version**: Get database server version information _(readOnlyHint: true)_
- **list_objects**: List database objects (tables, views, indexes, etc.) _(readOnlyHint: true)_
- **describe_object**: Describe a specific database object (table, view, etc.) _(readOnlyHint: true)_

> **Note**: Tools with `readOnlyHint: true` are marked in their MCP `annotations` to indicate they don't modify data. This helps AI assistants understand which operations are safe to use without confirmation.

## Available Resources

The server automatically exposes database tables as MCP resources:

- **URI Format**: `{driver}://{schema}/{table}/data`
- **Example**: `pg://public/users/data`
- **Content**: First 100 rows of the table in JSON format

## Security

### Read-Only Mode

Enable read-only mode to prevent write operations:

```bash
DB_READONLY=true sql-mcp --stdio
```

In read-only mode:
- Write operations (INSERT, UPDATE, DELETE) are blocked
- DDL operations (CREATE, ALTER, DROP) are blocked
- Only SELECT queries are allowed

### SQL Injection Protection

- All queries use parameterized execution via Knex
- Table names are validated before use
- Input validation on all tool parameters

## Development

### Build from Source

```bash
# Clone the repository
git clone https://github.com/wenerme/wode.git
cd wode/packages/wener-sql-mcp

# Install dependencies
pnpm install

# Build
pnpm build

# Run in development mode
pnpm dev
```

### Project Structure

```
wener-sql-mcp/
├── src/
│   ├── main.ts              # CLI entry point
│   ├── index.ts             # Public API exports
│   ├── server/
│   │   ├── SqlMcpServer.ts  # Main server class
│   │   └── config.ts        # Configuration handling
│   └── scripts/
│       └── bundle.ts        # Build script
├── dist/                    # Built output
├── package.json
├── Makefile
└── README.md
```

## Architecture

The SQL MCP server is built with:

- **Knex.js**: Unified SQL query builder and connection management
- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **Hono**: HTTP server framework
- **Commander**: CLI argument parsing
- **Common/MCP**: Shared MCP utilities and contract definitions

### Service Implementation

The server uses `createKnexSqlServiceImpl` to implement the `SqlServiceContract`:

```typescript
import { createKnexSqlServiceImpl } from './sql/createKnexSqlServiceImpl';
import { SqlServiceContract } from './sql/SqlServiceContract';
import { createMcpServerHandler } from 'common/mcp';
import knex from 'knex';

const db = knex({ client: 'pg', connection: process.env.DB_URL });
const sqlService = createKnexSqlServiceImpl({ knex: db, readonly: false });
const handler = createMcpServerHandler(SqlServiceContract, sqlService);
```

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. **Check credentials**: Verify DB_URL or individual connection parameters
2. **Network access**: Ensure the database server is accessible
3. **Database exists**: Confirm the database name is correct
4. **Permissions**: Verify user has necessary permissions

### Driver Issues

If you get driver-related errors:

```bash
# Install the required database driver
npm install pg              # PostgreSQL
npm install mysql2          # MySQL
npm install better-sqlite3  # SQLite
npm install mssql tedious   # Microsoft SQL Server
```

### Verbose Logging

Enable verbose logging for debugging:

```bash
sql-mcp --verbose --stdio
```

## Related Packages

- [@wener/mssql-mcp](https://www.npmjs.com/package/@wener/mssql-mcp) - Dedicated Microsoft SQL Server MCP server with additional MSSQL-specific features
- [common](../common) - Shared MCP utilities and contracts

## MSSQL Support

This package includes MSSQL support via Knex and tedious. For a dedicated MSSQL MCP server with additional Windows Authentication features and MSSQL-specific optimizations, see [@wener/mssql-mcp](../wener-mssql-mcp).

**When to use sql-mcp vs mssql-mcp for MSSQL:**
- Use `sql-mcp` if you need a unified interface across multiple database types
- Use `mssql-mcp` if you need MSSQL-specific features or Windows Authentication

## License

MIT

## Contributing

Contributions are welcome! Please see the [main repository](https://github.com/wenerme/wode) for contribution guidelines.

## Support

- 🐛 [Report bugs](https://github.com/wenerme/wode/issues)
- 💬 [Discussions](https://github.com/wenerme/wode/discussions)
- 📧 Email: wener@wener.me
