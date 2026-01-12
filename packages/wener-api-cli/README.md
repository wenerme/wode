# @wener/api-cli

A lightweight CLI for interacting with REST APIs via OpenAPI specifications.

## Features

- 🔍 **Multi-source Config Discovery** - Automatically discovers API configs from multiple locations
- 📄 **OpenAPI Support** - Supports OpenAPI 3.x and Swagger 2.x specs (JSON/YAML)
- 🔄 **Environment Substitution** - Use `${VAR}` syntax in headers and URLs
- 🤖 **Agent-Optimized** - Designed for AI coding agents with schema inspection
- 📦 **Context Sharing** - Share pre-configured API specs to reduce token usage
- 💡 **Actionable Errors** - Structured error messages with recovery suggestions

## Why api-cli?

When working with AI agents, sending entire OpenAPI specs consumes significant tokens. `api-cli` solves this by:

1. **Pre-configuring** API endpoints with authentication and base URLs
2. **Sharing context** - agents only need to inspect relevant operations
3. **Reducing tokens** - no need to send full spec JSON in prompts
4. **Easy discovery** - search and find operations across multiple APIs
5. **Quick testing** - test API calls with simple commands

## Installation

```bash
# Run directly without installation
npx -y @wener/api-cli
bunx @wener/api-cli
pnpx @wener/api-cli

# Or install globally
npm install -g @wener/api-cli
pnpm add -g @wener/api-cli
```

## Configuration

The CLI discovers API configuration from multiple sources in priority order:

1. **Project-level configs** (checked first):
	- `./.api-cli.local.json` (local overrides, highest priority, gitignored)
	- `./.api-cli.json` (project config)

2. **User-level configs**:
	- `~/.api-cli.local.json`
	- `~/.api-cli.json`

> **Tip**: Use `.api-cli.local.json` to store API keys and secrets. Add it to `.gitignore` to prevent committing
> sensitive data.

### Config Format

```json
{
	"env": {
		"API_TOKEN": "your-secret-token",
		"API_SECRET": "your-secret-key"
	},
	"servers": {
		"petstore": {
			"url": "https://petstore.swagger.io/v3/openapi.json",
			"baseUrl": "https://petstore.swagger.io/v3",
			"headers": {
				"Authorization": "Bearer ${API_TOKEN}"
			},
			"type": "openapi"
		},
		"local-api": {
			"url": "./specs/my-api.yaml",
			"baseUrl": "http://localhost:3000"
		}
	}
}
```

| Field     | Description                                              |
|-----------|----------------------------------------------------------|
| `env`     | Environment variables to set (for `${VAR}` substitution) |
| `servers` | Server configurations                                    |
| `url`     | OpenAPI spec URL (remote) or file path (local)           |
| `baseUrl` | API base URL (auto-detected from spec if not provided)   |
| `headers` | Default request headers                                  |
| `type`    | Spec type: `openapi` (default) or `swagger`              |

### Environment Variable Substitution

Use `${VAR_NAME}` syntax anywhere in the config. Values are substituted at load time.

You can define environment variables in two ways:

1. **In config file** (recommended for secrets in `.api-cli.local.json`):

```json
{
	"env": {
		"API_TOKEN": "your-secret-token"
	},
	"servers": {
		"my-api": {
			"url": "${API_SPEC_URL}",
			"headers": {
				"Authorization": "Bearer ${API_TOKEN}"
			}
		}
	}
}
```

2. **From shell environment**:

```bash
export API_TOKEN="your-secret-token"
api-cli get my-api/endpoint
```

Environment variables from config files are applied in priority order (higher priority configs override lower). Missing
variables result in a warning (not an error).

## Usage

```bash
api-cli [options] [command]
```

### Global Options

| Option                    | Description                    |
|---------------------------|--------------------------------|
| `-c, --config <path>`     | Path to specific config file   |
| `-j, --json`              | Output as JSON (for scripting) |
| `-d, --with-descriptions` | Include operation descriptions |
| `-h, --help`              | Show help                      |
| `-V, --version`           | Show version                   |

### Commands

#### `servers` - List all servers and operations

```bash
# List all servers with operations
api-cli servers

# Include descriptions
api-cli servers -d

# Show config sources
api-cli servers --show-sources

# JSON output
api-cli servers --json
```

Example output:

```
petstore
  • findPetsByStatus
  • getPetById
  • addPet
  • updatePet
  • deletePet

text2video
  • createText2Video
```

#### `ops [server]` - List available operations

```bash
# List all operations
api-cli ops

# List operations from a specific server
api-cli ops petstore

# Filter by tag
api-cli ops petstore --tag pet

# Filter by HTTP method
api-cli ops petstore --method POST
```

#### `grep <pattern>` - Search operations by glob pattern

