# @wener/feishu-devdocs-mcp

Feishu/Lark Developer Documentation MCP server with search and recall capabilities.

This MCP server provides AI assistants with access to Feishu/Lark Open Platform developer documentation through standardized MCP interfaces, allowing AI assistants to search and recall relevant documentation, API guides, tutorials, and developer resources.

## Features

- **Developer Documentation Search**: Search through all Feishu/Lark Open Platform developer documentation
- **Smart Caching**: Local file-based caching at `~/.cache/wener-feishu-devdocs-mcp/` for improved performance
- **No Authentication Required**: Public API access, no app credentials needed
- **Multi-Domain Support**: Both Chinese (Feishu) and International (Lark) domains
- **Multi-Transport**: Both STDIO and HTTP transport support
- **Health Monitoring**: Built-in health check and connectivity verification
- **Configurable Results**: Limit and timeout configuration

## Installation

```bash
npm install @wener/feishu-devdocs-mcp
```

## Usage

### CLI Usage (STDIO Transport)

```bash
# Basic usage (default: https://open.feishu.cn)
feishu-devdocs-mcp --stdio

# International domain
feishu-devdocs-mcp --stdio --domain https://open.larksuite.com

# With environment file
feishu-devdocs-mcp --stdio --env-file .env

# With verbose logging (not recommended for STDIO)
feishu-devdocs-mcp --verbose --stdio
```

### HTTP Server Mode

```bash
# Start HTTP server (default port 3001)
feishu-devdocs-mcp

# Custom port and host
feishu-devdocs-mcp --port 8080 --host 0.0.0.0

# With verbose logging
feishu-devdocs-mcp --verbose --port 3001
```

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `FEISHU_DEVDOCS_DOMAIN` | Feishu API domain | No | `https://open.feishu.cn` |
| `FEISHU_DEVDOCS_MAX_RESULTS` | Maximum results to return | No | `5` |
| `FEISHU_DEVDOCS_TIMEOUT` | Request timeout in milliseconds | No | `10000` |
| `FEISHU_CACHE_ENABLED` | Enable/disable caching | No | `true` |
| `FEISHU_CACHE_TTL` | Cache TTL in milliseconds | No | `86400000` (24 hours) |
| `FEISHU_CACHE_DIR` | Custom cache directory path | No | `~/.cache/wener-feishu-devdocs-mcp/` |

### Example Configuration

Create a `.env` file:

```env
FEISHU_DEVDOCS_DOMAIN=https://open.feishu.cn
FEISHU_DEVDOCS_MAX_RESULTS=10
FEISHU_DEVDOCS_TIMEOUT=15000

# Cache configuration
FEISHU_CACHE_ENABLED=true
FEISHU_CACHE_TTL=86400000
# FEISHU_CACHE_DIR=/custom/cache/path  # Optional custom cache directory
```

## Caching

The MCP server implements intelligent local file-based caching to improve performance and reduce API calls:

### Cache Features
- **Automatic caching**: Search results are automatically cached by query
- **TTL-based expiration**: Configurable time-to-live (default: 24 hours)
- **SHA-256 query hashing**: Secure and collision-resistant cache keys
- **Cache cleanup**: Automatic removal of expired entries
- **Cache statistics**: Monitor cache usage and performance

### Cache Location
By default, cache files are stored in:
- **Linux/macOS**: `~/.cache/wener-feishu-devdocs-mcp/`
- **Custom path**: Set `FEISHU_CACHE_DIR` environment variable

### Cache Behavior
1. **First request**: Fetches from API and stores in cache
2. **Subsequent requests**: Returns cached result if not expired
3. **Cache miss**: Expired or non-existent cache triggers fresh API call
4. **Cache hit**: Significantly faster response times

### Disabling Cache
To disable caching entirely:
```env
FEISHU_CACHE_ENABLED=false
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `health_check` | Health check and API connectivity verification |
| `recall_developer_documents` | Search and recall developer documentation content |

### Tool: `recall_developer_documents`

**Purpose**: Search through Feishu/Lark Open Platform developer documentation

**Input**:
- `query` (string, required): Search query for developer documentation

**Output**:
- `results` (string[]): Array of documentation content snippets
- `query` (string): Original search query
- `resultCount` (number): Number of results returned

**Example Usage**:
```json
{
  "tool": "recall_developer_documents",
  "arguments": {
    "query": "how to create a Feishu bot"
  }
}
```

## Usage with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "feishu-devdocs": {
      "command": "npx",
      "args": ["@wener/feishu-devdocs-mcp", "--stdio"],
      "env": {
        "FEISHU_DEVDOCS_DOMAIN": "https://open.feishu.cn"
      }
    }
  }
}
```

## Usage with Claude Code

```bash
claude mcp add feishu-devdocs --env FEISHU_DEVDOCS_DOMAIN=https://open.feishu.cn -- npx @wener/feishu-devdocs-mcp --stdio
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
FEISHU_DEVDOCS_DOMAIN=https://open.feishu.cn pnpm dev --stdio
```

## Domain Configuration

### Feishu (China Version)
- Domain: `https://open.feishu.cn` (default)
- Suitable for users in China

### Lark (International Version)
- Domain: `https://open.larksuite.com`
- Suitable for international users

```bash
# Use international domain
FEISHU_DEVDOCS_DOMAIN=https://open.larksuite.com feishu-devdocs-mcp --stdio
```

## API Endpoints (HTTP Mode)

- `GET /health` - Health check endpoint
- `GET /tools` - Available tools information
- `POST /mcp` - MCP protocol endpoint

## What Documentation is Searched

The recall functionality searches through:
- **Developer Guides**: Getting started, tutorials, best practices
- **API References**: Server-side APIs, client-side APIs
- **SDK Documentation**: Official SDKs and libraries
- **Integration Guides**: Webhooks, OAuth, authentication
- **Platform Features**: Bots, mini-programs, documents, sheets

This covers all developer-facing documentation from the Feishu/Lark Open Platform, but does not search user documents or "Lark Docs" content.

## Error Handling

The server includes comprehensive error handling for:
- API connectivity issues
- Network timeouts
- Invalid queries
- Domain configuration errors
- Service unavailability

## Comparison with Official Lark MCP

This implementation:
- **Focused Scope**: Developer documentation only vs. full API integration
- **Zero Setup**: No app credentials or authentication required
- **Lightweight**: Minimal dependencies and simple architecture
- **Workspace Integration**: Follows established `@wener/*` patterns
- **Specialized**: Optimized for documentation search use cases

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related Projects

- [`@wener/prometheus-mcp`](../wener-prometheus-mcp) - Prometheus metrics MCP server
- [`@wener/sql-mcp`](../wener-sql-mcp) - SQL database MCP server
- [Official Lark OpenAPI MCP](https://github.com/larksuite/lark-openapi-mcp) - Full Feishu/Lark API integration