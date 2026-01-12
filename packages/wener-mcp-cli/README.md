# @wener/mcp-cli

A lightweight CLI for interacting with [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) servers.

## Features

- 🔍 **Multi-source Config Discovery** - Automatically discovers MCP configs from Claude, Cursor, Gemini, and standard locations
- 📍 **Source Tracking** - Shows where each server config was found
- 🔄 **Deduplication** - Handles duplicate server names across configs with warnings
- 🤖 **Agent-Optimized** - Designed for AI coding agents
- 🔌 **Universal** - Supports both stdio and HTTP MCP servers
- 💡 **Actionable Errors** - Structured error messages with recovery suggestions

## Installation

```bash
# Run directly without installation
npx -y @wener/mcp-cli
bunx @wener/mcp-cli
pnpx @wener/mcp-cli

# Or install globally
npm install -g @wener/mcp-cli
pnpm add -g @wener/mcp-cli
```

## Configuration

The CLI discovers MCP configuration from multiple sources in priority order:

1. **Project-level configs** (checked first):
   - `./.mcp-cli.local.json` (local overrides, highest priority, gitignored)
   - `./.mcp-cli.json` (mcp-cli specific)
   - `./.mcp.json` (Claude standard)
   - `./.cursor/mcp.json`
   - `./.gemini/mcp_config.json`
   - `./mcp_servers.json`

2. **User-level configs**:
   - `~/.mcp-cli.local.json`
   - `~/.mcp-cli.json`
   - `~/.claude.json` (with `mcpServers` key)
   - `~/.cursor/mcp.json`
   - `~/.gemini/antigravity/mcp_config.json`
   - `~/.mcp_servers.json`
   - `~/.config/mcp/mcp_servers.json`

> **Tip**: Use `.mcp-cli.local.json` to store local environment variables and secrets. Add it to `.gitignore` to prevent committing sensitive data.

### Config Format

All config files use the same basic structure:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"]
    },
    "remote-server": {
      "url": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

**Note:** Gemini config uses `serverUrl` instead of `url` - both are supported.

### Environment Variable Substitution

Use `${VAR_NAME}` syntax anywhere in the config. Values are substituted at load time.

The CLI also reads environment variables from Claude settings files:
- `~/.claude/settings.json`
- `.claude/settings.local.json`

Missing environment variables result in a warning (not an error), and the original `${VAR}` is preserved in the config value.

## Usage

```bash
mcp-cli [options] [command]
```

### Global Options

| Option | Description |
|--------|-------------|
| `-c, --config <path>` | Path to specific config file |
| `-j, --json` | Output as JSON (for scripting) |
| `-d, --with-descriptions` | Include tool descriptions |
| `-h, --help` | Show help |
| `-V, --version` | Show version |

### Commands

#### `servers` - List all servers and tools

```bash
# List all servers
mcp-cli servers

# Include descriptions
mcp-cli servers -d

# Show config sources
mcp-cli servers --show-sources

# JSON output
mcp-cli servers --json
```

#### `tools [server]` - List available tools

```bash
# List all servers
mcp-cli tools

# List tools from a specific server
mcp-cli tools filesystem
```

#### `grep <pattern>` - Search tools by glob pattern

```bash
# Find file-related tools
mcp-cli grep "*file*"

# Search with descriptions
mcp-cli grep "*search*" -d
```

#### `info <target>` - Show server or tool details

```bash
# Show server details
mcp-cli info filesystem

# Show tool schema
mcp-cli info filesystem/read_file
```

#### `call <target> [args]` - Execute a tool

```bash
# Call a tool with JSON arguments
mcp-cli call filesystem/read_file '{"path": "./README.md"}'

# Read JSON from stdin
echo '{"path": "./file"}' | mcp-cli call server/tool -

# Using heredoc for complex JSON
mcp-cli call server/tool - <<EOF
{"content": "Text with 'quotes'"}
EOF
```

#### `resources [server]` - List MCP resources

```bash
# List resources from all servers
mcp-cli resources

# List resources from specific server
mcp-cli resources filesystem
```

#### `read <target>` - Read an MCP resource

```bash
mcp-cli read filesystem/file:///path/to/file
```

#### `add` - Add MCP server configuration

Add server configuration to `.mcp-cli.json`. Follows Claude's syntax.

```bash
# Add HTTP server
mcp-cli add --transport http notion https://mcp.notion.com/mcp

# Add SSE server
mcp-cli add --transport sse asana https://mcp.asana.com/sse

# Add stdio server (default transport)
mcp-cli add airtable npx -y airtable-mcp-server

# Add stdio server with environment variable
mcp-cli add --env AIRTABLE_API_KEY=YOUR_KEY airtable npx -y airtable-mcp-server

# Add with multiple env vars
mcp-cli add -e API_KEY=key1 -e SECRET=secret2 myserver npx my-server
```

#### `rm <names...>` - Remove MCP server configuration

Remove server configuration(s) from `.mcp-cli.json`.

```bash
# Remove single server
mcp-cli rm notion

# Remove multiple servers
mcp-cli rm notion asana airtable
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_CONFIG_PATH` | Path to config file | (none) |
| `MCP_DEBUG` | Enable debug output | `false` |
| `MCP_TIMEOUT` | Request timeout (seconds) | `1800` (30 min) |
| `MCP_CONCURRENCY` | Parallel server connections | `5` |
| `MCP_MAX_RETRIES` | Retry attempts for transient errors | `3` |
| `MCP_RETRY_DELAY` | Base retry delay (milliseconds) | `1000` |
| - | Missing env vars are now warnings (never errors) | - |

## Using with AI Agents

Add this to your AI agent's system prompt:

```
MCP CLI Command
You have access to an `mcp-cli` CLI command for interacting with MCP servers.

**MANDATORY PREREQUISITE**
You MUST call 'mcp-cli info <server>/<tool>' BEFORE ANY 'mcp-cli call <server>/<tool>'.

Available Commands:
# STEP 1: ALWAYS CHECK SCHEMA FIRST (MANDATORY)
mcp-cli info <server>/<tool>             # REQUIRED before ANY call
# STEP 2: Only after checking schema, make the call
mcp-cli call <server>/<tool> '<json>'    # Only run AFTER mcp-cli info
mcp-cli call <server>/<tool> -           # Invoke with JSON from stdin

# Discovery commands
mcp-cli servers                          # List all connected MCP servers
mcp-cli tools [server]                   # List available tools
mcp-cli grep <pattern>                   # Search tool names and descriptions
mcp-cli resources [server]               # List MCP resources
mcp-cli read <server>/<resource>         # Read an MCP resource
```

## Development

```bash
# Run tests
pnpm test

# Run in development mode
npx tsx src/index.ts --help

# Build
pnpm build
```

## References

- [philschmid/mcp-cli](https://github.com/philschmid/mcp-cli) - A lightweight Bun-based CLI for MCP servers that inspired this implementation
- Claude Code's experimental MCP CLI (`ENABLE_EXPERIMENTAL_MCP_CLI=true mcp-cli`)
- [system-prompt-mcp-cli.md](./system-prompt-mcp-cli.md)
  - https://github.com/Piebald-AI/claude-code-system-prompts/blob/main/system-prompts/system-prompt-mcp-cli.md

## License

MIT