```bash
# Find pet-related operations
api-cli grep "*pet*"

# Search with descriptions
api-cli grep "*create*" -d
```

#### `info <target>` - Show server or operation details

```bash
# Show server details
api-cli info petstore

# Show operation schema by operationId
api-cli info petstore/getPetById

# Show operation by path (shows all methods for that path)
api-cli info petstore/pet
api-cli info petstore/pet/123

# JSON output
api-cli info petstore/getPetById --json
```

Example output:

```
Operation: getPetById
  Method: GET
  Path: /pet/{petId}
  Summary: Find pet by ID
  Tags: pet

Parameters:
  petId (path, required): integer
    ID of pet to return

Responses:
  200: successful operation
    Schema:
      {
        "id": integer
        "name": string (required)
        "status": "available" | "pending" | "sold"
      }
  404: Pet not found
```

#### HTTP Method Commands - Execute API requests

```bash
# GET request
api-cli get petstore/getPetById '{"petId": 1}'
api-cli get petstore/pet/1

# POST request
api-cli post petstore/addPet '{"name": "doggie", "status": "available"}'

# PUT request
api-cli put petstore/updatePet '{"id": 1, "name": "doggie", "status": "sold"}'

# DELETE request
api-cli delete petstore/deletePet '{"petId": 1}'

# PATCH request
api-cli patch myapi/updateUser '{"id": 1, "name": "new name"}'

# Add custom headers
api-cli get petstore/getPetById '{"petId": 1}' -H "X-Custom=value"

# Read JSON from stdin
echo '{"name": "cat"}' | api-cli post petstore/addPet -

# Using heredoc for complex JSON
api-cli post petstore/addPet - <<'EOF'
{
  "name": "doggie",
  "photoUrls": ["http://example.com/photo.jpg"],
  "status": "available"
}
EOF
```

#### `call <target> [args]` - Execute any API operation

Alternative syntax using METHOD/path format:

```bash
# By operationId
api-cli call petstore/getPetById '{"petId": 1}'

# By METHOD/path
api-cli call petstore/GET/pet/1
api-cli call petstore/POST/pet '{"name": "doggie"}'
```

#### `add <name> <spec-url>` - Add server configuration

```bash
# Add from remote URL
api-cli add petstore https://petstore.swagger.io/v3/openapi.json

# Add with base URL override
api-cli add myapi https://example.com/openapi.json --base-url https://api.example.com

# Add with default headers
api-cli add myapi https://example.com/openapi.json -H "Authorization=Bearer token"
```

#### `rm <names...>` - Remove server configuration

```bash
# Remove single server
api-cli rm petstore

# Remove multiple servers
api-cli rm petstore myapi
```

## Environment Variables

| Variable              | Description                                  | Default |
|-----------------------|----------------------------------------------|---------|
| `API_CLI_CONFIG_PATH` | Path to config file                          | (none)  |
| `API_CLI_CONFIG`      | Inline JSON config (alternative to file)     | (none)  |
| `API_CLI_DEBUG`       | Enable debug output                          | `false` |
| `API_CLI_TIMEOUT`     | Request timeout (seconds)                    | `30`    |

### Inline Configuration

Use `API_CLI_CONFIG` for quick testing or CI/CD environments:

```bash
# Inline config via environment variable
export API_CLI_CONFIG='{"servers":{"petstore":{"url":"https://petstore3.swagger.io/api/v3/openapi.json"}}}'
api-cli servers

# One-liner
API_CLI_CONFIG='{"servers":{"myapi":{"url":"./spec.json","baseUrl":"http://localhost:3000"}}}' api-cli get myapi/health
```

## Using with AI Agents

Add this to your AI agent's system prompt:

```
API CLI Command
You have access to an `api-cli` CLI command for interacting with REST APIs.

**MANDATORY PREREQUISITE**
You MUST call 'api-cli info <server>/<operation>' BEFORE ANY API call.

Available Commands:
# STEP 1: ALWAYS CHECK SCHEMA FIRST (MANDATORY)
api-cli info <server>/<operation>           # REQUIRED before ANY call

# STEP 2: Only after checking schema, make the call
api-cli get <server>/<operation> '<json>'   # GET request
api-cli post <server>/<operation> '<json>'  # POST request
api-cli put <server>/<operation> '<json>'   # PUT request
api-cli delete <server>/<operation> '<json>'# DELETE request

# Discovery commands
api-cli servers                             # List all API servers
api-cli ops [server]                        # List available operations
api-cli grep <pattern>                      # Search operations
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

## Related Projects

- [@wener/mcp-cli](https://github.com/wenerme/wode/tree/main/packages/wener-mcp-cli) - MCP server CLI with similar
	design patterns

## License

MIT
