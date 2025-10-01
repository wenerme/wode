# MSSQL MCP Server

A standalone Microsoft SQL Server MCP (Model Context Protocol) server implementation using TypeScript and the `mssql` package.

This server provides identical functionality to the Python reference implementation while using the modern Node.js `mssql` library with built-in connection pooling.

## Features

- 🔍 List database tables as MCP resources
- 📊 Execute SQL queries (SELECT, INSERT, UPDATE, DELETE) via MCP tools
- 🔐 SQL Server authentication support
- 🏢 LocalDB and Azure SQL support
- 🔌 Custom port configuration
- 🚀 Both STDIO and HTTP transport support
- 🏊 Built-in connection pooling via `mssql` package

## Environment Variables

Configure the server using these environment variables (matching the Python reference implementation exactly):

### Required Variables

**For SQL Server Authentication:**

```bash
MSSQL_SERVER=localhost          # SQL Server hostname/IP
MSSQL_DATABASE=your_database    # Database name (required)
MSSQL_USER=your_username        # Username (required for SQL auth)
MSSQL_PASSWORD=your_password    # Password (required for SQL auth)
```

**For Windows Authentication:**

```bash
MSSQL_SERVER=localhost          # SQL Server hostname/IP
MSSQL_DATABASE=your_database    # Database name (required)
MSSQL_WINDOWS_AUTH=true         # Use Windows authentication
# Note: MSSQL_USER and MSSQL_PASSWORD are not needed for Windows auth
```

### Optional Variables

```bash
MSSQL_PORT=1433                 # Port number (default: 1433)
MSSQL_ENCRYPT=true              # Force encryption (default: false)
MSSQL_COMMAND=execute_sql       # Custom tool command name (default: execute_sql)
MSSQL_WINDOWS_AUTH=true         # Use Windows authentication (default: false)
```

### Environment File Support

You can use an environment file instead of setting variables manually:

1. **Copy the example file**:

   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file** with your database credentials

3. **Run with environment file**:
   ```bash
   pnpm node src/cmds/mssql-mcp/main.ts serve --env-file .env --stdio
   ```

**Environment file format** (supports comments and quoted values):

```bash
# Database connection settings
MSSQL_SERVER=localhost
MSSQL_DATABASE="my database"
MSSQL_USER=myuser
MSSQL_PASSWORD='mypassword'

# Optional settings
MSSQL_PORT=1433
MSSQL_ENCRYPT=false
```

**Note**: Environment variables set in your shell take precedence over those in the file.

### Special Connection Types

**LocalDB**: Use format `(localdb)\instance_name` with Windows Authentication

```bash
MSSQL_SERVER=(localdb)\MSSQLLocalDB
MSSQL_DATABASE=MyDatabase
MSSQL_WINDOWS_AUTH=true
```

**Windows Authentication**: Use integrated security

```bash
MSSQL_SERVER=MyServer
MSSQL_DATABASE=MyDatabase
MSSQL_WINDOWS_AUTH=true
```

**Azure SQL**: Automatically detected and encrypted

```bash
MSSQL_SERVER=your-server.database.windows.net
MSSQL_USER=your_username
MSSQL_PASSWORD=your_password
# Encryption is automatically enabled for Azure SQL
```

## Installation

1. Install dependencies:

```bash
pnpm install
```

The server uses these key packages:

- `mssql` - Microsoft SQL Server client for Node.js (uses tedious driver by default)
- `@modelcontextprotocol/sdk` - MCP SDK

## Usage

### STDIO Mode (for Claude Desktop)

```bash
# Using environment variables
pnpm node src/cmds/mssql-mcp/main.ts serve --stdio

# Using environment file
pnpm node src/cmds/mssql-mcp/main.ts serve --env-file .env --stdio
```

### HTTP Mode (for development/testing)

```bash
# Using environment variables
pnpm node src/cmds/mssql-mcp/main.ts serve --port 3003 --host localhost

# Using environment file
pnpm node src/cmds/mssql-mcp/main.ts serve --env-file .env --port 3003 --host localhost
```

### Command Line Options

- `--stdio`: Use STDIO transport (default for Claude Desktop integration)
- `--port <port>`: HTTP server port (default: 3003)
- `--host <host>`: HTTP server host (default: localhost)
- `--env-file <path>`: Load environment variables from file
- `--verbose`: Enable verbose logging

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
	"mcpServers": {
		"mssql": {
			"command": "pnpm",
			"args": ["node", "src/cmds/mssql-mcp/main.ts", "serve", "--stdio"],
			"cwd": "/path/to/wener-node-server/apps/server",
			"env": {
				"MSSQL_SERVER": "localhost",
				"MSSQL_DATABASE": "your_database",
				"MSSQL_USER": "your_username",
				"MSSQL_PASSWORD": "your_password"
			}
		}
	}
}
```

## MCP Features

### Tools

- **SQL Execution**: Execute any SQL query via the configurable tool (default: `execute_sql`)
  - Supports SELECT, INSERT, UPDATE, DELETE queries
  - Returns results in CSV format for SELECT queries
  - Returns affected row count for modification queries

### Resources

- **Table Data**: Access table contents via `mssql://table_name/data` URIs
  - Lists all tables as discoverable resources
  - Returns top 100 rows per table in CSV format
  - Validates table names to prevent SQL injection

## Security

- **SQL Injection Prevention**: All table names are validated and escaped
- **Connection Validation**: Built-in connection validation via `mssql` package
- **Encryption Support**: Configurable encryption for secure connections

## Connection Pool Configuration

The server uses the built-in connection pooling from the `mssql` package with these settings:

- **Min Connections**: 0
- **Max Connections**: 10
- **Idle Timeout**: 30 seconds
- **Automatic connection management**: Handled by the `mssql` package

## Project Structure

```
src/cmds/mssql-mcp/
├── main.ts                     # CLI entry point
├── server/
│   ├── MssqlMcpServer.ts      # Main MCP server class
│   ├── config.ts              # Environment variable configuration
│   └── connection.ts          # mssql package connection wrapper
├── tools/
│   └── index.ts               # SQL execution tool
└── resources/
    └── index.ts               # Table listing and data resources
```

## Error Handling

The server includes comprehensive error handling:

- Database connection failures are logged and reported
- Invalid SQL queries return descriptive error messages
- Connection pool exhaustion is handled gracefully by the `mssql` package
- All errors are logged with contextual information

## Logging

Uses `consola` for structured logging with these tags:

- `mssql-config`: Configuration and environment variable processing
- `mssql-connection`: Database connection and pooling
- `mssql-tools`: SQL tool execution
- `mssql-resources`: Resource handling and table access
- `mssql-mcp-server`: Main server lifecycle events

Enable verbose logging with `--verbose` flag for detailed debugging information.
