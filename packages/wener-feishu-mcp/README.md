# @wener/feishu-mcp

[![npm version](https://img.shields.io/npm/v/@wener/feishu-mcp.svg)](https://www.npmjs.com/package/@wener/feishu-mcp)
[![Node.js Version](https://img.shields.io/node/v/@wener/feishu-mcp.svg)](https://nodejs.org/)

> **⚠️ Beta Version Notice**: This tool is currently in Beta. Features and APIs may change.

Comprehensive Feishu/Lark MCP (Model Context Protocol) server with OAuth authentication and full document management capabilities. This server enables AI assistants to interact with Feishu/Lark documents, including search, creation, modification, and workspace operations.

## Features

- 🔐 **OAuth 2.0 Authentication** - Secure user authentication with automatic token refresh
- 📄 **Document Management** - Search, create, edit, and import documents
- 🔍 **Advanced Search** - Search across user workspace with filters
- 📝 **Content Operations** - Get/set document content in markdown format
- 🏢 **Workspace Integration** - Full workspace and folder operations
- 🚀 **Multiple Transports** - Support for STDIO and HTTP transports
- 🔄 **Token Management** - Automatic token refresh and secure storage

## Installation

```bash
npm install -g @wener/feishu-mcp
```

## Quick Start

### 1. Setup Environment

First, create a Feishu/Lark application and set environment variables:

```bash
export FEISHU_APP_ID=cli_your_app_id
export FEISHU_APP_SECRET=your_app_secret
export FEISHU_DOMAIN=https://open.feishu.cn  # or https://open.larksuite.com
```

### 2. Login with OAuth

```bash
feishu-mcp login
```

This will:
- Start a local OAuth callback server
- Open your browser for Feishu/Lark authentication
- Securely store your access tokens

### 3. Start MCP Server

For AI tools (Claude Desktop, Cursor, etc.):
```bash
feishu-mcp start --transport stdio
```

For HTTP interface:
```bash
feishu-mcp start --transport http --port 3000
```

### 4. Configure in Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "feishu": {
      "command": "feishu-mcp",
      "args": ["start", "--transport", "stdio"],
      "env": {
        "FEISHU_APP_ID": "cli_your_app_id",
        "FEISHU_APP_SECRET": "your_app_secret",
        "FEISHU_DOMAIN": "https://open.feishu.cn"
      }
    }
  }
}
```

## Available Tools

### Document Operations

- **search_documents** - Search documents in user workspace
- **get_document_content** - Retrieve document content as markdown
- **create_document** - Create new documents
- **import_document** - Import document from markdown
- **get_document_metadata** - Get document properties

### Authentication Tools

- **get_auth_status** - Check authentication status
- **refresh_auth_tokens** - Refresh access tokens

## CLI Commands

### Authentication

```bash
# Login to Feishu/Lark
feishu-mcp login [--port 3000] [--no-open]

# Check authentication status
feishu-mcp status

# Logout and clear tokens
feishu-mcp logout
```

### Server Management

```bash
# Start MCP server (STDIO mode for AI tools)
feishu-mcp start --transport stdio

# Start HTTP server for web interfaces
feishu-mcp start --transport http --host 0.0.0.0 --port 3000

# Show configuration
feishu-mcp config
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--transport` | Transport mode (stdio/http) | stdio |
| `--host` | HTTP server host | localhost |
| `--port` | HTTP server port | 3000 |
| `--verbose` | Enable debug logging | false |

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `FEISHU_APP_ID` | Feishu application ID | Yes | - |
| `FEISHU_APP_SECRET` | Feishu application secret | Yes | - |
| `FEISHU_DOMAIN` | Feishu domain | No | https://open.feishu.cn |
| `FEISHU_REDIRECT_URI` | OAuth redirect URI | No | http://localhost:3000/callback |
| `FEISHU_SCOPES` | OAuth scopes (comma-separated) | No | docx:document,drive:drive,contact:user.id:readonly |
| `FEISHU_TIMEOUT` | Request timeout (ms) | No | 10000 |
| `FEISHU_READONLY` | Read-only mode | No | false |

## Usage Examples

### Search Documents

```typescript
// Find documents containing "API documentation"
const results = await searchDocuments({
  query: "API documentation",
  count: 10,
  docTypes: ["docx", "sheet"]
});
```

### Create Document

```typescript
// Create a new document
const document = await createDocument({
  title: "Meeting Notes",
  docType: "docx",
  folderToken: "folder123"
});
```

### Import from Markdown

```typescript
// Import markdown content as a new document
const document = await importDocument({
  markdown: "# My Document\\n\\nContent here...",
  fileName: "imported-doc.md"
});
```

### Get Document Content

```typescript
// Get document content as markdown
const content = await getDocumentContent({
  docToken: "doc123",
  docType: "docx"
});
```

## Security

- Tokens are stored securely in the system keychain (via keytar)
- Automatic token refresh prevents expired credentials
- Support for read-only mode to limit permissions
- Configurable OAuth scopes for minimal required permissions

## Troubleshooting

### Authentication Issues

1. **No valid tokens**: Run `feishu-mcp login` to authenticate
2. **Expired tokens**: Run `feishu-mcp status` and `feishu-mcp login` if needed
3. **Invalid credentials**: Check `FEISHU_APP_ID` and `FEISHU_APP_SECRET`

### Connection Issues

1. **Network timeout**: Increase `FEISHU_TIMEOUT` environment variable
2. **Domain issues**: Ensure correct `FEISHU_DOMAIN` for your region
3. **Firewall**: Check if local OAuth callback port is accessible

### Development

```bash
# Clone and setup
git clone <repository>
cd packages/wener-feishu-mcp
pnpm install

# Run in development mode
pnpm dev login
pnpm dev start --transport stdio

# Build for production
pnpm build
```

## Related Projects

- [@wener/feishu-devdocs-mcp](../wener-feishu-devdocs-mcp) - Feishu developer documentation search
- [Feishu Open Platform](https://open.feishu.cn/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## License

MIT License - see LICENSE file for details.