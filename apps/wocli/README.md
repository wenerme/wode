# woctl

A command-line toolkit for searching the web, calling MCP tools, working with AI models, and rendering Markdown or structured data. Keep service connections in named contexts and use the same commands across environments.

[简体中文](README.zh-Hans.md)

## Install

Requires **Node.js 24.11 or later**.

```sh
npm install -g woctl
woctl --help
```

Or run without a global installation:

```sh
npx woctl --help
```

The npm package contains a single CLI bundle. The executable is `woctl`; `wocli` is also available as a compatibility alias after installation.

## Try it

Render Markdown or convert data without any service configuration:

```sh
woctl md --text '# Hello'
printf '{"name":"Ada","active":true}' | woctl render - --input json --format yaml
```

Add a free DuckDuckGo search connection:

```sh
woctl service add search --provider duckduckgo
woctl ddg search 'MCP protocol' --limit 5 --json
```

Service commands appear when the selected context has a matching enabled service. If a command is missing, check `woctl service list` and `woctl context show`.

## Configuration

The default configuration file is `~/.wode/woctl.yaml`:

```yaml
version: 1
currentContext: local
services:
  - name: search
    type: duckduckgo
```

Each service has a unique `name` and a `type` identifying its adapter. Set `disabled: true` to keep a connection in your configuration without allowing calls.

Use a different file with `--config` or `WOCTL_CONFIG`:

```sh
woctl --config ./woctl.yaml service list
```

### Contexts

A context groups connections and settings for one environment. Shared settings live in `woctl.yaml`; context-specific settings live alongside it in `woctl.<context>.yaml`, such as `woctl.dev.yaml`.

```sh
woctl context create dev
woctl context use dev
woctl context show --json
woctl service list --context local --json
```

`context use` changes your saved default. `--context` selects a context for one invocation. Selection follows `--context` → `WOCTL_CONTEXT` → `currentContext` → `local`.

A context inherits shared services. A service with the same name replaces the shared entry in full. Removing a context's own entry can reveal the inherited entry again. Configuration-editing commands save service and AI changes to the selected context file. Saving preserves extra fields but rewrites YAML formatting and comments.

| Variable | Purpose |
| --- | --- |
| `WOCTL_CONFIG` | Configuration file path |
| `WOCTL_CONTEXT` | Context for this invocation |
| `WOCTL_LOG_LEVEL` | Log level; also available as `--log-level` |

The older `WOCLI_*` variables remain readable as fallbacks. `WOCTL_*` takes precedence. Existing configuration files can be selected explicitly with `--config`.

## Search

```sh
woctl ddg search 'TypeScript documentation' --limit 5
woctl duckduckgo search 'MCP examples' --offset 10 --json
```

DuckDuckGo search requires no API key. It uses Instant Answer results when available, then falls back to HTML search. A nonzero offset uses HTML search directly.

When you have several search connections, select one explicitly or set a default:

```sh
woctl ddg search 'TypeScript' --service search --json
woctl service default set duckduckgo search
```

## MCP

Add MCP servers under `mcpServers` in your shared or context configuration:

```yaml
mcpServers:
  local-tools:
    transport: stdio
    command: node
    args: [/path/to/mcp-server.mjs]
  remote-tools:
    transport: http
    url: https://example.com/mcp
    headers:
      Authorization: Bearer <your-token>
    timeout: 30000
```

Replace the example paths, URLs, and token before use. Headers are explicit values; `${VARIABLE}` interpolation is not supported. Stdio connections also accept `env` and `cwd`. Set `enabled: false` to disable a server.

```sh
woctl mcp servers --json
woctl mcp tools local-tools --json
woctl mcp info local-tools tool-name --json
woctl mcp call local-tools tool-name '{"query":"example"}' --json
woctl mcp resources local-tools --json
woctl mcp read local-tools 'resource://example' --json
woctl mcp grep '*search*' --json
```

`mcp list` is an alias for `mcp servers`. Listing configured servers does not connect to them. Discovery and call commands open a connection and close it when done. HTTP connections support Streamable HTTP responses, including SSE. The CLI acts as an MCP client; it does not expose an MCP gateway.

## AI models and prompts

Configure a provider and a model, then select it as the default:

```sh
export OPENAI_API_KEY='your-api-key'
woctl provider add openai --api openai --url https://api.openai.com/v1 --api-key-env OPENAI_API_KEY
woctl model add chat --provider openai --id gpt-4.1
woctl model use openai/chat
woctl prompt 'Explain this error' --stream
```

Supported protocols include OpenAI Chat Completions, OpenAI Responses, Anthropic, and Gemini. Use the model ID supported by your provider. Anthropic models require a `--max-output-tokens` setting when added.

Save reusable prompt templates:

```sh
woctl prompt import summarize --text 'Summarize {{text}}'
woctl prompt render summarize --var text='An article to summarize'
woctl prompt @summarize --var text='An article to summarize'
```

`prompt render` works offline. `--dump` displays a redacted request without sending it. Use `--json` for the complete response or `--jsonschema` for structured output. `p` is an alias for `prompt`.

## Services and output

Inspect connections and discover their available operations:

```sh
woctl service providers
woctl service list --json
woctl service inspect search
woctl service call search search --input '{"query":"MCP protocol"}' --json
```

`service call` accepts JSON through `--input`, `@file.json`, or `-` for stdin. Service calls default to read-only operations. Allow writes explicitly with `readOnly: false` or `service add --writable` when a service needs them.

The HTTP service adapter connects to a compatible service endpoint with `GET /service/{id}/schema` and `POST /service/{id}/call`. It is separate from the MCP HTTP transport.

Use `--json` for scriptable output. Commands that support tabular output also offer `--output` and field selection through `--format`; see the command's help for details.

### Render files

```sh
woctl render README.md --no-color
woctl render input.json --format table
woctl render article.md --format text -o article.txt
```

The renderer recognizes Markdown, JSON, JSONL, YAML, and code by filename. For stdin, specify the input type with `--input`. In `render`, `-o/--output` selects an output file and `-f/--format` selects the rendering format.

## Troubleshooting

```sh
woctl info --json
woctl context check --json
woctl service verify --strict --json
woctl --verbose service list
```

`info` shows the runtime and configuration summary, including the selected file. Configuration checks run offline; they do not verify remote connectivity or credentials. `--strict` treats warnings, such as unsupported service types, as failures. Logs go to stderr so JSON output remains usable in pipelines.

For command-specific options:

```sh
woctl mcp call --help
woctl ddg search --help
woctl prompt --help
```

[Source code](https://github.com/wenerme/wode/tree/develop/apps/wocli) · [Report an issue](https://github.com/wenerme/wode/issues)
