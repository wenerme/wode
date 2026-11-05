# woctl

A command-line toolkit for searching and fetching the web, working with PDF and Excel files, calling MCP tools, using AI models, and rendering Markdown or structured data. Keep service connections in named contexts and use the same commands across environments.

[English](https://github.com/wenerme/wode/blob/develop/apps/woctl/README.md) | [简体中文](https://github.com/wenerme/wode/blob/develop/apps/woctl/README.zh-Hans.md)

[Service guides, command conventions and coverage](https://github.com/wenerme/wode/blob/develop/docs/woctl/README.md)

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

The npm package contains a single CLI bundle. PDF and Excel runtime dependencies, including their WASM assets, are installed automatically. The executable is `woctl`.

## Try it

Render Markdown or convert data without any service configuration:

```sh
woctl md --text '# Hello'
printf '{"name":"Ada","active":true}' | woctl render - --input json --format yaml
```

Add a free DuckDuckGo search connection:

```sh
woctl service add search --type duckduckgo
woctl search 'MCP protocol' --limit 5 --json
woctl ddg search 'MCP protocol' --limit 5 --json
```

Service commands appear when the selected context has a matching enabled service. If a command is missing, check `woctl service list` and `woctl context show`.

## Configuration

Inspect every registered command and service type without loading configuration:

```sh
woctl catalog --output md
woctl catalog --service-type sql --output typescript
woctl catalog --output jsonschema
```

The catalog also supports JSON and `--output-file`. Its JSON Schema describes the catalog document. See the [generated command reference](https://github.com/wenerme/wode/blob/develop/docs/woctl/reference.md) and [registration guide](https://github.com/wenerme/wode/blob/develop/docs/woctl/development.md).

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
woctl search 'TypeScript documentation' --limit 5
woctl ddg search 'TypeScript documentation' --limit 5
woctl duckduckgo search 'MCP examples' --offset 10 --json
```

`search` selects any configured service with the search capability, including DuckDuckGo and Exa. Set a default with `woctl service default set search <name>`. `ddg search` remains specific to DuckDuckGo.

DuckDuckGo search requires no API key. It uses Instant Answer results when available, then falls back to HTML search. A nonzero offset uses HTML search directly.

When you have several search connections, select one explicitly or set a default:

```sh
woctl ddg search 'TypeScript' --service search --json
woctl service default set duckduckgo search
```

## Fetch pages

```sh
woctl service add reader --type direct
woctl fetch https://example.com/ --service reader
woctl fetch https://example.com/ --service reader --no-main --json
```

Fetch providers include direct HTTP, Jina, and Exa. HTML is converted to Markdown, with main-content extraction enabled by default. Use `--no-main` to keep the whole page. Set `woctl service default set fetch <name>` when several connections are configured. Both `search` and `fetch` support `--list-services` and explicit `--service` selection.

Search and fetch can also be combined with `woctl search 'query' --fetch` or `--fetch-limit 3`; select a fetch connection independently with `--fetch-service <name>`. Use `--raw --json` to inspect a provider response with authentication data redacted.

## PDF and Excel

These local commands do not require service configuration:

```sh
woctl pdf info document.pdf --json
woctl pdf inspect document.pdf --detail full --text --json
woctl pdf read document.pdf --pages 1-3
woctl pdf parse --list-templates
woctl pdf render document.pdf --page 1 --output page.png
woctl xlsx list workbook.xlsx
woctl xlsx read workbook.xlsx --sheet Data --header --output csv
woctl xlsx edit --create --out workbook.xlsx --csv-file rows.csv
woctl xlsx tidy workbook.xlsx --out compact.xlsx
woctl xlsx export workbook.xlsx --out-dir exported --bom
woctl render document.pdf --format text
woctl render workbook.xlsx --sheet Data --format csv
```

PDF tools cover metadata, inspection, text extraction, template parsing, and PNG rendering. XLSX tools cover worksheets, properties, ranges, cell and style editing, cleanup, and CSV export. Overwriting an input workbook requires `--in-place`; `tidy` rebuilds the workbook and drops drawings and other complex structures. See the [document guide](https://github.com/wenerme/wode/blob/develop/docs/woctl/documents.md) for options and examples.

## SQL

SQL is a registered service with SQLite and PostgreSQL native drivers:

```sh
woctl service add scratch --type sqlite --option filename=:memory:
woctl sql query 'SELECT 42 AS answer' --service scratch --json
woctl sql query @query.sql --service scratch --json
woctl sql --list-services --json
woctl service type sql --typescript
```

The CLI also provides `ping`, `explain`, `table list`, `table info`, and `exec`. Queries bind parameters and enforce read-only execution. Writes require both a writable service and `--yes`; they are rejected before reading input files or creating a connection when those conditions are missing. `service inspect` and TypeScript discovery expose the service methods and result types. See the [SQL guide](https://github.com/wenerme/wode/blob/develop/docs/woctl/service/sql.md).

## Redis and Valkey

Redis uses the same service registration and selection flow:

```sh
woctl service add cache --type redis --base-url redis://localhost:6379/0
woctl redis ping --service cache --json
woctl redis get example --service cache --json
woctl redis scan --all --match 'app:*' --service cache --json
woctl redis hgetall user:example --service cache --json
woctl redis xrange events --count 20 --service cache --json
woctl service type redis --typescript
```

`valkey` is an alias. The service preserves the source's read-only operations, key-prefix isolation, TLS, timeouts, retry settings, response limits, and connection cleanup. Configure credentials through `env://NAME` option values, resolved only when calling the service. Node injects the native driver; browser bundles do not include it. See the [Redis guide](https://github.com/wenerme/wode/blob/develop/docs/woctl/service/redis.md).

## Text to speech

Generate MP3 speech without configuring an API key using the built-in Edge provider:

```sh
woctl tts 'Hello' --output-file hello.mp3
woctl tts voices --locale zh-CN
woctl tts --input @speech.txt --output-file speech.mp3
```

The default voice is `zh-CN-XiaoxiaoNeural`. Edge uses an internal online protocol whose availability can change. Configure an `openai-tts` service to use a compatible model endpoint, select it with `--service`, and override its `--model` or `--voice`. See the [TTS guide](https://github.com/wenerme/wode/blob/develop/docs/woctl/service/tts.md).

## Linear

Configure a `linear` service with `options.apiKeyEnv` or `options.accessTokenEnv`, then use the complete issue and comment command set:

```sh
woctl linear status
woctl linear team ls
woctl linear issue ls --team TEAM_ID --limit 25 --json
woctl linear issue get EX-123 --json --output-file issue.json
woctl linear issue create 'Fix regression' --team TEAM_ID --description @body.md --yes
woctl linear comment create EX-123 @comment.md --yes
```

Writes require `readOnly: false` and `--yes` before file input or authentication. Teams, states, users, projects, issue updates, filters and cursor pagination are included. See the [Linear guide](https://github.com/wenerme/wode/blob/develop/docs/woctl/service/linear.md) and [linked private Node hosts](https://github.com/wenerme/wode/blob/develop/docs/woctl/development.md#link-a-private-node-host).

## Prometheus and VictoriaMetrics

Prometheus has a dedicated service and CLI, with `prom` as a short alias:

```sh
woctl service add metrics --type prometheus --base-url https://metrics.example.test
woctl service default set prometheus metrics
woctl prometheus --list-services --json
woctl prometheus query 'up' --json
woctl prometheus range 'rate(http_requests_total[5m])' --start now-1h --end now --step 60 --json
woctl prometheus query --query @query.promql --json
woctl prometheus labels --json
woctl prometheus label-values job --json
```

Replace the example URL with your endpoint. The service also supports series discovery, metric metadata, repeatable `--match` filters, Bearer/Basic/header authentication, and a configurable API prefix. Configure `--option accessTokenEnv=PROMETHEUS_TOKEN` to resolve a Bearer token from the environment only when making a request. Commands appear when an enabled Prometheus service is configured in the selected context; use `--service metrics` to select one explicitly. See the [Prometheus guide](https://github.com/wenerme/wode/blob/develop/docs/woctl/service/prometheus.md).

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
woctl mcp tools local-tools
woctl mcp tools local-tools --json
woctl mcp tools local-tools tool-name
woctl mcp info local-tools tool-name --json
woctl mcp info local-tools tool-name --typescript
woctl mcp call local-tools tool-name '{"query":"example"}' --json
woctl mcp resources local-tools --json
woctl mcp read local-tools 'resource://example' --json
woctl mcp grep '*search*' --json
```

`mcp list` is an alias for `mcp servers`. Listing configured servers does not connect to them. Discovery and call commands open a connection and close it when done. HTTP connections support Streamable HTTP responses, including SSE. The CLI acts as an MCP client; it does not expose an MCP gateway.

`mcp tools` prints one tool name per line. Select a tool to inspect its description and schema, or use `--json` for the complete metadata. `mcp info <server> [tool] --typescript` displays tool contracts as a TypeScript interface named after the server. Omit the tool name to inspect all tools on that server.

Connect to an HTTP MCP server without saving configuration:

```sh
woctl mcp --url https://wener.me/api/mcp --name wener-site tools wener-site
woctl mcp --url https://wener.me/api/mcp --name wener-site info wener-site search --typescript
```

The second command displays a `WenerSiteTools` interface.

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

`prompt render` works offline. `--dump` displays a redacted request without sending it. `--json` asks the model for a JSON object; `--output json` prints the complete response. Use `--jsonschema` for structured output. `p` is an alias for `prompt`.

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

[Source code](https://github.com/wenerme/wode/tree/develop/apps/woctl) · [Report an issue](https://github.com/wenerme/wode/issues)
