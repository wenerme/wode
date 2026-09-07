# @wener/mssql-mcp

A powerful Microsoft SQL Server MCP (Model Context Protocol) server that enables Claude Desktop to interact with SQL Server databases through natural language queries.

[![npm version](https://badge.fury.io/js/%40wener%2Fmssql-mcp.svg)](https://www.npmjs.com/package/@wener/mssql-mcp)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24.11.0-brightgreen.svg)](https://nodejs.org/)

## 🚀 Quick Start

### Install and Run with npx (Recommended)

```bash
# Run directly without installation
npx @wener/mssql-mcp --help

# Start with environment variables
MSSQL_SERVER=localhost MSSQL_DATABASE=mydb MSSQL_USER=sa MSSQL_PASSWORD=password npx @wener/mssql-mcp --stdio

# Start with environment file
npx @wener/mssql-mcp --env-file .env --stdio
```

### Global Installation

```bash
# Install globally
npm install -g @wener/mssql-mcp

# Run from anywhere
mssql-mcp --help
```

## ✨ Features

- 🤖 **AI-Ready**: Seamless integration with Claude Desktop and MCP protocol
- 🔍 **Smart Queries**: Execute SQL queries in CSV or JSON format through natural language
- 🔐 **Secure Authentication**: Support for SQL Server Auth, Windows Auth, and Azure SQL
- 🏢 **Enterprise Ready**: LocalDB, Azure SQL Database, and SQL Server 2008+ support
- 📊 **Data Access**: Browse database tables and their contents automatically
- 🚀 **Zero Config**: Single executable with all dependencies bundled
- 🛡️ **Read-Only Mode**: Optional safety mode for production databases

## 🏗️ Setup for Claude Desktop

### 1. Create Environment File

Create a `.env` file with your database credentials:

```bash
# Required: Database connection
MSSQL_SERVER=localhost
MSSQL_DATABASE=AdventureWorks2019
MSSQL_USER=sa
MSSQL_PASSWORD=YourPassword123

# Optional: Security and performance
MSSQL_ACCESS_MODE=readonly  # Use 'readonly' for safe querying
MSSQL_ENCRYPT=false         # Set 'true' for Azure SQL
```

### 2. Configure Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
	"mcpServers": {
		"mssql": {
			"command": "npx",
			"args": ["@wener/mssql-mcp", "--env-file", "/path/to/your/.env", "--stdio"]
		}
	}
}
```

### 3. Restart Claude Desktop

Your SQL Server database is now available to Claude! 🎉

## 📋 Environment Configuration

### SQL Server Authentication

```bash
MSSQL_SERVER=localhost
MSSQL_DATABASE=your_database
MSSQL_USER=your_username
MSSQL_PASSWORD=your_password
```

### Windows Authentication

```bash
MSSQL_SERVER=localhost
MSSQL_DATABASE=your_database
MSSQL_WINDOWS_AUTH=true
```

### Azure SQL Database

```bash
MSSQL_SERVER=yourserver.database.windows.net
MSSQL_DATABASE=your_database
MSSQL_USER=your_username
MSSQL_PASSWORD=your_password
# MSSQL_ENCRYPT=true (automatically enabled for Azure SQL)
```

### LocalDB

```bash
MSSQL_SERVER=(localdb)\\MSSQLLocalDB
MSSQL_DATABASE=MyLocalDatabase
MSSQL_WINDOWS_AUTH=true
```

### Advanced Options

```bash
# Port (default: 1433)
MSSQL_PORT=1433

# Force encryption (default: false, auto-enabled for Azure SQL)
MSSQL_ENCRYPT=true

# Access mode: 'readonly' or 'readwrite' (default: readwrite)
MSSQL_ACCESS_MODE=readonly
```

## 🛠️ Available Tools

When connected, Claude can use these capabilities:

### 📊 SQL Query Execution

- **`exec_sql_csv`**: Execute SQL queries and get results in CSV format
- **`exec_sql_json`**: Execute SQL queries and get results in JSON format
- **`get_version`**: Get SQL Server version information _(readOnlyHint: true)_

### 📂 Database Resources

- **Table Discovery**: Automatically lists all available tables
- **Table Data Access**: Browse table contents (top 100 rows per table)
- **Schema Information**: Access table structures and metadata

## 🛡️ Security Features

### Read-Only Mode

For production databases, use read-only mode:

```bash
MSSQL_ACCESS_MODE=readonly
```

This restricts operations to:

- `SELECT` statements
- `WITH` (Common Table Expressions)
- `SHOW`, `DESCRIBE`, `EXPLAIN`, `DESC` commands

### Built-in Protection

- ✅ SQL injection prevention through parameterized queries
- ✅ Table name validation and escaping
- ✅ Connection encryption for Azure SQL (auto-detected)
- ✅ Secure credential handling

## 🎯 Usage Examples

### Ask Claude to Query Your Database

> "Show me the top 10 customers by total sales from the database"

> "What tables are available in this database?"

> "Create a summary report of inventory levels by category"

> "Find all orders placed in the last 30 days"

Claude will automatically:

1. 🔍 Explore available tables
2. 📝 Write appropriate SQL queries
3. 📊 Execute queries and format results
4. 📈 Analyze and explain the data

## 🚀 Command Line Usage

### STDIO Mode (Claude Desktop)

```bash
mssql-mcp --stdio --env-file .env
```

### HTTP Mode (Development)

```bash
mssql-mcp --port 3003 --host localhost --env-file .env
```

### Command Options

- `--stdio`: Use STDIO transport (required for Claude Desktop)
- `--env-file <path>`: Load environment variables from file
- `--port <port>`: HTTP server port (default: 3003)
- `--host <host>`: HTTP server host (default: localhost)
- `--verbose`: Enable detailed logging
- `--help`: Show help information

## 🔧 Troubleshooting

### Connection Issues

```bash
# Test connection
mssql-mcp --verbose --env-file .env

# Check SQL Server is running
sqlcmd -S localhost -U sa -P yourpassword -Q "SELECT @@VERSION"
```

### Common Problems

**"Login failed"**: Check username, password, and database name
**"Server not found"**: Verify `MSSQL_SERVER` and `MSSQL_PORT`
**"SSL error"**: Set `MSSQL_ENCRYPT=false` for local development
**"Permission denied"**: Ensure user has database access permissions

### Debug Mode

```bash
# Enable verbose logging
mssql-mcp --verbose --stdio --env-file .env
```

## 📚 Example Databases

### AdventureWorks (Learning)

Perfect for testing and learning:

1. Download [AdventureWorks backup files](https://github.com/Microsoft/sql-server-samples/releases/tag/adventureworks)
2. Restore to your SQL Server instance
3. Configure connection:

```bash
MSSQL_SERVER=localhost
MSSQL_DATABASE=AdventureWorks2019
MSSQL_USER=sa
MSSQL_PASSWORD=YourPassword123
MSSQL_ACCESS_MODE=readonly  # Safe for exploration
```

### Northwind (Classic)

Great for business scenarios:

```bash
MSSQL_SERVER=localhost
MSSQL_DATABASE=Northwind
MSSQL_USER=sa
MSSQL_PASSWORD=YourPassword123
```

## 🏢 Enterprise Features

- **SQL Server 2008+ Compatibility**: Works with legacy systems
- **Connection Pooling**: Automatic connection management
- **High Availability**: Supports SQL Server clusters and availability groups
- **Multi-Database**: Connect to different databases by changing configuration
- **Audit Trail**: All queries are logged for security compliance

## 📄 License

MIT License - feel free to use in personal and commercial projects.

## 🤝 Contributing

Issues and feature requests are welcome on [GitHub](https://github.com/wenerme/wode).

## 🔗 Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol specification
- [Claude Desktop](https://claude.ai/download) - AI assistant with MCP support
- [Microsoft SQL Server](https://www.microsoft.com/sql-server/) - Database platform

---

**Made with ❤️ for the AI and SQL Server community**
