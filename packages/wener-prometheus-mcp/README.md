# @wener/prometheus-mcp

Prometheus MCP (Model Context Protocol) server with PromQL query execution and metrics exploration support.

This MCP server provides AI assistants with access to Prometheus metrics and query capabilities through standardized MCP interfaces, allowing AI assistants to execute PromQL queries, explore metrics, and analyze monitoring data.

## Features

- **PromQL Query Execution**: Execute both instant and range queries
- **Metrics Discovery**: List available metrics and get metadata
- **Target Information**: View scrape targets status and health
- **Authentication Support**: Basic auth and bearer token authentication
- **Multi-transport**: Both STDIO and HTTP transport support
- **Health Monitoring**: Built-in health check and connectivity verification
- **Multi-tenant Support**: Organization ID support for multi-tenant setups

## Installation

```bash
npm install @wener/prometheus-mcp
```

## Usage

### CLI Usage (STDIO Transport)

```bash
# Basic usage
prometheus-mcp --stdio

# With environment file
prometheus-mcp --stdio --env-file .env

# With verbose logging (not recommended for STDIO)
prometheus-mcp --stdio --verbose
```

### HTTP Server Mode

```bash
# Start HTTP server (default port 3001)
prometheus-mcp

# Custom port and host
prometheus-mcp --port 8080 --host 0.0.0.0

# With verbose logging
prometheus-mcp --verbose --port 3001
```

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PROMETHEUS_URL` | Prometheus server URL | Yes | - |
| `PROMETHEUS_USERNAME` | Username for basic authentication | No | - |
| `PROMETHEUS_PASSWORD` | Password for basic authentication | No | - |
| `PROMETHEUS_TOKEN` | Bearer token for authentication | No | - |
| `ORG_ID` | Organization ID for multi-tenant setups | No | - |
| `PROMETHEUS_READONLY` | Enable read-only mode | No | `false` |

### Example Configuration

Create a `.env` file:

```env
PROMETHEUS_URL=http://localhost:9090
PROMETHEUS_USERNAME=admin
PROMETHEUS_PASSWORD=secret
ORG_ID=my-org
PROMETHEUS_READONLY=true
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `health_check` | Health check and Prometheus connectivity verification |
| `execute_query` | Execute PromQL instant queries |
| `execute_range_query` | Execute PromQL range queries with time windows |
| `list_metrics` | List all available Prometheus metrics |
| `get_metric_metadata` | Get metadata for specific metrics |
| `get_targets` | Get information about scrape targets |

## Usage with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "prometheus": {
      "command": "npx",
      "args": ["@wener/prometheus-mcp", "--stdio"],
      "env": {
        "PROMETHEUS_URL": "http://localhost:9090"
      }
    }
  }
}
```

## Usage with Claude Code

```bash
claude mcp add prometheus --env PROMETHEUS_URL=http://localhost:9090 -- npx @wener/prometheus-mcp --stdio
```

## Development

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build
pnpm build

# Test connection
PROMETHEUS_URL=http://localhost:9090 pnpm dev --stdio
```

## Authentication

### Basic Authentication

```env
PROMETHEUS_URL=http://localhost:9090
PROMETHEUS_USERNAME=admin
PROMETHEUS_PASSWORD=password
```

### Bearer Token Authentication

```env
PROMETHEUS_URL=http://localhost:9090
PROMETHEUS_TOKEN=your-bearer-token
```

### Multi-tenant Setup

```env
PROMETHEUS_URL=http://localhost:9090
ORG_ID=tenant-1
PROMETHEUS_TOKEN=your-bearer-token
```

## API Endpoints (HTTP Mode)

- `GET /health` - Health check endpoint
- `GET /metrics` - Service metrics and status
- `POST /mcp` - MCP protocol endpoint

## Error Handling

The server includes comprehensive error handling for:
- Prometheus connectivity issues
- Authentication failures
- Invalid PromQL queries
- Network timeouts
- Configuration errors

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.