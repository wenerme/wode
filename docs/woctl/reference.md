<!-- Generated from registered metadata. Run: node --import tsx apps/woctl/scripts/generate-reference.ts --write -->

# woctl catalog

Version: 0.2.0. Catalog schema: 1.

## Global options

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --help `, ` -h ` | boolean | Show help |  |
| ` --context `, ` -c ` | string | Select a context for this command |  |
| ` --json ` | boolean | Complete JSON output |  |
| ` --output `, ` -o ` | string | Output format: table, json, yaml, csv, md, etc. |  |
| ` --format `, ` -f ` | string | Output fields, e.g. name,provider |  |
| ` --log-level ` | string | Log level: trace, verbose, debug, info, warning, error |  |
| ` --verbose ` | boolean | Enable verbose logging |  |

## Commands

- ` version ` — Show version
- ` info ` — Show runtime and configuration summaries
- ` provider ` — Manage AI provider connections
  - ` list ` — List AI providers in the current context with credentials hidden
  - ` show ` — Show public AI provider configuration
  - ` add ` — Add an AI provider; prefer environment variable references for credentials
  - ` remove ` — Remove an AI provider defined in the current context
  - ` types ` — List service provider plugins (system/http, etc.)
- ` model ` — Manage the AI model catalog and default model
  - ` list ` — List configured models
  - ` add ` — Add a model alias to a provider
  - ` show ` — Show the model and resolved provider with credentials hidden
  - ` use ` — Select the default model for the current context
  - ` remove ` — Remove a model alias
- ` context ` — Manage execution contexts
  - ` list ` — List contexts
  - ` show ` — Show the merged context with credentials hidden
  - ` create ` — Create a context
  - ` use ` — Switch the default context
  - ` remove ` — Remove a context other than the current one
  - ` provider ` — Manage AI provider connections
    - ` list ` — List AI providers in the current context with credentials hidden
    - ` show ` — Show public AI provider configuration
    - ` add ` — Add an AI provider; prefer environment variable references for credentials
    - ` remove ` — Remove an AI provider defined in the current context
    - ` types ` — List service provider plugins (system/http, etc.)
  - ` model ` — Manage the AI model catalog and default model
    - ` list ` — List configured models
    - ` add ` — Add a model alias to a provider
    - ` show ` — Show the model and resolved provider with credentials hidden
    - ` use ` — Select the default model for the current context
    - ` remove ` — Remove a model alias
  - ` check ` — Validate the current context configuration offline
- ` service ` — Configure, discover and call services
  - ` providers ` — List service provider plugins
  - ` type ` — Show service type metadata and options schema
    - ` list ` — List registered service types
    - ` info ` — Show registered service type information
  - ` list ` — List configured services with their resolved provider, capabilities, default and ambiguity status
  - ` add ` — Add a service to the current context
  - ` remove ` — Remove a service defined in the current context
  - ` schema ` — Show service tool definitions
  - ` call ` — Call a service tool
  - ` default ` — Manage default services for the current context
    - ` show ` — Show merged default services by provider or capability
    - ` set ` — Select the default service for a provider or capability
    - ` unset ` — Remove a default service setting defined in the current context
  - ` inspect ` — Discover tools, required inputs and copyable call examples
  - ` verify ` — Validate the current service configuration offline
- ` system ` — Offline system service
  - ` info ` — Show runtime information
  - ` echo ` — Echo text to verify service calls
- ` sql ` — SQL service operations
  - ` query ` — Run a read-only SQL query
  - ` exec ` — Execute SQL with explicit confirmation
  - ` explain ` — Explain a read-only SQL query
  - ` ping ` — Check SQL service connectivity
  - ` list ` — List SQL tables
  - ` table ` — table operations
    - ` list ` — List SQL tables
    - ` info ` — Describe a SQL table
- ` redis ` — Redis datasource operations
  - ` info ` — Ping the Redis datasource
  - ` get ` — GET a key value
  - ` type ` — Get the TYPE of a key
  - ` ttl ` — Get the TTL of a key
  - ` scan ` — SCAN keys
  - ` hgetall ` — Get all fields and values of a hash
  - ` xrange ` — Read entries from a stream
- ` prometheus ` — Query Prometheus/VictoriaMetrics metrics
  - ` query ` — Run an instant PromQL query
  - ` query-range ` — Run a PromQL range query
  - ` series ` — List matching time series
  - ` labels ` — List label names
  - ` label-values ` — List values for a label
  - ` metadata ` — List metric metadata
- ` grafana ` — Manage classic Grafana dashboards and panels and call the authenticated HTTP API
  - ` status ` — Check Grafana health
  - ` whoami ` — Read the current authenticated Grafana user
  - ` api ` — Call a Grafana API path; non-read methods require --yes and a writable service
  - ` dashboard ` — dashboard operations
    - ` list ` — Search one page of dashboard summaries
    - ` get ` — Get a dashboard by uid
    - ` update ` — Create or update a dashboard from a JSON file; requires --yes unless --dry-run is set
  - ` panel ` — panel operations
    - ` list ` — List classic panels, including panels nested in collapsed rows
    - ` get ` — Get a single panel by DASHBOARD_UID/PANEL_ID
    - ` patch ` — Patch a single panel by DASHBOARD_UID/PANEL_ID; exactly one of --set, --set-string, --set-json, --merge or --from is required, as is --yes unless --dry-run is set
- ` s3 ` — List, read, write and delete objects in an S3-compatible bucket
  - ` list ` — List objects in the bucket
  - ` get ` — Read an object as text
  - ` put ` — Write an object; requires --yes and a writable service
  - ` delete ` — Delete an object; requires --yes and a writable service
- ` linear ` — Linear issues, teams, projects, users, states, and comments
  - ` status ` — Show the authenticated Linear viewer
  - ` team ` — team operations
    - ` list ` — List teams
  - ` state ` — state operations
    - ` list ` — List workflow states
  - ` user ` — user operations
    - ` list ` — List users
  - ` project ` — project operations
    - ` list ` — List projects
  - ` issue ` — issue operations
    - ` list ` — List issues
    - ` get ` — Get one issue
    - ` create ` — Create an issue
    - ` update ` — Update an issue
  - ` comment ` — comment operations
    - ` list ` — List issue comments
    - ` create ` — Create an issue comment
- ` feishu ` — Send Feishu/Lark messages and call the Feishu OpenAPI
  - ` send ` — Send a Feishu/Lark message via app credential; requires --yes and a writable service
  - ` webhook ` — Send a message to a Feishu/Lark group custom bot webhook configured on the service; requires --yes and a writable service
  - ` chat ` — chat operations
    - ` list ` — List chats the app bot belongs to
    - ` get ` — Get chat information
    - ` members ` — List chat members
  - ` user ` — user operations
    - ` get ` — Get a contact user by id, or by --email
  - ` message ` — message operations
    - ` list ` — List messages in a chat
    - ` get ` — Get a message
    - ` reply ` — Reply to a message; requires --yes and a writable service
    - ` delete ` — Recall (delete) a message sent by the app; requires --yes and a writable service
    - ` react ` — Add an emoji reaction; requires --yes and a writable service
    - ` unreact ` — Remove a reaction added by the app; requires --yes and a writable service
  - ` file ` — file operations
    - ` upload ` — Upload an image (10 MiB) or file (30 MiB) for messages; requires --yes and a writable service
    - ` download ` — Download a message image or file; writes --out, or returns Base64 with --json
  - ` api ` — api operations
    - ` list ` — List generic Feishu OpenAPI catalog entries callable with a tenant token
    - ` describe ` — Describe a catalog API with JSON Schemas of its path parameters, query, body and response
    - ` call ` — Call a catalog API by id; writes require --yes, high-risk writes also --confirm-high-risk
    - ` request ` — Raw Feishu OpenAPI request without catalog validation; requires --yes and a writable service
- ` cls ` — Query Tencent Cloud Log Service (CLS) logs and list log topics
  - ` query ` — Search one or more CLS log topics
  - ` topics ` — List CLS log topics
- ` telegram ` — Use the Telegram Bot API: messages, chats, updates, webhooks and files
  - ` whoami ` — Read the configured Telegram bot identity
  - ` send ` — Send a text message; requires --yes and a writable service
  - ` message ` — message operations
    - ` edit ` — Edit a text message
    - ` delete ` — Delete a message
    - ` forward ` — Forward a message to another chat
    - ` copy ` — Copy a message to another chat
    - ` pin ` — Pin a message in a chat
    - ` unpin ` — Unpin a message, or the most recent pin when --message is omitted
  - ` chat ` — chat operations
    - ` get ` — Get chat information
    - ` member ` — Get a chat member by user id
    - ` admins ` — List chat administrators
    - ` count ` — Get the number of chat members
  - ` updates ` — Fetch one batch of updates; may acknowledge the queue, requires --yes
  - ` webhook ` — webhook operations
    - ` info ` — Read webhook status and pending update count
    - ` set ` — Set an HTTPS webhook
    - ` delete ` — Remove the webhook to enable getUpdates polling
  - ` callback ` — callback operations
    - ` answer ` — Answer a callback query from an inline keyboard
  - ` commands ` — commands operations
    - ` get ` — List the bot command menu
    - ` set ` — Replace the bot command menu
    - ` delete ` — Delete the bot command menu
  - ` send-photo ` — Send a photo by file id, HTTPS URL or local upload; local limit 10 MiB
  - ` send-document ` — Send a document by file id, HTTPS URL or local upload; local limit 20 MiB
  - ` file ` — file operations
    - ` info ` — Get a file path for downloading by Telegram file id
    - ` download ` — Download a file path from file info; writes --out or returns Base64 with --json
  - ` api ` — Call a Bot API method; write methods require --yes and a writable service
- ` google-analytics ` — Query Google Analytics (GA4) accounts, metadata and reports
  - ` status ` — List accessible accounts and properties
  - ` report ` — report operations
    - ` run ` — Run a GA4 report
    - ` realtime ` — Run a GA4 realtime report
  - ` metadata ` — metadata operations
    - ` property ` — Get property details
    - ` list ` — List dimensions and metrics available to a property
- ` dns ` — Manage DNS zones and RRSets through a configured DNS provider
  - ` zone ` — zone operations
    - ` list ` — List DNS zones
    - ` get ` — Read one DNS zone
    - ` create ` — Create a DNS zone; requires --yes unless --dry-run is set
    - ` delete ` — Delete a DNS zone and all its records; requires --yes unless --dry-run is set
  - ` record ` — record operations
    - ` list ` — List RRSets of a zone
    - ` set ` — Replace the whole RRSet for a name and type with the given enabled values in zone-file format; disabled records are removed; requires --yes unless --dry-run is set
    - ` delete ` — Delete the RRSet for a name and type; requires --yes unless --dry-run is set
- ` fs ` — List, read, write, move, copy and remove files on local, S3 or WebDAV storage
  - ` list ` — List a directory
  - ` stat ` — Show metadata for a path
  - ` read ` — Read a file as UTF-8 text or Base64
  - ` write ` — Write a file; requires --yes and a writable service
  - ` mkdir ` — Create a directory; requires --yes and a writable service
  - ` rm ` — Remove a file or directory; requires --yes and a writable service
  - ` mv ` — Move a file or directory; requires --yes and a writable service
  - ` cp ` — Copy a file or directory; requires --yes and a writable service
- ` search ` — Search the web through a configured service
- ` fetch ` — Fetch URL content through a configured service
- ` tts ` — Generate speech using a configured TTS service or built-in Edge TTS
  - ` speak ` — Generate speech from text
  - ` voices ` — List available voices; availability depends on the provider
- ` openobserve ` — Query OpenObserve logs, metrics and traces
  - ` health ` — Check the healthz protocol endpoint
  - ` stream ` — stream operations
    - ` settings ` — Show stream settings
    - ` update ` — Update stream settings; requires a writable service and --yes
    - ` delete ` — Delete a stream; requires a writable service and --yes
    - ` list ` — List streams
    - ` schema ` — Show a stream schema
  - ` ingest ` — ingest operations
    - ` json ` — Ingest a JSON array of objects
    - ` multi ` — Ingest an NDJSON stream of objects
  - ` values ` — Read distinct field values
  - ` around ` — Read logs around a microsecond timestamp
  - ` log ` — log operations
    - ` query ` — Query a log stream
  - ` metric ` — metric operations
    - ` query ` — Query a metrics stream
  - ` status ` — Check service health and organization authentication
  - ` query ` — Run read-only SQL or generate a full-text or filter query
  - ` trace ` — trace operations
    - ` query ` — Query a traces stream
    - ` list ` — Show recent trace summaries
- ` apollo ` — Manage Apollo Config, Portal and Admin services
  - ` read ` — Apollo read config
  - ` admin ` — admin operations
    - ` request ` — Apollo request
    - ` list-app ` — Apollo list app
    - ` get-app ` — Apollo get app
    - ` list-self-app ` — Apollo list self app
    - ` create-app ` — Apollo create app
    - ` create-app-env ` — Apollo create app env
    - ` update-app ` — Apollo update app
    - ` delete-app ` — Apollo delete app
    - ` list-missing-app-env ` — Apollo list missing app env
    - ` get-env-cluster ` — Apollo get env cluster
    - ` get-cluster ` — Apollo get cluster
    - ` create-cluster ` — Apollo create cluster
    - ` delete-cluster ` — Apollo delete cluster
    - ` list-namespace ` — Apollo list namespace
    - ` get-namespace ` — Apollo get namespace
    - ` get-namespace-lock ` — Apollo get namespace lock
    - ` create-namespace ` — Apollo create namespace
    - ` delete-namespace ` — Apollo delete namespace
    - ` list-namespace-usage ` — Apollo list namespace usage
    - ` list-missing-namespace ` — Apollo list missing namespace
    - ` create-missing-namespace ` — Apollo create missing namespace
    - ` list-item ` — Apollo list item
    - ` get-item ` — Apollo get item
    - ` upsert-item ` — Apollo upsert item
    - ` delete-item ` — Apollo delete item
    - ` get-latest-release ` — Apollo get latest release
    - ` publish-release ` — Apollo publish release
  - ` status ` — Apollo get status
  - ` portal ` — portal operations
    - ` apps ` — Apollo list portal app
    - ` organizations ` — Apollo list portal organization
    - ` environments ` — Apollo list portal env
    - ` tree ` — Apollo get portal nav tree
    - ` namespaces ` — Apollo list portal namespace
    - ` namespace ` — Apollo get portal namespace
    - ` items ` — Apollo list portal item
    - ` releases ` — Apollo list portal release
    - ` config ` — Apollo get portal config
  - ` release ` — release operations
    - ` list ` — Apollo list release
    - ` get ` — Apollo get release
    - ` diff ` — Apollo diff release
    - ` rollback ` — Apollo rollback release
    - ` pending ` — Apollo diff namespace release
    - ` publish ` — Apollo publish namespace release
  - ` item ` — item operations
    - ` patch ` — Apollo patch namespace item
  - ` namespace ` — namespace operations
    - ` write ` — Apollo write namespace text
    - ` patch ` — Apollo patch namespace document
- ` mcp ` — MCP servers, tools, resources and calls
  - ` servers ` — List configured MCP servers without connecting
  - ` tools ` — List MCP tool names, or inspect one tool
  - ` resources ` — List MCP resources
  - ` read ` — Read an MCP resource
  - ` info ` — Show MCP server or tool information
  - ` call ` — Call an MCP tool
  - ` grep ` — Search MCP tools
- ` prompt ` — Generate text with a model in the current context, with templates and request previews
  - ` list ` — List prompt presets in the current context
  - ` show ` — Show a prompt preset; --json outputs the complete configuration
  - ` import ` — Import YAML frontmatter and template content from .prompt.md
  - ` remove ` — Remove a prompt preset defined in the current context
  - ` render ` — Render a template with variables without calling a model
- ` render ` — Render Markdown, JSON, YAML, text, PDF or spreadsheets
- ` markdown ` — Render Markdown as terminal text
- ` pdf ` — PDF utilities: info, inspect, read, parse, render
  - ` info ` — Read PDF metadata, page sizes, outline and attachments
  - ` inspect ` — Explore PDF internals for extraction planning
  - ` read ` — Read PDF text as Markdown
  - ` parse ` — Parse PDF with heuristic templates
  - ` render ` — Render PDF pages to PNG with PDFium and CanvasKit
- ` xlsx ` — Inspect, read, edit, tidy, and export XLSX workbooks
  - ` read ` — Read or preview one XLSX worksheet
  - ` inspect ` — Inspect XLSX workbook and sheet metadata
  - ` props ` — Read XLSX workbook custom properties
  - ` list ` — List worksheets in an XLSX workbook
  - ` edit ` — Create or edit XLSX cells, rows, and styles
  - ` tidy ` — Rebuild a workbook from actual rows; drops stale styles, images, drawings, and sheet internals
  - ` export ` — Export XLSX worksheets to CSV files
- ` catalog ` — Export the complete static command and service provider catalog. jsonschema describes the catalog document, not the complete native config file schema.

### ` version `

Show version

Usage:

```text
woctl version
```

### ` info `

Show runtime and configuration summaries

Usage:

```text
woctl info
```

### ` provider `

Manage AI provider connections

Usage:

```text
woctl provider
```

### ` provider list `

List AI providers in the current context with credentials hidden

Usage:

```text
woctl provider list
```

Aliases: ` ls `

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --search ` | string | Filter by name |  |

### ` provider show `

Show public AI provider configuration

Usage:

```text
woctl provider show <name>
```

### ` provider add `

Add an AI provider; prefer environment variable references for credentials

Usage:

```text
woctl provider add <name>
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --api ` | string | openai \| openai-response \| anthropic \| gemini |  |
| ` --url ` | string | Provider base URL |  |
| ` --title ` | string | Display title |  |
| ` --api-key-env ` | string | Environment variable name read by the Node host |  |
| ` --input ` | string | Complete provider JSON or @file |  |

### ` provider remove `

Remove an AI provider defined in the current context

Usage:

```text
woctl provider remove <name>
```

### ` provider types `

List service provider plugins (system/http, etc.)

Usage:

```text
woctl provider types
```

### ` model `

Manage the AI model catalog and default model

Usage:

```text
woctl model
```

### ` model list `

List configured models

Usage:

```text
woctl model list
```

Aliases: ` ls `

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --provider ` | string | Filter by provider |  |
| ` --search ` | string | Filter by model name |  |

### ` model add `

Add a model alias to a provider

Usage:

```text
woctl model add <name>
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --provider ` | string | Provider name (required) |  |
| ` --id ` | string | Upstream model ID; defaults to the alias |  |
| ` --title ` | string | Display title |  |
| ` --max-output-tokens ` | string | Default model output token limit |  |
| ` --context-size ` | string | Context size |  |
| ` --temperature ` | string | Default temperature |  |

### ` model show `

Show the model and resolved provider with credentials hidden

Usage:

```text
woctl model show <model>
```

### ` model use `

Select the default model for the current context

Usage:

```text
woctl model use <model>
```

### ` model remove `

Remove a model alias

Usage:

```text
woctl model remove <model>
```

### ` context `

Manage execution contexts

Usage:

```text
woctl context
```

Aliases: ` ctx `

### ` context list `

List contexts

Usage:

```text
woctl context list
```

### ` context show `

Show the merged context with credentials hidden

Usage:

```text
woctl context show [name]
```

### ` context create `

Create a context

Usage:

```text
woctl context create <name>
```

### ` context use `

Switch the default context

Usage:

```text
woctl context use <name>
```

### ` context remove `

Remove a context other than the current one

Usage:

```text
woctl context remove <name>
```

### ` context provider `

Manage AI provider connections

Usage:

```text
woctl context provider
```

### ` context provider list `

List AI providers in the current context with credentials hidden

Usage:

```text
woctl context provider list
```

Aliases: ` ls `

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --search ` | string | Filter by name |  |

### ` context provider show `

Show public AI provider configuration

Usage:

```text
woctl context provider show <name>
```

### ` context provider add `

Add an AI provider; prefer environment variable references for credentials

Usage:

```text
woctl context provider add <name>
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --api ` | string | openai \| openai-response \| anthropic \| gemini |  |
| ` --url ` | string | Provider base URL |  |
| ` --title ` | string | Display title |  |
| ` --api-key-env ` | string | Environment variable name read by the Node host |  |
| ` --input ` | string | Complete provider JSON or @file |  |

### ` context provider remove `

Remove an AI provider defined in the current context

Usage:

```text
woctl context provider remove <name>
```

### ` context provider types `

List service provider plugins (system/http, etc.)

Usage:

```text
woctl context provider types
```

### ` context model `

Manage the AI model catalog and default model

Usage:

```text
woctl context model
```

### ` context model list `

List configured models

Usage:

```text
woctl context model list
```

Aliases: ` ls `

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --provider ` | string | Filter by provider |  |
| ` --search ` | string | Filter by model name |  |

### ` context model add `

Add a model alias to a provider

Usage:

```text
woctl context model add <name>
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --provider ` | string | Provider name (required) |  |
| ` --id ` | string | Upstream model ID; defaults to the alias |  |
| ` --title ` | string | Display title |  |
| ` --max-output-tokens ` | string | Default model output token limit |  |
| ` --context-size ` | string | Context size |  |
| ` --temperature ` | string | Default temperature |  |

### ` context model show `

Show the model and resolved provider with credentials hidden

Usage:

```text
woctl context model show <model>
```

### ` context model use `

Select the default model for the current context

Usage:

```text
woctl context model use <model>
```

### ` context model remove `

Remove a model alias

Usage:

```text
woctl context model remove <model>
```

### ` context check `

Validate the current context configuration offline

Usage:

```text
woctl context check
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --strict ` | boolean | Treat warnings as failures |  |

### ` service `

Configure, discover and call services

Usage:

```text
woctl service
```

Aliases: ` svc `

### ` service providers `

List service provider plugins

Usage:

```text
woctl service providers
```

### ` service type `

Show service type metadata and options schema

Usage:

```text
woctl service type [type]
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --typescript ` | boolean | Render the options schema as a TypeScript interface |  |

### ` service type list `

List registered service types

Usage:

```text
woctl service type list
```

### ` service type info `

Show registered service type information

Usage:

```text
woctl service type info <type>
```

### ` service list `

List configured services with their resolved provider, capabilities, default and ambiguity status

Usage:

```text
woctl service list
```

### ` service add `

Add a service to the current context

Usage:

```text
woctl service add <name>
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --type ` | string | Service type, such as system, http or openobserve |  |
| ` --base-url ` | string | Service base URL |  |
| ` --id ` | string | Remote service ID; defaults to the service name |  |
| ` --title ` | string | Human-readable service title |  |
| ` --description ` | string | Human-readable service description |  |
| ` --header ` | string, repeatable | HTTP header as key=value; repeatable |  |
| ` --option ` | string, repeatable | Provider option as key=value; dot paths create nested objects; JSON values may use json: |  |
| ` --writable ` | boolean | Allow write operations for this service |  |
| ` --disabled ` | boolean | Disable the service after adding it |  |

### ` service remove `

Remove a service defined in the current context

Usage:

```text
woctl service remove <name>
```

### ` service schema `

Show service tool definitions

Usage:

```text
woctl service schema <service>
```

### ` service call `

Call a service tool

Usage:

```text
woctl service call <service> <tool>
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --redact ` | boolean | Redact sensitive values in displayed output; defaults to original data |  |
| ` --input `, ` -i ` | string | JSON, @file, or - to read stdin; defaults to {} |  |
| ` --yes ` | boolean | Confirm a write operation |  |

### ` service default `

Manage default services for the current context

Usage:

```text
woctl service default
```

### ` service default show `

Show merged default services by provider or capability

Usage:

```text
woctl service default show
```

### ` service default set `

Select the default service for a provider or capability

Usage:

```text
woctl service default set <provider-or-capability> <service>
```

### ` service default unset `

Remove a default service setting defined in the current context

Usage:

```text
woctl service default unset <provider-or-capability>
```

### ` service inspect `

Discover tools, required inputs and copyable call examples

Usage:

```text
woctl service inspect <service>
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --writable ` | boolean | Also show tools that can write; execution requires service permissions |  |
| ` --options ` | boolean | Show the configured service options schema |  |

### ` service verify `

Validate the current service configuration offline

Usage:

```text
woctl service verify
```

Aliases: ` check `

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --strict ` | boolean | Treat warnings as failures |  |

### ` system `

Offline system service

Usage:

```text
woctl system
```

Availability: configured service with provider ` system `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a service by name |  |
| ` --list-services ` | boolean | List available services of the same type in the current context |  |
| ` --output-file ` | string | Write the formatted result to a file; - writes to stdout |  |
| ` --redact ` | boolean | Redact sensitive values in displayed output; defaults to original data |  |

### ` system info `

Show runtime information

Usage:

```text
woctl system info
```

Availability: configured service with provider ` system `.

### ` system echo `

Echo text to verify service calls

Usage:

```text
woctl system echo <text>
```

Availability: configured service with provider ` system `.

### ` sql `

SQL service operations

Usage:

```text
woctl sql
```

Availability: configured service with provider ` sql `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a service by name |  |
| ` --list-services ` | boolean | List available services of the same type in the current context |  |
| ` --output-file ` | string | Write the formatted result to a file; - writes to stdout |  |
| ` --redact ` | boolean | Redact sensitive values in displayed output; defaults to original data |  |

Examples:

Run a read-only query

```sh
woctl sql query "SELECT 1 AS value"
```

Bind a query parameter

```sh
woctl sql query "SELECT * FROM users WHERE id = ?" --params '[1]'
```

### ` sql query `

Run a read-only SQL query

Usage:

```text
woctl sql query <statement...>
```

Aliases: ` q `

Availability: configured service with provider ` sql `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --params ` | string | Bound parameters as a JSON array or @file |  |
| ` --var ` | string, repeatable | Bind a positional parameter: 1=value |  |
| ` --limit ` | string | Positive row limit |  |
| ` --offset ` | string | Non-negative row offset |  |

Examples:

```sh
woctl sql query "SELECT * FROM users WHERE id = ?" --params '[1]'
```

### ` sql exec `

Execute SQL with explicit confirmation

Usage:

```text
woctl sql exec <statement...>
```

Availability: configured service with provider ` sql `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --params ` | string | Bound parameters as a JSON array or @file |  |
| ` --var ` | string, repeatable | Bind a positional parameter: 1=value |  |
| ` --limit ` | string | Positive row limit |  |
| ` --offset ` | string | Non-negative row offset |  |
| ` --yes ` | boolean | Confirm SQL execution |  |

### ` sql explain `

Explain a read-only SQL query

Usage:

```text
woctl sql explain <statement...>
```

Availability: configured service with provider ` sql `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --params ` | string | Bound parameters as a JSON array or @file |  |
| ` --var ` | string, repeatable | Bind a positional parameter: 1=value |  |
| ` --limit ` | string | Positive row limit |  |
| ` --offset ` | string | Non-negative row offset |  |

### ` sql ping `

Check SQL service connectivity

Usage:

```text
woctl sql ping
```

Availability: configured service with provider ` sql `.

### ` sql list `

List SQL tables

Usage:

```text
woctl sql list
```

Availability: configured service with provider ` sql `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --schema ` | string | SQL schema/database |  |
| ` --search ` | string | Search table names |  |
| ` --limit ` | string | Positive row limit |  |
| ` --offset ` | string | Non-negative row offset |  |

### ` sql table `

table operations

Usage:

```text
woctl sql table
```

Availability: configured service with provider ` sql `.

### ` sql table list `

List SQL tables

Usage:

```text
woctl sql table list
```

Aliases: ` ls `

Availability: configured service with provider ` sql `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --schema ` | string | SQL schema/database |  |
| ` --search ` | string | Search table names |  |
| ` --limit ` | string | Positive row limit |  |
| ` --offset ` | string | Non-negative row offset |  |

### ` sql table info `

Describe a SQL table

Usage:

```text
woctl sql table info <table>
```

Aliases: ` describe `, ` desc `

Availability: configured service with provider ` sql `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --schema ` | string | SQL schema/database |  |
| ` --search ` | string | Search table names |  |
| ` --limit ` | string | Positive row limit |  |
| ` --offset ` | string | Non-negative row offset |  |

### ` redis `

Redis datasource operations

Usage:

```text
woctl redis
```

Aliases: ` valkey `

Availability: configured service with provider ` redis `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a service by name |  |
| ` --list-services ` | boolean | List available services of the same type in the current context |  |
| ` --output-file ` | string | Write the formatted result to a file; - writes to stdout |  |
| ` --redact ` | boolean | Redact sensitive values in displayed output; defaults to original data |  |

Examples:

Check Redis connectivity

```sh
woctl redis ping
```

Scan matching keys

```sh
woctl redis scan --match 'user:*' --count 100
```

### ` redis info `

Ping the Redis datasource

Usage:

```text
woctl redis info
```

Aliases: ` ping `

Availability: configured service with provider ` redis `.

### ` redis get `

GET a key value

Usage:

```text
woctl redis get <key>
```

Availability: configured service with provider ` redis `.

### ` redis type `

Get the TYPE of a key

Usage:

```text
woctl redis type <key>
```

Availability: configured service with provider ` redis `.

### ` redis ttl `

Get the TTL of a key

Usage:

```text
woctl redis ttl <key>
```

Availability: configured service with provider ` redis `.

### ` redis scan `

SCAN keys

Usage:

```text
woctl redis scan
```

Availability: configured service with provider ` redis `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --cursor ` | string | Start cursor | ` "0" ` |
| ` --match ` | string | MATCH glob pattern |  |
| ` --count ` | string | COUNT hint per batch | ` "100" ` |
| ` --type ` | string | TYPE filter |  |
| ` --all ` | boolean | Follow SCAN cursors until cursor 0 |  |

Examples:

```sh
woctl redis scan --match 'user:*' --count 100
```

### ` redis hgetall `

Get all fields and values of a hash

Usage:

```text
woctl redis hgetall <key>
```

Availability: configured service with provider ` redis `.

### ` redis xrange `

Read entries from a stream

Usage:

```text
woctl redis xrange <key>
```

Availability: configured service with provider ` redis `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --start ` | string | Start ID | ` "-" ` |
| ` --end ` | string | End ID | ` "+" ` |
| ` --count ` | string | Max entries | ` "50" ` |

### ` prometheus `

Query Prometheus/VictoriaMetrics metrics

Usage:

```text
woctl prometheus
```

Aliases: ` prom `

Availability: configured service with provider ` prometheus `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a service by name |  |
| ` --list-services ` | boolean | List available services of the same type in the current context |  |
| ` --output-file ` | string | Write the formatted result to a file; - writes to stdout |  |
| ` --redact ` | boolean | Redact sensitive values in displayed output; defaults to original data |  |

Examples:

Query current target health

```sh
woctl prometheus query up
```

Query target health over the last hour

```sh
woctl prometheus query-range up --start now-1h --end now --step 60
```

### ` prometheus query `

Run an instant PromQL query

Usage:

```text
woctl prometheus query [query...]
```

Aliases: ` q `

Availability: configured service with provider ` prometheus `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --query ` | string | PromQL expression, @file or - for stdin |  |
| ` --time ` | string | Evaluation time |  |
| ` --timeout ` | string | Server query timeout |  |

### ` prometheus query-range `

Run a PromQL range query

Usage:

```text
woctl prometheus query-range [query...]
```

Aliases: ` range `

Availability: configured service with provider ` prometheus `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --query ` | string | PromQL expression, @file or - for stdin |  |
| ` --start ` | string | Start time; defaults to now-1h |  |
| ` --end ` | string | End time; defaults to now |  |
| ` --step ` | string | Step size; defaults to 60 |  |
| ` --timeout ` | string | Server query timeout |  |

Examples:

```sh
woctl prometheus query-range up --start now-1h --end now --step 60
```

### ` prometheus series `

List matching time series

Usage:

```text
woctl prometheus series
```

Availability: configured service with provider ` prometheus `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --start ` | string | Start time or Unix timestamp |  |
| ` --end ` | string | End time or Unix timestamp |  |
| ` --match ` | string, repeatable | Series matcher; repeatable |  |

### ` prometheus labels `

List label names

Usage:

```text
woctl prometheus labels
```

Availability: configured service with provider ` prometheus `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --start ` | string | Start time or Unix timestamp |  |
| ` --end ` | string | End time or Unix timestamp |  |
| ` --match ` | string, repeatable | Series matcher; repeatable |  |

### ` prometheus label-values `

List values for a label

Usage:

```text
woctl prometheus label-values <label>
```

Aliases: ` values `

Availability: configured service with provider ` prometheus `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --start ` | string | Start time or Unix timestamp |  |
| ` --end ` | string | End time or Unix timestamp |  |
| ` --match ` | string, repeatable | Series matcher; repeatable |  |

### ` prometheus metadata `

List metric metadata

Usage:

```text
woctl prometheus metadata
```

Availability: configured service with provider ` prometheus `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --limit ` | string | Maximum number of results |  |
| ` --metric ` | string | Metric name |  |

### ` grafana `

Manage classic Grafana dashboards and panels and call the authenticated HTTP API

Usage:

```text
woctl grafana
```

Aliases: ` gf `

Availability: configured service with provider ` grafana `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a service by name |  |
| ` --list-services ` | boolean | List available services of the same type in the current context |  |
| ` --output-file ` | string | Write the formatted result to a file; - writes to stdout |  |
| ` --redact ` | boolean | Redact sensitive values in displayed output; defaults to original data |  |

Examples:

Check Grafana health

```sh
woctl grafana status
```

List dashboards

```sh
woctl grafana api /api/search --query type=dash-db
```

### ` grafana status `

Check Grafana health

Usage:

```text
woctl grafana status
```

Availability: configured service with provider ` grafana `.

### ` grafana whoami `

Read the current authenticated Grafana user

Usage:

```text
woctl grafana whoami
```

Availability: configured service with provider ` grafana `.

### ` grafana api `

Call a Grafana API path; non-read methods require --yes and a writable service

Usage:

```text
woctl grafana api <path>
```

Availability: configured service with provider ` grafana `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --method `, ` -X ` | string | HTTP method; GET by default, POST with --body |  |
| ` --query ` | string, repeatable | Query parameter key=value; repeatable |  |
| ` --body ` | string | JSON body, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm a write request |  |

Examples:

```sh
woctl grafana api /api/search --query type=dash-db
```

### ` grafana dashboard `

dashboard operations

Usage:

```text
woctl grafana dashboard
```

Availability: configured service with provider ` grafana `.

### ` grafana dashboard list `

Search one page of dashboard summaries

Usage:

```text
woctl grafana dashboard list
```

Availability: configured service with provider ` grafana `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --query ` | string | Search text |  |
| ` --tag ` | string, repeatable | Filter by tag; repeatable |  |
| ` --folder-uid ` | string | Filter by folder uid |  |
| ` --limit ` | string | Maximum number of results (1-500) |  |
| ` --page ` | string | Search page, starting at 1; use with --limit |  |

### ` grafana dashboard get `

Get a dashboard by uid

Usage:

```text
woctl grafana dashboard get <uid>
```

Availability: configured service with provider ` grafana `.

### ` grafana dashboard update `

Create or update a dashboard from a JSON file; requires --yes unless --dry-run is set

Usage:

```text
woctl grafana dashboard update <file>
```

Availability: configured service with provider ` grafana `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --folder-uid ` | string | Destination folder uid |  |
| ` --message ` | string | Save message |  |
| ` --overwrite ` | boolean | Overwrite an existing dashboard version conflict |  |
| ` --expected-version ` | string | Classic dashboard version precondition; incompatible with --overwrite |  |
| ` --yes ` | boolean | Confirm a write request |  |
| ` --dry-run ` | boolean | Validate without writing; does not require --yes |  |

### ` grafana panel `

panel operations

Usage:

```text
woctl grafana panel
```

Availability: configured service with provider ` grafana `.

### ` grafana panel list `

List classic panels, including panels nested in collapsed rows

Usage:

```text
woctl grafana panel list <uid>
```

Availability: configured service with provider ` grafana `.

### ` grafana panel get `

Get a single panel by DASHBOARD_UID/PANEL_ID

Usage:

```text
woctl grafana panel get <ref>
```

Availability: configured service with provider ` grafana `.

### ` grafana panel patch `

Patch a single panel by DASHBOARD_UID/PANEL_ID; exactly one of --set, --set-string, --set-json, --merge or --from is required, as is --yes unless --dry-run is set

Usage:

```text
woctl grafana panel patch <ref>
```

Availability: configured service with provider ` grafana `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --set ` | string, repeatable | path=value assignment on the panel JSON; JSON when parseable, otherwise a raw string; repeatable |  |
| ` --set-string ` | string, repeatable | path=value assignment on the panel JSON; the value is always a raw string, including an empty one; repeatable |  |
| ` --set-json ` | string, repeatable | path=value assignment on the panel JSON; the value must parse as JSON; repeatable |  |
| ` --merge ` | string | JSON object, @file or - deep-merged into the panel |  |
| ` --from ` | string | JSON file or - that replaces the whole panel |  |
| ` --message ` | string | Save message |  |
| ` --expected-version ` | string | Require the fetched classic dashboard to have this version |  |
| ` --yes ` | boolean | Confirm a write request |  |
| ` --dry-run ` | boolean | Validate without writing; does not require --yes |  |

### ` s3 `

List, read, write and delete objects in an S3-compatible bucket

Usage:

```text
woctl s3
```

Aliases: ` s3mini `

Availability: configured service with provider ` s3 `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a service by name |  |
| ` --list-services ` | boolean | List available services of the same type in the current context |  |
| ` --output-file ` | string | Write the formatted result to a file; - writes to stdout |  |
| ` --redact ` | boolean | Redact sensitive values in displayed output; defaults to original data |  |

Examples:

List objects under a prefix

```sh
woctl s3 list --prefix uploads/
```

Read an object as text

```sh
woctl s3 get path/to/object.txt
```

### ` s3 list `

List objects in the bucket

Usage:

```text
woctl s3 list
```

Availability: configured service with provider ` s3 `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --delimiter ` | string | Delimiter used to group keys (default: /) |  |
| ` --prefix ` | string | Key prefix filter |  |
| ` --max-keys ` | string | Maximum number of keys to return |  |

Examples:

```sh
woctl s3 list --prefix uploads/
```

### ` s3 get `

Read an object as text

Usage:

```text
woctl s3 get <key>
```

Availability: configured service with provider ` s3 `.

### ` s3 put `

Write an object; requires --yes and a writable service

Usage:

```text
woctl s3 put <key>
```

Availability: configured service with provider ` s3 `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --content ` | string | Object content, @file or - for stdin |  |
| ` --content-type ` | string | Object content type |  |
| ` --yes ` | boolean | Confirm writing the object |  |

### ` s3 delete `

Delete an object; requires --yes and a writable service

Usage:

```text
woctl s3 delete <key>
```

Availability: configured service with provider ` s3 `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --yes ` | boolean | Confirm deleting the object |  |

### ` linear `

Linear issues, teams, projects, users, states, and comments

Usage:

```text
woctl linear
```

Availability: configured service with provider ` linear `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a service by name |  |
| ` --list-services ` | boolean | List available services of the same type in the current context |  |
| ` --output-file ` | string | Write the formatted result to a file; - writes to stdout |  |
| ` --redact ` | boolean | Redact sensitive values in displayed output; defaults to original data |  |

Examples:

Show the authenticated viewer.

```sh
woctl linear status --service work
```

List team issues.

```sh
woctl linear issue ls --team TEAM_ID --limit 50
```

Read the complete issue.

```sh
woctl linear issue get LIN-123 -o json
```

```sh
woctl linear issue create "Fix regression" --team TEAM_ID --description @body.md --yes
```

```sh
woctl linear comment create LIN-123 @comment.md --yes
```

### ` linear status `

Show the authenticated Linear viewer

Usage:

```text
woctl linear status
```

Availability: configured service with provider ` linear `.

Examples:

Show the authenticated viewer.

```sh
woctl linear status
```

### ` linear team `

team operations

Usage:

```text
woctl linear team
```

Availability: configured service with provider ` linear `.

### ` linear team list `

List teams

Usage:

```text
woctl linear team list
```

Aliases: ` ls `

Availability: configured service with provider ` linear `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --limit ` | string | Result limit, max 100 | ` "50" ` |
| ` --after ` | string | Relay cursor |  |
| ` --include-archived ` | boolean | Include archived resources |  |

### ` linear state `

state operations

Usage:

```text
woctl linear state
```

Availability: configured service with provider ` linear `.

### ` linear state list `

List workflow states

Usage:

```text
woctl linear state list
```

Aliases: ` ls `

Availability: configured service with provider ` linear `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --limit ` | string | Result limit, max 100 | ` "50" ` |
| ` --after ` | string | Relay cursor |  |
| ` --team ` | string | Team ID |  |

### ` linear user `

user operations

Usage:

```text
woctl linear user
```

Availability: configured service with provider ` linear `.

### ` linear user list `

List users

Usage:

```text
woctl linear user list
```

Aliases: ` ls `

Availability: configured service with provider ` linear `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --limit ` | string | Result limit, max 100 | ` "50" ` |
| ` --after ` | string | Relay cursor |  |
| ` --include-archived ` | boolean | Include archived resources |  |
| ` --query ` | string | Filter by name or text |  |

### ` linear project `

project operations

Usage:

```text
woctl linear project
```

Availability: configured service with provider ` linear `.

### ` linear project list `

List projects

Usage:

```text
woctl linear project list
```

Aliases: ` ls `

Availability: configured service with provider ` linear `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --limit ` | string | Result limit, max 100 | ` "50" ` |
| ` --after ` | string | Relay cursor |  |
| ` --include-archived ` | boolean | Include archived resources |  |
| ` --team ` | string | Team ID |  |
| ` --query ` | string | Filter by name or text |  |

### ` linear issue `

issue operations

Usage:

```text
woctl linear issue
```

Availability: configured service with provider ` linear `.

### ` linear issue list `

List issues

Usage:

```text
woctl linear issue list
```

Aliases: ` ls `

Availability: configured service with provider ` linear `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --limit ` | string | Result limit, max 100 | ` "50" ` |
| ` --after ` | string | Relay cursor |  |
| ` --include-archived ` | boolean | Include archived resources |  |
| ` --team ` | string | Team ID |  |
| ` --query ` | string | Filter by name or text |  |
| ` --assignee ` | string | Assignee ID |  |
| ` --project ` | string | Project ID |  |
| ` --state ` | string | Workflow state ID |  |
| ` --updated-after ` | string | Only issues updated after ISO timestamp |  |
| ` --filter ` | string | Linear IssueFilter JSON or @file |  |

### ` linear issue get `

Get one issue

Usage:

```text
woctl linear issue get <id>
```

Availability: configured service with provider ` linear `.

### ` linear issue create `

Create an issue

Usage:

```text
woctl linear issue create <title>
```

Availability: configured service with provider ` linear `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --team ` | string | Team ID |  |
| ` --description ` | string | Issue description or @file |  |
| ` --state ` | string | Workflow state ID |  |
| ` --assignee ` | string | Assignee ID |  |
| ` --project ` | string | Project ID |  |
| ` --priority ` | string | Priority 0..4 |  |
| ` --due-date ` | string | Due date YYYY-MM-DD |  |
| ` --label ` | string, repeatable | Label ID; repeatable |  |
| ` --yes ` | boolean | Confirm mutation |  |

### ` linear issue update `

Update an issue

Usage:

```text
woctl linear issue update <id>
```

Availability: configured service with provider ` linear `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --description ` | string | Issue description or @file |  |
| ` --state ` | string | Workflow state ID |  |
| ` --assignee ` | string | Assignee ID |  |
| ` --project ` | string | Project ID |  |
| ` --priority ` | string | Priority 0..4 |  |
| ` --due-date ` | string | Due date YYYY-MM-DD |  |
| ` --label ` | string, repeatable | Label ID; repeatable |  |
| ` --yes ` | boolean | Confirm mutation |  |
| ` --title ` | string | Issue title |  |
| ` --clear-assignee ` | boolean | Clear assignee |  |
| ` --clear-project ` | boolean | Clear project |  |
| ` --clear-due-date ` | boolean | Clear due date |  |

### ` linear comment `

comment operations

Usage:

```text
woctl linear comment
```

Availability: configured service with provider ` linear `.

### ` linear comment list `

List issue comments

Usage:

```text
woctl linear comment list <issue>
```

Aliases: ` ls `

Availability: configured service with provider ` linear `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --limit ` | string | Result limit, max 100 | ` "50" ` |
| ` --after ` | string | Relay cursor |  |

### ` linear comment create `

Create an issue comment

Usage:

```text
woctl linear comment create <issue> <body>
```

Availability: configured service with provider ` linear `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --yes ` | boolean | Confirm mutation |  |

### ` feishu `

Send Feishu/Lark messages and call the Feishu OpenAPI

Usage:

```text
woctl feishu
```

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a service by name |  |
| ` --list-services ` | boolean | List available services of the same type in the current context |  |
| ` --output-file ` | string | Write the formatted result to a file; - writes to stdout |  |
| ` --redact ` | boolean | Redact sensitive values in displayed output; defaults to original data |  |

Examples:

Send a message via app credential.

```sh
woctl feishu send --to ou_xxx --text "hello" --yes
```

Send a message to the configured group webhook.

```sh
woctl feishu webhook --text "hello" --yes
```

List chats the app bot belongs to.

```sh
woctl feishu chat list --page-size 20
```

### ` feishu send `

Send a Feishu/Lark message via app credential; requires --yes and a writable service

Usage:

```text
woctl feishu send
```

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --to ` | string | Target open_id / user_id / chat_id / email |  |
| ` --text ` | string | Message text, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm sending the message |  |

Examples:

```sh
woctl feishu send --to ou_xxx --text "hello" --yes
```

### ` feishu webhook `

Send a message to a Feishu/Lark group custom bot webhook configured on the service; requires --yes and a writable service

Usage:

```text
woctl feishu webhook
```

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --text ` | string | Plain text message, @file or - for stdin |  |
| ` --markdown ` | string | Markdown card message, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm sending the message |  |

Examples:

```sh
woctl feishu webhook --text "hello" --yes
```

### ` feishu chat `

chat operations

Usage:

```text
woctl feishu chat
```

Availability: configured service with provider ` feishu `.

### ` feishu chat list `

List chats the app bot belongs to

Usage:

```text
woctl feishu chat list
```

Aliases: ` ls `

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --sort ` | string | Sort order: created or active |  |
| ` --id-type ` | string | User id type: open_id (default), union_id or user_id |  |
| ` --page-size ` | string | Page size, 1..100 |  |
| ` --page-token ` | string | Page token from a previous result |  |

Examples:

```sh
woctl feishu chat list --page-size 20
```

### ` feishu chat get `

Get chat information

Usage:

```text
woctl feishu chat get <chat-id>
```

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --id-type ` | string | User id type: open_id (default), union_id or user_id |  |

Examples:

```sh
woctl feishu chat get oc_xxx
```

### ` feishu chat members `

List chat members

Usage:

```text
woctl feishu chat members <chat-id>
```

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --id-type ` | string | User id type: open_id (default), union_id or user_id |  |
| ` --page-size ` | string | Page size, 1..100 |  |
| ` --page-token ` | string | Page token from a previous result |  |

Examples:

```sh
woctl feishu chat members oc_xxx
```

### ` feishu user `

user operations

Usage:

```text
woctl feishu user
```

Availability: configured service with provider ` feishu `.

### ` feishu user get `

Get a contact user by id, or by --email

Usage:

```text
woctl feishu user get [user-id]
```

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --id-type ` | string | User id type: open_id (default), union_id or user_id |  |
| ` --email ` | string | Resolve the user by email instead of id |  |

Examples:

```sh
woctl feishu user get ou_xxx
```

```sh
woctl feishu user get --email user@example.com
```

### ` feishu message `

message operations

Usage:

```text
woctl feishu message
```

Availability: configured service with provider ` feishu `.

### ` feishu message list `

List messages in a chat

Usage:

```text
woctl feishu message list
```

Aliases: ` ls `

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --chat ` | string | Chat id |  |
| ` --start-time ` | string | Start time in Unix seconds |  |
| ` --end-time ` | string | End time in Unix seconds |  |
| ` --sort ` | string | Sort order: asc or desc |  |
| ` --page-size ` | string | Page size, 1..50 |  |
| ` --page-token ` | string | Page token from a previous result |  |

Examples:

```sh
woctl feishu message list --chat oc_xxx --sort desc --page-size 20
```

### ` feishu message get `

Get a message

Usage:

```text
woctl feishu message get <message-id>
```

Availability: configured service with provider ` feishu `.

Examples:

```sh
woctl feishu message get om_xxx
```

### ` feishu message reply `

Reply to a message; requires --yes and a writable service

Usage:

```text
woctl feishu message reply <message-id>
```

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --text ` | string | Reply text, @file or - for stdin |  |
| ` --content ` | string | Raw Feishu content JSON, @file or - for stdin; requires --msg-type |  |
| ` --msg-type ` | string | Feishu msg_type for --content, such as post or interactive |  |
| ` --reply-in-thread ` | boolean | Reply in a thread |  |
| ` --uuid ` | string | Idempotency key, at most 50 characters |  |
| ` --yes ` | boolean | Confirm the write operation |  |

Examples:

```sh
woctl feishu message reply om_xxx --text "ack" --yes
```

### ` feishu message delete `

Recall (delete) a message sent by the app; requires --yes and a writable service

Usage:

```text
woctl feishu message delete <message-id>
```

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --yes ` | boolean | Confirm the write operation |  |

Examples:

```sh
woctl feishu message delete om_xxx --yes
```

### ` feishu message react `

Add an emoji reaction; requires --yes and a writable service

Usage:

```text
woctl feishu message react <message-id>
```

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --emoji ` | string | Feishu emoji_type, such as THUMBSUP |  |
| ` --yes ` | boolean | Confirm the write operation |  |

Examples:

```sh
woctl feishu message react om_xxx --emoji THUMBSUP --yes
```

### ` feishu message unreact `

Remove a reaction added by the app; requires --yes and a writable service

Usage:

```text
woctl feishu message unreact <message-id>
```

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --reaction ` | string | Reaction id |  |
| ` --yes ` | boolean | Confirm the write operation |  |

Examples:

```sh
woctl feishu message unreact om_xxx --reaction REACTION_ID --yes
```

### ` feishu file `

file operations

Usage:

```text
woctl feishu file
```

Availability: configured service with provider ` feishu `.

### ` feishu file upload `

Upload an image (10 MiB) or file (30 MiB) for messages; requires --yes and a writable service

Usage:

```text
woctl feishu file upload
```

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --type ` | string | Upload type: image, opus, mp4, pdf, doc, xls, ppt, stream |  |
| ` --file ` | string | Local file path, @file or - for stdin; needs host binary input |  |
| ` --base64 ` | string | Base64 content, @file or - for stdin |  |
| ` --name ` | string | File name sent to Feishu; defaults to the --file base name |  |
| ` --duration ` | string | Media duration in milliseconds for opus or mp4 |  |
| ` --yes ` | boolean | Confirm the write operation |  |

Examples:

```sh
woctl feishu file upload --type image --file ./diagram.png --yes
```

```sh
woctl feishu file upload --type pdf --base64 @report.b64 --name report.pdf --yes
```

### ` feishu file download `

Download a message image or file; writes --out, or returns Base64 with --json

Usage:

```text
woctl feishu file download <message-id> <file-key>
```

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --type ` | string | Resource type: image or file |  |
| ` --out ` | string | Write the raw bytes to this path; needs host binary output |  |
| ` --max-bytes ` | string | Maximum download size, at most 30 MiB |  |

Examples:

```sh
woctl feishu file download om_xxx file_xxx --type file --out ./report.pdf
```

```sh
woctl feishu file download om_xxx img_xxx --type image --json
```

### ` feishu api `

api operations

Usage:

```text
woctl feishu api
```

Availability: configured service with provider ` feishu `.

### ` feishu api list `

List generic Feishu OpenAPI catalog entries callable with a tenant token

Usage:

```text
woctl feishu api list
```

Aliases: ` ls `

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --api-service ` | string | Catalog service, such as im, calendar or drive (--service selects the configured woctl service) |  |
| ` --risk ` | string | read, write or high-risk-write |  |
| ` --search ` | string | Case-insensitive text filter over id, path and summary |  |
| ` --all ` | boolean | Include APIs this service cannot call (user token or multipart) |  |

Examples:

```sh
woctl feishu api list --api-service im --risk read
```

```sh
woctl feishu api list --search pin --all
```

### ` feishu api describe `

Describe a catalog API with JSON Schemas of its path parameters, query, body and response

Usage:

```text
woctl feishu api describe <id>
```

Availability: configured service with provider ` feishu `.

Examples:

```sh
woctl feishu api describe im.chats.get --json
```

### ` feishu api call `

Call a catalog API by id; writes require --yes, high-risk writes also --confirm-high-risk

Usage:

```text
woctl feishu api call <id>
```

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --path ` | string, repeatable | Path parameter key=value |  |
| ` --query ` | string, repeatable | Query parameter key=value; repeat a key for a list |  |
| ` --data ` | string | JSON body, @file or - for stdin |  |
| ` --dry-run ` | boolean | Validate and print the request without credentials or HTTP |  |
| ` --yes ` | boolean | Confirm the write operation |  |
| ` --confirm-high-risk ` | boolean | Confirm a high-risk-write API in addition to --yes |  |

Examples:

```sh
woctl feishu api call im.chats.get --path chat_id=oc_xxx
```

```sh
woctl feishu api call im.pins.create --data '{"message_id":"om_xxx"}' --yes
```

```sh
woctl feishu api call im.chats.update --path chat_id=oc_xxx --data @chat.json --dry-run
```

### ` feishu api request `

Raw Feishu OpenAPI request without catalog validation; requires --yes and a writable service

Usage:

```text
woctl feishu api request <method> <path>
```

Availability: configured service with provider ` feishu `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --query ` | string, repeatable | Query parameter key=value |  |
| ` --data ` | string | JSON body, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm the write operation |  |

Examples:

```sh
woctl feishu api request GET im/v1/chats --query page_size=20 --yes
```

### ` cls `

Query Tencent Cloud Log Service (CLS) logs and list log topics

Usage:

```text
woctl cls
```

Aliases: ` tencent-cls `, ` tencent-log `

Availability: configured service with provider ` cls `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a service by name |  |
| ` --list-services ` | boolean | List available services of the same type in the current context |  |
| ` --output-file ` | string | Write the formatted result to a file; - writes to stdout |  |
| ` --redact ` | boolean | Redact sensitive values in displayed output; defaults to original data |  |

Examples:

Search a log topic

```sh
woctl cls query --topic my-topic "*"
```

List log topics

```sh
woctl cls topics
```

### ` cls query `

Search one or more CLS log topics

Usage:

```text
woctl cls query <expression>
```

Aliases: ` q `, ` search `

Availability: configured service with provider ` cls `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --topic ` | string, repeatable | Topic ID or name; repeatable |  |
| ` --from ` | string | Start time; ISO8601 or Unix ms timestamp; defaults to 1 hour ago |  |
| ` --to ` | string | End time; ISO8601 or Unix ms timestamp; defaults to now |  |
| ` --limit ` | string | Maximum number of results, 1-1000; defaults to 100 |  |
| ` --order ` | string | asc \| desc; defaults to desc |  |
| ` --context ` | string | Context token to fetch subsequent results |  |
| ` --sql ` | boolean | Treat the expression as including a SQL analysis clause |  |

Examples:

```sh
woctl cls query --topic my-topic "*"
```

### ` cls topics `

List CLS log topics

Usage:

```text
woctl cls topics
```

Aliases: ` ls `

Availability: configured service with provider ` cls `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --search ` | string | Topic name keyword |  |
| ` --limit ` | string | Maximum number of results, 1-1000 |  |
| ` --offset ` | string | Result offset |  |

### ` telegram `

Use the Telegram Bot API: messages, chats, updates, webhooks and files

Usage:

```text
woctl telegram
```

Aliases: ` tg `

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a service by name |  |
| ` --list-services ` | boolean | List available services of the same type in the current context |  |
| ` --output-file ` | string | Write the formatted result to a file; - writes to stdout |  |
| ` --token ` | string | Bot token for an ad hoc connection; defaults to service name telegram and is not saved |  |
| ` --read-only ` | boolean | Restrict the ad hoc connection to read-only operations |  |
| ` --redact ` | boolean | Redact sensitive values in displayed output; defaults to original data |  |

Examples:

Check the configured bot identity

```sh
woctl telegram whoami
```

Send a message

```sh
woctl telegram send --chat 123456789 --text "hello" --yes
```

### ` telegram whoami `

Read the configured Telegram bot identity

Usage:

```text
woctl telegram whoami
```

Aliases: ` status `

Availability: configured service with provider ` telegram `.

### ` telegram send `

Send a text message; requires --yes and a writable service

Usage:

```text
woctl telegram send
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --chat `, ` --chat-id ` | string | Chat id or @channel username |  |
| ` --text ` | string | Message text, @file or - for stdin |  |
| ` --parse-mode ` | string | Telegram parse mode: MarkdownV2, HTML or Markdown |  |
| ` --silent ` | boolean | Send without a notification sound |  |
| ` --reply-to ` | string | Message id to reply to |  |
| ` --yes ` | boolean | Confirm the write operation |  |

Examples:

```sh
woctl telegram send --chat 123456789 --text "hello" --yes
```

### ` telegram message `

message operations

Usage:

```text
woctl telegram message
```

Availability: configured service with provider ` telegram `.

### ` telegram message edit `

Edit a text message

Usage:

```text
woctl telegram message edit
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --chat `, ` --chat-id ` | string | Chat id or @channel username |  |
| ` --message `, ` --message-id ` | string | Message id |  |
| ` --text ` | string | New text, @file or - for stdin |  |
| ` --parse-mode ` | string | Telegram parse mode: MarkdownV2, HTML or Markdown |  |
| ` --yes ` | boolean | Confirm the write operation |  |

### ` telegram message delete `

Delete a message

Usage:

```text
woctl telegram message delete
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --chat `, ` --chat-id ` | string | Chat id or @channel username |  |
| ` --message `, ` --message-id ` | string | Message id |  |
| ` --yes ` | boolean | Confirm the write operation |  |

### ` telegram message forward `

Forward a message to another chat

Usage:

```text
woctl telegram message forward
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --chat `, ` --chat-id ` | string | Chat id or @channel username |  |
| ` --from-chat ` | string | Source chat id or @channel username |  |
| ` --message `, ` --message-id ` | string | Message id |  |
| ` --silent ` | boolean | Send without a notification sound |  |
| ` --yes ` | boolean | Confirm the write operation |  |

### ` telegram message copy `

Copy a message to another chat

Usage:

```text
woctl telegram message copy
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --chat `, ` --chat-id ` | string | Chat id or @channel username |  |
| ` --from-chat ` | string | Source chat id or @channel username |  |
| ` --message `, ` --message-id ` | string | Message id |  |
| ` --silent ` | boolean | Send without a notification sound |  |
| ` --yes ` | boolean | Confirm the write operation |  |

### ` telegram message pin `

Pin a message in a chat

Usage:

```text
woctl telegram message pin
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --chat `, ` --chat-id ` | string | Chat id or @channel username |  |
| ` --message `, ` --message-id ` | string | Message id |  |
| ` --silent ` | boolean | Send without a notification sound |  |
| ` --yes ` | boolean | Confirm the write operation |  |

### ` telegram message unpin `

Unpin a message, or the most recent pin when --message is omitted

Usage:

```text
woctl telegram message unpin
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --chat `, ` --chat-id ` | string | Chat id or @channel username |  |
| ` --message `, ` --message-id ` | string | Message id |  |
| ` --yes ` | boolean | Confirm the write operation |  |

### ` telegram chat `

chat operations

Usage:

```text
woctl telegram chat
```

Availability: configured service with provider ` telegram `.

### ` telegram chat get `

Get chat information

Usage:

```text
woctl telegram chat get <chat-id>
```

Availability: configured service with provider ` telegram `.

### ` telegram chat member `

Get a chat member by user id

Usage:

```text
woctl telegram chat member <chat-id>
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --user ` | string | Telegram user id |  |

### ` telegram chat admins `

List chat administrators

Usage:

```text
woctl telegram chat admins <chat-id>
```

Availability: configured service with provider ` telegram `.

### ` telegram chat count `

Get the number of chat members

Usage:

```text
woctl telegram chat count <chat-id>
```

Availability: configured service with provider ` telegram `.

### ` telegram updates `

Fetch one batch of updates; may acknowledge the queue, requires --yes

Usage:

```text
woctl telegram updates
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --offset ` | string | Update offset; confirms earlier updates (negative offsets discard older updates) |  |
| ` --limit ` | string | Number of updates, 1..100 |  |
| ` --timeout ` | string | Long-poll wait in seconds, 0..50; service timeout must exceed this |  |
| ` --allowed-update ` | string, repeatable | Update type; repeat to select multiple types |  |
| ` --yes ` | boolean | Confirm the write operation |  |

### ` telegram webhook `

webhook operations

Usage:

```text
woctl telegram webhook
```

Availability: configured service with provider ` telegram `.

### ` telegram webhook info `

Read webhook status and pending update count

Usage:

```text
woctl telegram webhook info
```

Availability: configured service with provider ` telegram `.

### ` telegram webhook set `

Set an HTTPS webhook

Usage:

```text
woctl telegram webhook set <url>
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --secret-token ` | string | Webhook verification secret, @file or - for stdin |  |
| ` --drop-pending ` | boolean | Discard pending updates |  |
| ` --max-connections ` | string | Maximum webhook connections, 1..100 |  |
| ` --allowed-update ` | string, repeatable | Update type; repeat to select multiple types |  |
| ` --yes ` | boolean | Confirm the write operation |  |

### ` telegram webhook delete `

Remove the webhook to enable getUpdates polling

Usage:

```text
woctl telegram webhook delete
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --drop-pending ` | boolean | Discard pending updates |  |
| ` --yes ` | boolean | Confirm the write operation |  |

### ` telegram callback `

callback operations

Usage:

```text
woctl telegram callback
```

Availability: configured service with provider ` telegram `.

### ` telegram callback answer `

Answer a callback query from an inline keyboard

Usage:

```text
woctl telegram callback answer <query-id>
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --text ` | string | Notification text (up to 200 characters) |  |
| ` --alert ` | boolean | Show an alert |  |
| ` --url ` | string | URL to open |  |
| ` --cache-time ` | string | Client cache time in seconds |  |
| ` --yes ` | boolean | Confirm the write operation |  |

### ` telegram commands `

commands operations

Usage:

```text
woctl telegram commands
```

Availability: configured service with provider ` telegram `.

### ` telegram commands get `

List the bot command menu

Usage:

```text
woctl telegram commands get
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --language ` | string | Two-letter ISO 639-1 language code; omitted for all languages |  |

### ` telegram commands set `

Replace the bot command menu

Usage:

```text
woctl telegram commands set
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --data ` | string | JSON array of {command,description}, @file or - for stdin |  |
| ` --language ` | string | Two-letter ISO 639-1 language code; omitted for all languages |  |
| ` --yes ` | boolean | Confirm the write operation |  |

### ` telegram commands delete `

Delete the bot command menu

Usage:

```text
woctl telegram commands delete
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --language ` | string | Two-letter ISO 639-1 language code; omitted for all languages |  |
| ` --yes ` | boolean | Confirm the write operation |  |

### ` telegram send-photo `

Send a photo by file id, HTTPS URL or local upload; local limit 10 MiB

Usage:

```text
woctl telegram send-photo
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --chat `, ` --chat-id ` | string | Target chat id or @channel username |  |
| ` --file ` | string | Local file path, @file or - for stdin |  |
| ` --source ` | string | Existing Telegram file id or HTTPS URL |  |
| ` --name ` | string | Upload filename; defaults to local file basename (required for stdin) |  |
| ` --caption ` | string | Caption text, @file or - for stdin |  |
| ` --parse-mode ` | string | Caption parse mode: HTML, MarkdownV2 or Markdown |  |
| ` --silent ` | boolean | Send without a notification sound |  |
| ` --reply-to ` | string | Message id to reply to |  |
| ` --yes ` | boolean | Confirm sending the media |  |

### ` telegram send-document `

Send a document by file id, HTTPS URL or local upload; local limit 20 MiB

Usage:

```text
woctl telegram send-document
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --chat `, ` --chat-id ` | string | Target chat id or @channel username |  |
| ` --file ` | string | Local file path, @file or - for stdin |  |
| ` --source ` | string | Existing Telegram file id or HTTPS URL |  |
| ` --name ` | string | Upload filename; defaults to local file basename (required for stdin) |  |
| ` --caption ` | string | Caption text, @file or - for stdin |  |
| ` --parse-mode ` | string | Caption parse mode: HTML, MarkdownV2 or Markdown |  |
| ` --silent ` | boolean | Send without a notification sound |  |
| ` --reply-to ` | string | Message id to reply to |  |
| ` --yes ` | boolean | Confirm sending the media |  |

### ` telegram file `

file operations

Usage:

```text
woctl telegram file
```

Availability: configured service with provider ` telegram `.

### ` telegram file info `

Get a file path for downloading by Telegram file id

Usage:

```text
woctl telegram file info <file-id>
```

Availability: configured service with provider ` telegram `.

### ` telegram file download `

Download a file path from file info; writes --out or returns Base64 with --json

Usage:

```text
woctl telegram file download <file-path>
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --out ` | string | Output file path; raw bytes are written through the host |  |

### ` telegram api `

Call a Bot API method; write methods require --yes and a writable service

Usage:

```text
woctl telegram api <method>
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --params ` | string, repeatable | Inline key=value parameter; prefix a value with json: for objects, numbers or arrays |  |
| ` --yes ` | boolean | Confirm the write operation |  |

### ` google-analytics `

Query Google Analytics (GA4) accounts, metadata and reports

Usage:

```text
woctl google-analytics
```

Aliases: ` ga `

Availability: configured service with provider ` google-analytics `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a service by name |  |
| ` --list-services ` | boolean | List available services of the same type in the current context |  |
| ` --output-file ` | string | Write the formatted result to a file; - writes to stdout |  |
| ` --redact ` | boolean | Redact sensitive values in displayed output; defaults to original data |  |

Examples:

List accessible accounts and properties

```sh
woctl ga status
```

Run a standard report

```sh
woctl ga report run --property 123 --dimension date --metric activeUsers
```

### ` google-analytics status `

List accessible accounts and properties

Usage:

```text
woctl google-analytics status
```

Aliases: ` accounts `

Availability: configured service with provider ` google-analytics `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --page-size ` | string | Accounts per page (1-200) |  |
| ` --page-token ` | string | Page token from a previous response |  |

Examples:

```sh
woctl ga status
```

### ` google-analytics report `

report operations

Usage:

```text
woctl google-analytics report
```

Availability: configured service with provider ` google-analytics `.

### ` google-analytics report run `

Run a GA4 report

Usage:

```text
woctl google-analytics report run
```

Availability: configured service with provider ` google-analytics `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --property ` | string | GA4 property ID or properties/<id> (required) |  |
| ` --date-from ` | string | Start date, e.g. 28daysAgo or 2026-01-01 |  |
| ` --date-to ` | string | End date, e.g. yesterday or 2026-01-31 |  |
| ` --dimension ` | string, repeatable | Dimension API name; repeatable |  |
| ` --metric ` | string, repeatable | Metric API name; repeatable |  |
| ` --limit ` | string | Maximum rows (1-250000) |  |
| ` --offset ` | string | Rows to skip |  |

### ` google-analytics report realtime `

Run a GA4 realtime report

Usage:

```text
woctl google-analytics report realtime
```

Availability: configured service with provider ` google-analytics `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --property ` | string | GA4 property ID or properties/<id> (required) |  |
| ` --dimension ` | string, repeatable | Dimension API name; repeatable |  |
| ` --metric ` | string, repeatable | Metric API name; repeatable |  |
| ` --limit ` | string | Maximum rows (1-250000) |  |

### ` google-analytics metadata `

metadata operations

Usage:

```text
woctl google-analytics metadata
```

Availability: configured service with provider ` google-analytics `.

### ` google-analytics metadata property `

Get property details

Usage:

```text
woctl google-analytics metadata property
```

Availability: configured service with provider ` google-analytics `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --property ` | string | GA4 property ID or properties/<id> (required) |  |

### ` google-analytics metadata list `

List dimensions and metrics available to a property

Usage:

```text
woctl google-analytics metadata list
```

Aliases: ` get `

Availability: configured service with provider ` google-analytics `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --property ` | string | GA4 property ID or properties/<id> (required) |  |

### ` dns `

Manage DNS zones and RRSets through a configured DNS provider

Usage:

```text
woctl dns
```

Availability: configured service with capability ` dns `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a service by name |  |
| ` --provider ` | string | Filter configured services by provider type |  |
| ` --list-services ` | boolean | List enabled services supporting dns in the current context |  |
| ` --output-file ` | string | Write the formatted result to a file; - writes to stdout |  |
| ` --redact ` | boolean | Redact sensitive values in displayed output; defaults to original data |  |

Examples:

List zones

```sh
woctl dns zone list
```

Replace an RRSet

```sh
woctl dns record set example.com www A 192.0.2.1 --ttl 300 --yes
```

### ` dns zone `

zone operations

Usage:

```text
woctl dns zone
```

Availability: configured service with capability ` dns `.

### ` dns zone list `

List DNS zones

Usage:

```text
woctl dns zone list
```

Aliases: ` ls `

Availability: configured service with capability ` dns `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --name ` | string | Only return this zone |  |
| ` --limit ` | string | Maximum items per page |  |
| ` --cursor ` | string | Continue from a previous nextCursor |  |

Examples:

```sh
woctl dns zone list
```

### ` dns zone get `

Read one DNS zone

Usage:

```text
woctl dns zone get <zone>
```

Availability: configured service with capability ` dns `.

### ` dns zone create `

Create a DNS zone; requires --yes unless --dry-run is set

Usage:

```text
woctl dns zone create <zone>
```

Availability: configured service with capability ` dns `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --kind ` | string | Supplier zone kind, for example Native for PowerDNS |  |
| ` --nameserver ` | string, repeatable | Apex NS name; repeatable |  |
| ` --yes ` | boolean | Confirm a write request |  |
| ` --dry-run ` | boolean | Preview the change without applying it; does not require --yes |  |

### ` dns zone delete `

Delete a DNS zone and all its records; requires --yes unless --dry-run is set

Usage:

```text
woctl dns zone delete <zone>
```

Aliases: ` rm `

Availability: configured service with capability ` dns `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --yes ` | boolean | Confirm a write request |  |
| ` --dry-run ` | boolean | Preview the change without applying it; does not require --yes |  |

### ` dns record `

record operations

Usage:

```text
woctl dns record
```

Availability: configured service with capability ` dns `.

### ` dns record list `

List RRSets of a zone

Usage:

```text
woctl dns record list <zone>
```

Aliases: ` ls `

Availability: configured service with capability ` dns `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --name ` | string | Filter by record name; @ is the apex |  |
| ` --type ` | string | Filter by record type |  |
| ` --limit ` | string | Maximum items per page |  |
| ` --cursor ` | string | Continue from a previous nextCursor |  |

### ` dns record set `

Replace the whole RRSet for a name and type with the given enabled values in zone-file format; disabled records are removed; requires --yes unless --dry-run is set

Usage:

```text
woctl dns record set <zone> <name> <type> <value...>
```

Availability: configured service with capability ` dns `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --ttl ` | string | TTL in seconds (default 300) |  |
| ` --yes ` | boolean | Confirm a write request |  |
| ` --dry-run ` | boolean | Preview the change without applying it; does not require --yes |  |

Examples:

Values use zone-file format; TXT must be quoted

```sh
woctl dns record set example.com @ TXT '"v=spf1 -all"' --yes
```

### ` dns record delete `

Delete the RRSet for a name and type; requires --yes unless --dry-run is set

Usage:

```text
woctl dns record delete <zone> <name> <type>
```

Aliases: ` rm `

Availability: configured service with capability ` dns `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --yes ` | boolean | Confirm a write request |  |
| ` --dry-run ` | boolean | Preview the change without applying it; does not require --yes |  |

### ` fs `

List, read, write, move, copy and remove files on local, S3 or WebDAV storage

Usage:

```text
woctl fs
```

Aliases: ` file `

Availability: configured service with provider ` fs `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a service by name |  |
| ` --list-services ` | boolean | List available services of the same type in the current context |  |
| ` --output-file ` | string | Write the formatted result to a file; - writes to stdout |  |
| ` --redact ` | boolean | Redact sensitive values in displayed output; defaults to original data |  |

Examples:

List a directory

```sh
woctl fs list /docs
```

Read a file as text

```sh
woctl fs read /docs/readme.txt
```

### ` fs list `

List a directory

Usage:

```text
woctl fs list [path]
```

Aliases: ` ls `

Availability: configured service with provider ` fs `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --recursive ` | boolean | List recursively |  |
| ` --depth ` | string | Directory depth to list (default 1) |  |
| ` --glob ` | string | Filter by POSIX glob on the full path |  |
| ` --kind ` | string | file or directory |  |
| ` --hidden ` | boolean | Include dot files |  |
| ` --max-entries ` | string | Maximum entries (default 1000) |  |

Examples:

```sh
woctl fs list /docs
```

### ` fs stat `

Show metadata for a path

Usage:

```text
woctl fs stat <path>
```

Availability: configured service with provider ` fs `.

### ` fs read `

Read a file as UTF-8 text or Base64

Usage:

```text
woctl fs read <path>
```

Aliases: ` cat `

Availability: configured service with provider ` fs `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --encoding ` | string | utf8 (default) or base64 |  |
| ` --max-bytes ` | string | Maximum bytes to read (default 1048576) |  |

### ` fs write `

Write a file; requires --yes and a writable service

Usage:

```text
woctl fs write <path>
```

Availability: configured service with provider ` fs `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --content ` | string | Content, @file or - for stdin |  |
| ` --encoding ` | string | Content encoding: utf8 (default) or base64 |  |
| ` --overwrite ` | boolean | Replace an existing destination |  |
| ` --yes ` | boolean | Confirm writing the file |  |

### ` fs mkdir `

Create a directory; requires --yes and a writable service

Usage:

```text
woctl fs mkdir <path>
```

Availability: configured service with provider ` fs `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --recursive ` | boolean | Create parent directories |  |
| ` --yes ` | boolean | Confirm creating the directory |  |

### ` fs rm `

Remove a file or directory; requires --yes and a writable service

Usage:

```text
woctl fs rm <path>
```

Aliases: ` remove `

Availability: configured service with provider ` fs `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --recursive ` | boolean | Remove a non-empty directory |  |
| ` --force ` | boolean | Ignore a missing path |  |
| ` --yes ` | boolean | Confirm removing the path |  |

### ` fs mv `

Move a file or directory; requires --yes and a writable service

Usage:

```text
woctl fs mv <from> <to>
```

Aliases: ` move `

Availability: configured service with provider ` fs `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --overwrite ` | boolean | Replace an existing destination |  |
| ` --yes ` | boolean | Confirm the move |  |

### ` fs cp `

Copy a file or directory; requires --yes and a writable service

Usage:

```text
woctl fs cp <from> <to>
```

Aliases: ` copy `

Availability: configured service with provider ` fs `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --overwrite ` | boolean | Replace an existing destination |  |
| ` --yes ` | boolean | Confirm the copy |  |

### ` search `

Search the web through a configured service

Usage:

```text
woctl search [query...]
```

Availability: configured service with capability ` search `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a configured service instance |  |
| ` --provider ` | string | Filter configured services by provider type |  |
| ` --api ` | string | Filter configured services by provider type (alias of --provider) |  |
| ` --list-services ` | boolean | List enabled services supporting this capability |  |
| ` --output `, ` -o ` | string | Output: md, json, yaml, table, wide, csv, name, value |  |
| ` --json ` | boolean | Output JSON |  |
| ` --raw ` | boolean | Emit the raw provider response in JSON or YAML |  |
| ` --limit `, ` -n `, ` --num-results ` | string | Number of results (default 10) |  |
| ` --offset ` | string | Skip the first N results |  |
| ` --type ` | string | Search type, e.g. auto, fast, instant, deep |  |
| ` --category ` | string | Search category, e.g. news or research paper |  |
| ` --include-domain `, ` --include ` | string, repeatable | Include a domain; repeatable |  |
| ` --exclude-domain `, ` --exclude ` | string, repeatable | Exclude a domain; repeatable |  |
| ` --time-range `, ` --range ` | string | Time range: d, w, m or y |  |
| ` --from `, ` --start-published-date ` | string | Publication start ISO date |  |
| ` --to `, ` --end-published-date ` | string | Publication end ISO date |  |
| ` --content ` | boolean, negatable | Request full page text when supported |  |
| ` --text ` | boolean, negatable | Request full page text when supported |  |
| ` --summary ` | boolean | Request summaries when supported |  |
| ` --highlights ` | boolean, negatable | Request highlights (default) |  |
| ` --live ` | boolean | Request fresh content when supported |  |
| ` --max-characters `, ` --maxcharacters ` | string | Maximum text/highlight characters |  |
| ` --fetch ` | boolean | Fetch the first displayed search result |  |
| ` --fetch-rank ` | string | Fetch one displayed absolute result rank |  |
| ` --fetch-limit ` | string | Fetch N displayed results |  |
| ` --fetch-offset ` | string | Skip N displayed results before fetching |  |
| ` --fetch-service ` | string | Select a configured fetch service instance |  |
| ` --fetch-provider `, ` --fetch-api ` | string | Filter fetch services by provider type |  |
| ` --fetch-max-characters ` | string | Maximum fetched content characters |  |
| ` --fetch-no-main ` | boolean | Keep the whole fetched page |  |

### ` fetch `

Fetch URL content through a configured service

Usage:

```text
woctl fetch [url]
```

Availability: configured service with capability ` fetch `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a configured service instance |  |
| ` --provider ` | string | Filter configured services by provider type |  |
| ` --api ` | string | Filter configured services by provider type (alias of --provider) |  |
| ` --list-services ` | boolean | List enabled services supporting this capability |  |
| ` --output `, ` -o ` | string | Output: md, json, yaml, table, wide, csv, name, value |  |
| ` --json ` | boolean | Output JSON |  |
| ` --raw ` | boolean | Emit the raw provider response in JSON or YAML |  |
| ` --text ` | boolean, negatable | Request extracted text (default) |  |
| ` --summary ` | boolean | Request a summary when supported |  |
| ` --highlights ` | boolean, negatable | Request highlights when supported |  |
| ` --live ` | boolean | Request fresh content when supported |  |
| ` --main ` | boolean, negatable | Extract main content (default); --no-main keeps the whole page |  |
| ` --metadata ` | boolean | Prepend title, source and service in Markdown |  |
| ` --max-characters `, ` --maxcharacters ` | string | Maximum extracted characters |  |

### ` tts `

Generate speech using a configured TTS service or built-in Edge TTS

Usage:

```text
woctl tts [text]
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a configured service instance |  |
| ` --provider ` | string | Filter configured services by provider type |  |
| ` --api ` | string | Filter configured services by provider type (alias of --provider) |  |
| ` --list-services ` | boolean | List enabled services supporting this capability |  |
| ` --text ` | string | Literal text to speak |  |
| ` --input ` | string | Text input from @file or - for stdin |  |
| ` --output-file ` | string | Audio destination path; - writes binary audio to stdout |  |
| ` --voice ` | string | Provider voice ID; Edge defaults to zh-CN-XiaoxiaoNeural |  |
| ` --model ` | string | Model ID for a model-backed provider |  |
| ` --audio-format ` | string | Audio format: mp3, wav, opus, aac, flac, pcm (Edge: mp3) |  |
| ` --speed ` | string | Speaking speed ratio from 0.25 through 4 |  |
| ` --rate ` | string | Edge speaking rate, such as +10%; conflicts with --speed |  |
| ` --pitch ` | string | Edge pitch, such as +5Hz |  |
| ` --volume ` | string | Edge volume, such as -10% |  |
| ` --instructions ` | string | Model-specific speech instructions |  |

Examples:

```sh
woctl tts "Hello" --output-file hello.mp3
```

```sh
woctl tts voices --locale zh-CN --json
```

### ` tts speak `

Generate speech from text

Usage:

```text
woctl tts speak [text]
```

### ` tts voices `

List available voices; availability depends on the provider

Usage:

```text
woctl tts voices
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --locale ` | string | Filter voices by locale, such as zh-CN |  |
| ` --query ` | string | Search voice IDs and names |  |

### ` openobserve `

Query OpenObserve logs, metrics and traces

Usage:

```text
woctl openobserve
```

Aliases: ` oo `

Availability: configured service with provider ` openobserve `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a service by name |  |
| ` --list-services ` | boolean | List available services of the same type in the current context |  |
| ` --output-file ` | string | Write the formatted result to a file; - writes to stdout |  |
| ` --organization `, ` --org ` | string | Override the organization name |  |
| ` --stream ` | string | Stream name |  |
| ` --stream-type `, ` --type ` | string | logs \| metrics \| traces |  |
| ` --redact ` | boolean | Redact sensitive values in displayed output; defaults to original data |  |

### ` openobserve health `

Check the healthz protocol endpoint

Usage:

```text
woctl openobserve health
```

Availability: configured service with provider ` openobserve `.

### ` openobserve stream `

stream operations

Usage:

```text
woctl openobserve stream
```

Availability: configured service with provider ` openobserve `.

### ` openobserve stream settings `

Show stream settings

Usage:

```text
woctl openobserve stream settings [stream]
```

Availability: configured service with provider ` openobserve `.

### ` openobserve stream update `

Update stream settings; requires a writable service and --yes

Usage:

```text
woctl openobserve stream update [stream]
```

Availability: configured service with provider ` openobserve `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | JSON settings object, @file or - |  |
| ` --yes ` | boolean | Confirm writes |  |

### ` openobserve stream delete `

Delete a stream; requires a writable service and --yes

Usage:

```text
woctl openobserve stream delete [stream]
```

Aliases: ` rm `

Availability: configured service with provider ` openobserve `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --yes ` | boolean | Confirm deletion |  |
| ` --delete-all ` | boolean | Also delete associated resources |  |

### ` openobserve stream list `

List streams

Usage:

```text
woctl openobserve stream list
```

Aliases: ` ls `

Availability: configured service with provider ` openobserve `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --offset ` | string | Result offset |  |
| ` --limit ` | string | Number of results, 1–1000 |  |
| ` --search ` | string | Name keyword |  |
| ` --fetch-schema ` | boolean | Also fetch schemas |  |

### ` openobserve stream schema `

Show a stream schema

Usage:

```text
woctl openobserve stream schema [stream]
```

Availability: configured service with provider ` openobserve `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --offset ` | string | Field offset |  |
| ` --limit ` | string | Number of fields, 1–1000 |  |
| ` --keyword ` | string | Field keyword |  |

### ` openobserve ingest `

ingest operations

Usage:

```text
woctl openobserve ingest
```

Availability: configured service with provider ` openobserve `.

### ` openobserve ingest json `

Ingest a JSON array of objects

Usage:

```text
woctl openobserve ingest json [input]
```

Availability: configured service with provider ` openobserve `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --yes ` | boolean | Confirm writes |  |

### ` openobserve ingest multi `

Ingest an NDJSON stream of objects

Usage:

```text
woctl openobserve ingest multi [input]
```

Availability: configured service with provider ` openobserve `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --yes ` | boolean | Confirm writes |  |

### ` openobserve values `

Read distinct field values

Usage:

```text
woctl openobserve values <field...>
```

Availability: configured service with provider ` openobserve `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --from ` | string | Start time; defaults to now-1h |  |
| ` --to ` | string | End time; defaults to now |  |
| ` --size ` | string | Number of values per field, 1–1000 |  |
| ` --keyword ` | string | Filter values |  |
| ` --count ` | boolean, negatable | Use --no-count to skip counting |  |

### ` openobserve around `

Read logs around a microsecond timestamp

Usage:

```text
woctl openobserve around <microseconds>
```

Availability: configured service with provider ` openobserve `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --size ` | string | Number of results, 1–1000 |  |

### ` openobserve log `

log operations

Usage:

```text
woctl openobserve log
```

Availability: configured service with provider ` openobserve `.

### ` openobserve log query `

Query a log stream

Usage:

```text
woctl openobserve log query [sql...]
```

Aliases: ` q `, ` search `

Availability: configured service with provider ` openobserve `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --from ` | string | Start time; defaults to now-1h |  |
| ` --to ` | string | End time; defaults to now |  |
| ` --offset ` | string | Result offset |  |
| ` --size ` | string | Number of results, 1–1000 |  |
| ` --limit ` | string | Alias for --size |  |
| ` --timeout ` | string | Server timeout, 1–60 seconds |  |
| ` --where ` | string | Generate a WHERE query using --stream |  |
| ` --text ` | string | Generate a match_all query using --stream |  |

### ` openobserve metric `

metric operations

Usage:

```text
woctl openobserve metric
```

Availability: configured service with provider ` openobserve `.

### ` openobserve metric query `

Query a metrics stream

Usage:

```text
woctl openobserve metric query [sql...]
```

Aliases: ` q `, ` sql `

Availability: configured service with provider ` openobserve `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --from ` | string | Start time; defaults to now-1h |  |
| ` --to ` | string | End time; defaults to now |  |
| ` --offset ` | string | Result offset |  |
| ` --size ` | string | Number of results, 1–1000 |  |
| ` --limit ` | string | Alias for --size |  |
| ` --timeout ` | string | Server timeout, 1–60 seconds |  |
| ` --where ` | string | Generate a WHERE query using --stream |  |
| ` --text ` | string | Generate a match_all query using --stream |  |

### ` openobserve status `

Check service health and organization authentication

Usage:

```text
woctl openobserve status
```

Availability: configured service with provider ` openobserve `.

### ` openobserve query `

Run read-only SQL or generate a full-text or filter query

Usage:

```text
woctl openobserve query [sql...]
```

Aliases: ` q `, ` search `

Availability: configured service with provider ` openobserve `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --from ` | string | Start time; defaults to now-1h |  |
| ` --to ` | string | End time; defaults to now |  |
| ` --offset ` | string | Result offset |  |
| ` --size ` | string | Number of results, 1–1000 |  |
| ` --limit ` | string | Alias for --size |  |
| ` --timeout ` | string | Server timeout, 1–60 seconds |  |
| ` --where ` | string | Generate a WHERE query using --stream |  |
| ` --text ` | string | Generate a match_all query using --stream |  |

### ` openobserve trace `

trace operations

Usage:

```text
woctl openobserve trace
```

Availability: configured service with provider ` openobserve `.

### ` openobserve trace query `

Query a traces stream

Usage:

```text
woctl openobserve trace query [sql...]
```

Aliases: ` q `, ` sql `

Availability: configured service with provider ` openobserve `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --from ` | string | Start time; defaults to now-1h |  |
| ` --to ` | string | End time; defaults to now |  |
| ` --offset ` | string | Result offset |  |
| ` --size ` | string | Number of results, 1–1000 |  |
| ` --limit ` | string | Alias for --size |  |
| ` --timeout ` | string | Server timeout, 1–60 seconds |  |
| ` --where ` | string | Generate a WHERE query using --stream |  |
| ` --text ` | string | Generate a match_all query using --stream |  |

### ` openobserve trace list `

Show recent trace summaries

Usage:

```text
woctl openobserve trace list
```

Aliases: ` ls `

Availability: configured service with provider ` openobserve `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --from ` | string | Start time; defaults to now-1h |  |
| ` --to ` | string | End time; defaults to now |  |
| ` --offset ` | string | Result offset |  |
| ` --size ` | string | Number of results, 1–1000 |  |
| ` --limit ` | string | Alias for --size |  |
| ` --timeout ` | string | Server timeout, 1–60 seconds |  |
| ` --filter ` | string | Trace filter expression |  |
| ` --sort-by ` | string | start_time \| duration |  |
| ` --sort-order ` | string | asc \| desc |  |

### ` apollo `

Manage Apollo Config, Portal and Admin services

Usage:

```text
woctl apollo
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a service by name |  |
| ` --list-services ` | boolean | List available services of the same type in the current context |  |
| ` --output-file ` | string | Write the formatted result to a file; - writes to stdout |  |
| ` --namespace ` | string | Apollo namespace |  |
| ` --cluster ` | string | Apollo cluster |  |
| ` --app-id ` | string | Apollo application ID |  |
| ` --env ` | string | Apollo environment |  |
| ` --operator ` | string | Apollo OpenAPI operator |  |
| ` --redact ` | boolean | Redact sensitive values in displayed output; defaults to original data |  |

### ` apollo read `

Apollo read config

Usage:

```text
woctl apollo read
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --read-format ` | string | auto \| config \| json \| properties \| raw \| content \| data |  |

### ` apollo admin `

admin operations

Usage:

```text
woctl apollo admin
```

Availability: configured service with provider ` apollo `.

### ` apollo admin request `

Apollo request

Usage:

```text
woctl apollo admin request
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo admin list-app `

Apollo list app

Usage:

```text
woctl apollo admin list-app
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo admin get-app `

Apollo get app

Usage:

```text
woctl apollo admin get-app
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo admin list-self-app `

Apollo list self app

Usage:

```text
woctl apollo admin list-self-app
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo admin create-app `

Apollo create app

Usage:

```text
woctl apollo admin create-app
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo admin create-app-env `

Apollo create app env

Usage:

```text
woctl apollo admin create-app-env
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo admin update-app `

Apollo update app

Usage:

```text
woctl apollo admin update-app
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo admin delete-app `

Apollo delete app

Usage:

```text
woctl apollo admin delete-app
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo admin list-missing-app-env `

Apollo list missing app env

Usage:

```text
woctl apollo admin list-missing-app-env
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo admin get-env-cluster `

Apollo get env cluster

Usage:

```text
woctl apollo admin get-env-cluster
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo admin get-cluster `

Apollo get cluster

Usage:

```text
woctl apollo admin get-cluster
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo admin create-cluster `

Apollo create cluster

Usage:

```text
woctl apollo admin create-cluster
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo admin delete-cluster `

Apollo delete cluster

Usage:

```text
woctl apollo admin delete-cluster
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo admin list-namespace `

Apollo list namespace

Usage:

```text
woctl apollo admin list-namespace
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo admin get-namespace `

Apollo get namespace

Usage:

```text
woctl apollo admin get-namespace
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo admin get-namespace-lock `

Apollo get namespace lock

Usage:

```text
woctl apollo admin get-namespace-lock
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo admin create-namespace `

Apollo create namespace

Usage:

```text
woctl apollo admin create-namespace
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo admin delete-namespace `

Apollo delete namespace

Usage:

```text
woctl apollo admin delete-namespace
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo admin list-namespace-usage `

Apollo list namespace usage

Usage:

```text
woctl apollo admin list-namespace-usage
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo admin list-missing-namespace `

Apollo list missing namespace

Usage:

```text
woctl apollo admin list-missing-namespace
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo admin create-missing-namespace `

Apollo create missing namespace

Usage:

```text
woctl apollo admin create-missing-namespace
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo admin list-item `

Apollo list item

Usage:

```text
woctl apollo admin list-item
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo admin get-item `

Apollo get item

Usage:

```text
woctl apollo admin get-item
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo admin upsert-item `

Apollo upsert item

Usage:

```text
woctl apollo admin upsert-item
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo admin delete-item `

Apollo delete item

Usage:

```text
woctl apollo admin delete-item
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo admin get-latest-release `

Apollo get latest release

Usage:

```text
woctl apollo admin get-latest-release
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo admin publish-release `

Apollo publish release

Usage:

```text
woctl apollo admin publish-release
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo status `

Apollo get status

Usage:

```text
woctl apollo status
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo portal `

portal operations

Usage:

```text
woctl apollo portal
```

Availability: configured service with provider ` apollo `.

### ` apollo portal apps `

Apollo list portal app

Usage:

```text
woctl apollo portal apps
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo portal organizations `

Apollo list portal organization

Usage:

```text
woctl apollo portal organizations
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo portal environments `

Apollo list portal env

Usage:

```text
woctl apollo portal environments
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo portal tree `

Apollo get portal nav tree

Usage:

```text
woctl apollo portal tree
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo portal namespaces `

Apollo list portal namespace

Usage:

```text
woctl apollo portal namespaces
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo portal namespace `

Apollo get portal namespace

Usage:

```text
woctl apollo portal namespace
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo portal items `

Apollo list portal item

Usage:

```text
woctl apollo portal items
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo portal releases `

Apollo list portal release

Usage:

```text
woctl apollo portal releases
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo portal config `

Apollo get portal config

Usage:

```text
woctl apollo portal config
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo release `

release operations

Usage:

```text
woctl apollo release
```

Availability: configured service with provider ` apollo `.

### ` apollo release list `

Apollo list release

Usage:

```text
woctl apollo release list
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo release get `

Apollo get release

Usage:

```text
woctl apollo release get
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo release diff `

Apollo diff release

Usage:

```text
woctl apollo release diff
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo release rollback `

Apollo rollback release

Usage:

```text
woctl apollo release rollback
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo release pending `

Apollo diff namespace release

Usage:

```text
woctl apollo release pending
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |

### ` apollo release publish `

Apollo publish namespace release

Usage:

```text
woctl apollo release publish
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo item `

item operations

Usage:

```text
woctl apollo item
```

Availability: configured service with provider ` apollo `.

### ` apollo item patch `

Apollo patch namespace item

Usage:

```text
woctl apollo item patch
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo namespace `

namespace operations

Usage:

```text
woctl apollo namespace
```

Availability: configured service with provider ` apollo `.

### ` apollo namespace write `

Apollo write namespace text

Usage:

```text
woctl apollo namespace write
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` apollo namespace patch `

Apollo patch namespace document

Usage:

```text
woctl apollo namespace patch
```

Availability: configured service with provider ` apollo `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input ` | string | Operation input as JSON, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm this write operation |  |
| ` --dry-run ` | boolean | Preview supported operations without modifying Apollo |  |

### ` mcp `

MCP servers, tools, resources and calls

Usage:

```text
woctl mcp
```

Availability: host capability ` mcp `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --url ` | string | Temporary HTTP MCP URL; not saved to configuration |  |
| ` --name ` | string | Temporary MCP server name |  |

### ` mcp servers `

List configured MCP servers without connecting

Usage:

```text
woctl mcp servers
```

Aliases: ` list `

Availability: host capability ` mcp `.

### ` mcp tools `

List MCP tool names, or inspect one tool

Usage:

```text
woctl mcp tools [server] [tool]
```

Availability: host capability ` mcp `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --typescript ` | boolean | Show tool contracts as TypeScript |  |

### ` mcp resources `

List MCP resources

Usage:

```text
woctl mcp resources [server]
```

Availability: host capability ` mcp `.

### ` mcp read `

Read an MCP resource

Usage:

```text
woctl mcp read <server> <uri>
```

Availability: host capability ` mcp `.

### ` mcp info `

Show MCP server or tool information

Usage:

```text
woctl mcp info <server> [tool]
```

Availability: host capability ` mcp `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --typescript ` | boolean | Show tool contracts as TypeScript |  |

### ` mcp call `

Call an MCP tool

Usage:

```text
woctl mcp call <server> <tool> [input]
```

Availability: host capability ` mcp `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --input `, ` -i ` | string | JSON, @file, or - to read stdin |  |

### ` mcp grep `

Search MCP tools

Usage:

```text
woctl mcp grep <pattern>
```

Availability: host capability ` mcp `.

### ` prompt `

Generate text with a model in the current context, with templates and request previews

Usage:

```text
woctl prompt [text...]
```

Aliases: ` p `

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --model `, ` -m ` | string | Model alias or provider/model |  |
| ` --provider ` | string | Select an AI provider |  |
| ` --protocol ` | string | Override protocol: openai/openai-response/anthropic/gemini |  |
| ` --prompt `, ` -p ` | string, repeatable | Additional prompt, @file or -; repeatable |  |
| ` --system `, ` -s ` | string | System prompt or @file |  |
| ` --message ` | string, repeatable | Additional role:content message; repeatable |  |
| ` --temperature ` | string | Sampling temperature, 0..2 |  |
| ` --top-p ` | string | Top-p sampling, 0..1 |  |
| ` --max-output-tokens ` | string | Output token limit (must be explicitly configured for Anthropic) |  |
| ` --output `, ` -o ` | string | text \| json (complete result) \| jsonl \| markdown |  |
| ` --json ` | boolean | Request a JSON object from the model |  |
| ` --jsonschema ` | string | Required JSON Schema: JSON or @file |  |
| ` --dump ` | boolean | Show the request with credentials hidden without network access |  |
| ` --stream ` | boolean, negatable | Stream generation over SSE; Node supports incremental output |  |
| ` --var ` | string, repeatable | Template variable name=value or name=@file; repeatable |  |
| ` --input ` | string, repeatable | Template variable name=value; repeatable |  |

### ` prompt list `

List prompt presets in the current context

Usage:

```text
woctl prompt list
```

Aliases: ` ls `

### ` prompt show `

Show a prompt preset; --json outputs the complete configuration

Usage:

```text
woctl prompt show <name>
```

### ` prompt import `

Import YAML frontmatter and template content from .prompt.md

Usage:

```text
woctl prompt import <name> [source]
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --text ` | string | Import template text directly |  |

### ` prompt remove `

Remove a prompt preset defined in the current context

Usage:

```text
woctl prompt remove <name>
```

### ` prompt render `

Render a template with variables without calling a model

Usage:

```text
woctl prompt render <name>
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --var ` | string, repeatable | Template variable name=value or name=@file; repeatable |  |
| ` --input ` | string, repeatable | Template variable name=value; repeatable |  |

### ` render `

Render Markdown, JSON, YAML, text, PDF or spreadsheets

Usage:

```text
woctl render [source]
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --text ` | string | Inline text; skips file and stdin input |  |
| ` --input ` | string | auto \| markdown \| md \| json \| jsonl \| yaml \| code \| text \| pdf \| xlsx |  |
| ` --format `, ` -f ` | string | terminal \| text \| md \| json \| jsonl \| yaml \| csv \| table |  |
| ` --output `, ` -o ` | string | Output file; - or omitted for stdout |  |
| ` --width ` | string | Terminal display width, 20..4096 |  |
| ` --color ` | boolean, negatable | ANSI styling; defaults to the host terminal setting |  |
| ` --link ` | string | auto \| always \| never; always enables OSC 8 links |  |
| ` --pages ` | string | PDF page selection, e.g. 1,3-5 |  |
| ` --page-limit ` | string | Maximum PDF pages to read |  |
| ` --password ` | string | PDF document password |  |
| ` --password-env ` | string | Environment variable containing the PDF password |  |
| ` --sheet ` | string | Spreadsheet sheet name or index |  |
| ` --range ` | string | Spreadsheet cell range, e.g. A1:D20 |  |
| ` --limit ` | string | Maximum spreadsheet rows to read |  |
| ` --offset ` | string | Spreadsheet row offset |  |
| ` --raw ` | boolean | Read raw spreadsheet cell values |  |
| ` --header ` | boolean, negatable | Detect spreadsheet column headers |  |

### ` markdown `

Render Markdown as terminal text

Usage:

```text
woctl markdown [source]
```

Aliases: ` md `

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --text ` | string | Inline text; skips file and stdin input |  |
| ` --input ` | string | auto \| markdown \| md \| json \| jsonl \| yaml \| code \| text \| pdf \| xlsx |  |
| ` --format `, ` -f ` | string | terminal \| text \| md \| json \| jsonl \| yaml \| csv \| table |  |
| ` --output `, ` -o ` | string | Output file; - or omitted for stdout |  |
| ` --width ` | string | Terminal display width, 20..4096 |  |
| ` --color ` | boolean, negatable | ANSI styling; defaults to the host terminal setting |  |
| ` --link ` | string | auto \| always \| never; always enables OSC 8 links |  |

### ` pdf `

PDF utilities: info, inspect, read, parse, render

Usage:

```text
woctl pdf
```

### ` pdf info `

Read PDF metadata, page sizes, outline and attachments

Usage:

```text
woctl pdf info <file>
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --page-limit ` | string | Number of pages to sample (default: 20) |  |
| ` --all-pages ` | boolean | Inspect all pages |  |
| ` --password ` | string | PDF password |  |
| ` --password-env ` | string | Read PDF password from the named environment variable |  |
| ` --output `, ` -o ` | string | Output format: md \| json \| yaml \| table (default: md) |  |
| ` --format `, ` -f ` | string | Field projection for structured output or template list |  |
| ` --json ` | boolean | Output JSON |  |
| ` --output-file ` | string | Write text output to a file; - or omitted for stdout |  |
| ` --in-place ` | boolean | Allow an output path that overwrites the source file |  |

### ` pdf inspect `

Explore PDF internals for extraction planning

Usage:

```text
woctl pdf inspect <file>
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --detail ` | string | Detail: brief \| normal \| full \| debug (default: normal) |  |
| ` --brief ` | boolean | Use brief detail |  |
| ` --full ` | boolean | Use full detail |  |
| ` --debug ` | boolean | Use debug detail |  |
| ` --pages ` | string | Pages: 1,3-5,last,odd,even,all |  |
| ` --page-limit ` | string | Read first N pages when --pages is omitted |  |
| ` --all-pages ` | boolean | Inspect every page |  |
| ` --skip-pages ` | boolean | Skip page inspection |  |
| ` --skip-metadata ` | boolean | Skip metadata |  |
| ` --skip-viewer ` | boolean | Skip viewer metadata |  |
| ` --skip-outline ` | boolean | Skip bookmarks |  |
| ` --skip-attachments ` | boolean | Skip attachments |  |
| ` --annotations ` | boolean | Include page annotations |  |
| ` --text ` | boolean | Include bounded page text |  |
| ` --operators ` | boolean | Include operator statistics |  |
| ` --struct-tree ` | boolean | Include page structure tree |  |
| ` --js ` | boolean | Include JavaScript action summaries |  |
| ` --forms ` | boolean | Include form field summary |  |
| ` --destinations ` | boolean | Include named destinations |  |
| ` --optional-content ` | boolean | Include optional content configuration |  |
| ` --raw ` | boolean | Include bounded raw previews |  |
| ` --timings ` | boolean | Include timing measurements |  |
| ` --text-limit ` | string | Maximum text sample characters per page |  |
| ` --annotation-limit ` | string | Maximum annotations per page |  |
| ` --outline-limit ` | string | Maximum outline items |  |
| ` --outline-depth ` | string | Maximum outline depth |  |
| ` --max-array ` | string | Maximum raw array/object entries |  |
| ` --max-depth ` | string | Maximum raw preview depth |  |
| ` --verbosity ` | string | PDF.js verbosity: errors \| warnings \| infos (default: errors) |  |
| ` --strict ` | boolean | Fail on the first PDF.js section error |  |
| ` --password ` | string | PDF password |  |
| ` --password-env ` | string | Read PDF password from the named environment variable |  |
| ` --output `, ` -o ` | string | Output format: md \| json \| yaml \| table (default: md) |  |
| ` --format `, ` -f ` | string | Field projection for structured output or template list |  |
| ` --json ` | boolean | Output JSON |  |
| ` --output-file ` | string | Write text output to a file; - or omitted for stdout |  |
| ` --in-place ` | boolean | Allow an output path that overwrites the source file |  |

### ` pdf read `

Read PDF text as Markdown

Usage:

```text
woctl pdf read <file>
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --pages ` | string | Pages: 1,3-5,last,odd,even,all |  |
| ` --page-limit ` | string | Read first N pages when --pages is omitted |  |
| ` --frontmatter ` | boolean | Include YAML frontmatter |  |
| ` --page-headings ` | boolean, negatable | Include page headings; disable with --no-page-headings |  |
| ` --preserve-empty-pages ` | boolean | Mark empty pages |  |
| ` --line-gap ` | string | Y-axis tolerance for line grouping (default: 3) |  |
| ` --text ` | boolean | Output plain text |  |
| ` --verbosity ` | string | PDF.js verbosity: errors \| warnings \| infos (default: errors) |  |
| ` --password ` | string | PDF password |  |
| ` --password-env ` | string | Read PDF password from the named environment variable |  |
| ` --output `, ` -o ` | string | Output format: md \| json \| yaml \| table (default: md) |  |
| ` --format `, ` -f ` | string | Field projection for structured output or template list |  |
| ` --json ` | boolean | Output JSON |  |
| ` --output-file ` | string | Write text output to a file; - or omitted for stdout |  |
| ` --in-place ` | boolean | Allow an output path that overwrites the source file |  |

### ` pdf parse `

Parse PDF with heuristic templates

Usage:

```text
woctl pdf parse [file]
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --template ` | string | Template name/alias (default: auto) |  |
| ` --list-templates ` | boolean | List available templates without reading a PDF |  |
| ` --min-confidence ` | string | Minimum confidence, 0..1 (default: 0.25) |  |
| ` --debug ` | boolean | Include intermediate text and lines |  |
| ` --pages ` | string | Pages: 1,3-5,last,odd,even,all |  |
| ` --page-limit ` | string | Read first N pages when --pages is omitted |  |
| ` --verbosity ` | string | PDF.js verbosity: errors \| warnings \| infos (default: errors) |  |
| ` --password ` | string | PDF password |  |
| ` --password-env ` | string | Read PDF password from the named environment variable |  |
| ` --output `, ` -o ` | string | Output format: md \| json \| yaml \| table (default: md) |  |
| ` --format `, ` -f ` | string | Field projection for structured output or template list |  |
| ` --json ` | boolean | Output JSON |  |
| ` --output-file ` | string | Write text output to a file; - or omitted for stdout |  |
| ` --in-place ` | boolean | Allow an output path that overwrites the source file |  |

### ` pdf render `

Render PDF pages to PNG with PDFium and CanvasKit

Usage:

```text
woctl pdf render <file>
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --page ` | string | Single page to render |  |
| ` --pages ` | string | Pages: 1,3-5,last,odd,even,all |  |
| ` --page-limit ` | string | Read first N pages when --pages is omitted |  |
| ` --output `, ` -o ` | string | PNG path; multiple pages require page-%03d.png, {page} or {index}; - for stdout |  |
| ` --dpi ` | string | Render DPI and PNG resolution metadata (default: 150) |  |
| ` --scale ` | string | Scale override when width/height are omitted |  |
| ` --width ` | string | Fit to this pixel width |  |
| ` --height ` | string | Fit to this pixel height |  |
| ` --transparent ` | boolean | Use transparent background |  |
| ` --render-form-fields ` | boolean | Render interactive form fields |  |
| ` --password ` | string | PDF password |  |
| ` --password-env ` | string | Read PDF password from the named environment variable |  |
| ` --in-place ` | boolean | Allow an output path that overwrites the source file |  |

### ` xlsx `

Inspect, read, edit, tidy, and export XLSX workbooks

Usage:

```text
woctl xlsx
```

### ` xlsx read `

Read or preview one XLSX worksheet

Usage:

```text
woctl xlsx read <file>
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --sheet ` | string | Sheet name or 0-based index |  |
| ` --range ` | string | A1 range to read before offset and limit |  |
| ` --limit ` | string | Rows to render; 0 means all rows | ` "50" ` |
| ` --offset ` | string | Rows to skip after applying the range | ` "0" ` |
| ` --raw ` | boolean | Read raw cell values instead of formatted values |  |
| ` --raw-rows ` | boolean | CSV output uses exact rows without generated c1,c2 headers |  |
| ` --header ` | boolean | Use the first row as field names for table, CSV, or JSONL |  |
| ` --output `, ` -o ` | string | Output format: md \| table \| csv \| json \| jsonl \| yaml (default: md) |  |

### ` xlsx inspect `

Inspect XLSX workbook and sheet metadata

Usage:

```text
woctl xlsx inspect <file>
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --sample ` | string | Sample rows per sheet in JSON/YAML output | ` "5" ` |
| ` --raw ` | boolean | Read raw cell values instead of formatted values |  |
| ` --output `, ` -o ` | string | Output format: md \| table \| json \| yaml (default: md) |  |

### ` xlsx props `

Read XLSX workbook custom properties

Usage:

```text
woctl xlsx props <file>
```

Aliases: ` properties `

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --prefix ` | string | Include only property names starting with this prefix |  |
| ` --strip-prefix ` | boolean | Strip --prefix from property names |  |
| ` --output `, ` -o ` | string | Output format: table \| md \| json \| yaml (default: table) |  |

### ` xlsx list `

List worksheets in an XLSX workbook

Usage:

```text
woctl xlsx list <file>
```

Aliases: ` sheets `

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --output `, ` -o ` | string | Output format: name \| table \| json \| yaml (default: name) |  |

### ` xlsx edit `

Create or edit XLSX cells, rows, and styles

Usage:

```text
woctl xlsx edit [file]
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --create ` | boolean | Create a new workbook |  |
| ` --out ` | string | Output XLSX file |  |
| ` --in-place ` | boolean | Explicitly overwrite the input workbook |  |
| ` --sheet ` | string | Target sheet name; created if missing | ` "Sheet1" ` |
| ` --start ` | string | Top-left cell for CSV/JSON rows | ` "A1" ` |
| ` --append ` | boolean | Append rows after existing data |  |
| ` --replace-sheet ` | boolean | Delete and recreate the target sheet |  |
| ` --csv ` | string | CSV text, or - for stdin |  |
| ` --csv-file ` | string | CSV input file, or - for stdin |  |
| ` --json ` | string | JSON array rows/objects, or - for stdin |  |
| ` --json-file ` | string | JSON input file, or - for stdin |  |
| ` --set ` | string, repeatable, variadic | CELL=VALUE; repeatable |  |
| ` --style ` | string, repeatable, variadic | RANGE=PRESET, font-size:N, or Style JSON; repeatable |  |
| ` --style-mode ` | string | Style application: merge \| replace | ` "merge" ` |
| ` --font-size ` | string, repeatable, variadic | RANGE=SIZE |  |
| ` --wrap ` | string, repeatable, variadic | RANGE |  |
| ` --fill ` | string, repeatable, variadic | RANGE=COLOR |  |
| ` --align ` | string, repeatable, variadic | RANGE=left\|center\|right |  |
| ` --numfmt ` | string, repeatable, variadic | RANGE=preset-or-custom-format |  |
| ` --header-style ` | boolean | Style the first written row as a header |  |
| ` --freeze-header ` | boolean | Freeze panes below the first written row |  |
| ` --autofit ` | boolean | Set simple column widths from written rows |  |
| ` --raw ` | boolean | Read raw cell values instead of formatted values |  |
| ` --output `, ` -o ` | string | Result output: table \| json \| yaml (default: table) |  |

### ` xlsx tidy `

Rebuild a workbook from actual rows; drops stale styles, images, drawings, and sheet internals

Usage:

```text
woctl xlsx tidy <file>
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --out ` | string | Output rebuilt XLSX file |  |
| ` --in-place ` | boolean | Explicitly overwrite the input workbook |  |
| ` --keep-empty-sheets ` | boolean | Keep empty sheets |  |
| ` --header-style ` | boolean | Style the first written row as a header |  |
| ` --freeze-header ` | boolean | Freeze panes below the first written row |  |
| ` --autofit ` | boolean | Set simple column widths from written rows |  |
| ` --raw ` | boolean | Read raw cell values instead of formatted values |  |
| ` --output `, ` -o ` | string | Result output: table \| json \| yaml (default: table) |  |

### ` xlsx export `

Export XLSX worksheets to CSV files

Usage:

```text
woctl xlsx export <file>
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --out-dir ` | string | Output directory; defaults to XLSX basename |  |
| ` --sheet ` | string, repeatable, variadic | Sheet name or 0-based index; repeatable, defaults to all |  |
| ` --raw ` | boolean | Read raw cell values instead of formatted values |  |
| ` --bom ` | boolean | Prefix CSV files with UTF-8 BOM |  |
| ` --manifest ` | boolean, negatable | Write xlsx.manifest.json; --no-manifest disables it | ` true ` |
| ` --output `, ` -o ` | string | Export format: csv (default: csv) |  |

### ` catalog `

Export the complete static command and service provider catalog.
jsonschema describes the catalog document, not the complete native config file schema.

Usage:

```text
woctl catalog
```

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --output `, ` -o ` | string | Output: json, md, typescript, jsonschema | ` "json" ` |
| ` --service-type ` | string | Filter by canonical service provider name or alias |  |
| ` --output-file ` | string | Write the export to this path instead of stdout |  |
| ` --json ` | boolean | Output the complete JSON catalog |  |
| ` --format `, ` -f ` | string | Field projection is unsupported for catalog exports |  |

## Service providers

### ` duckduckgo `

Aliases: ` ddg `

Capabilities: ` search `

Provider options schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "instantAnswerBaseUrl": {
      "type": "string",
      "format": "uri"
    },
    "htmlBaseUrl": {
      "type": "string",
      "format": "uri"
    },
    "userAgent": {
      "type": "string",
      "pattern": "\\S"
    },
    "timeout": {
      "type": "integer",
      "minimum": 1,
      "maximum": 2147483647
    }
  },
  "additionalProperties": false
}
```

#### Static tools

##### ` search `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "pattern": "\\S"
    },
    "urls": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "uri"
      },
      "nullable": true
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "includeDomains": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "nullable": true
    },
    "excludeDomains": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "nullable": true
    },
    "range": {
      "type": "string",
      "nullable": true
    },
    "from": {
      "anyOf": [
        {
          "type": "string"
        },
        {}
      ],
      "type": "string",
      "nullable": true
    },
    "to": {
      "anyOf": [
        {
          "type": "string"
        },
        {}
      ],
      "type": "string",
      "nullable": true
    },
    "searchType": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "category": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cursor": {
      "type": "string",
      "nullable": true
    },
    "content": {
      "type": "object",
      "properties": {
        "text": {
          "type": "boolean",
          "nullable": true
        },
        "summary": {
          "type": "boolean",
          "nullable": true
        },
        "highlights": {
          "type": "boolean",
          "nullable": true
        },
        "live": {
          "type": "boolean",
          "nullable": true
        },
        "maxCharacters": {
          "type": "integer",
          "minimum": 1,
          "maximum": 9007199254740991,
          "nullable": true
        }
      },
      "additionalProperties": false,
      "nullable": true
    },
    "raw": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "query"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string"
          },
          "title": {
            "type": "string",
            "nullable": true
          },
          "text": {
            "type": "string",
            "nullable": true
          },
          "summary": {
            "type": "string",
            "nullable": true
          },
          "highlights": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "publishedAt": {
            "type": "string",
            "nullable": true
          },
          "score": {
            "type": "number",
            "nullable": true
          },
          "metadata": {
            "type": "object",
            "propertyNames": {
              "type": "string"
            },
            "additionalProperties": {},
            "nullable": true
          }
        },
        "required": [
          "url"
        ],
        "additionalProperties": {}
      }
    },
    "nextCursor": {
      "type": "string",
      "nullable": true
    },
    "metadata": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "raw": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "items"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

### ` exa `

Capabilities: ` search `, ` fetch `

Provider options schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "apiKey": {
      "description": "Exa API key; supports env://NAME through the host configuration resolver. May also be supplied in the x-api-key header.",
      "type": "string",
      "minLength": 1
    },
    "timeout": {
      "description": "Request timeout in milliseconds.",
      "type": "integer",
      "minimum": 1,
      "maximum": 2147483647
    }
  },
  "additionalProperties": false
}
```

#### Static tools

##### ` search `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "pattern": "\\S"
    },
    "urls": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "uri"
      },
      "nullable": true
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "includeDomains": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "nullable": true
    },
    "excludeDomains": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "nullable": true
    },
    "range": {
      "type": "string",
      "nullable": true
    },
    "from": {
      "anyOf": [
        {
          "type": "string"
        },
        {}
      ],
      "type": "string",
      "nullable": true
    },
    "to": {
      "anyOf": [
        {
          "type": "string"
        },
        {}
      ],
      "type": "string",
      "nullable": true
    },
    "searchType": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "category": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cursor": {
      "type": "string",
      "nullable": true
    },
    "content": {
      "type": "object",
      "properties": {
        "text": {
          "type": "boolean",
          "nullable": true
        },
        "summary": {
          "type": "boolean",
          "nullable": true
        },
        "highlights": {
          "type": "boolean",
          "nullable": true
        },
        "live": {
          "type": "boolean",
          "nullable": true
        },
        "maxCharacters": {
          "type": "integer",
          "minimum": 1,
          "maximum": 9007199254740991,
          "nullable": true
        }
      },
      "additionalProperties": false,
      "nullable": true
    },
    "raw": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "query"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string"
          },
          "title": {
            "type": "string",
            "nullable": true
          },
          "text": {
            "type": "string",
            "nullable": true
          },
          "summary": {
            "type": "string",
            "nullable": true
          },
          "highlights": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "publishedAt": {
            "type": "string",
            "nullable": true
          },
          "score": {
            "type": "number",
            "nullable": true
          },
          "metadata": {
            "type": "object",
            "propertyNames": {
              "type": "string"
            },
            "additionalProperties": {},
            "nullable": true
          }
        },
        "required": [
          "url"
        ],
        "additionalProperties": {}
      }
    },
    "nextCursor": {
      "type": "string",
      "nullable": true
    },
    "metadata": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "raw": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "items"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` fetch `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "format": "uri"
    },
    "text": {
      "type": "boolean",
      "nullable": true
    },
    "summary": {
      "type": "boolean",
      "nullable": true
    },
    "highlights": {
      "type": "boolean",
      "nullable": true
    },
    "live": {
      "type": "boolean",
      "nullable": true
    },
    "maxCharacters": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "main": {
      "type": "boolean",
      "nullable": true
    },
    "metadata": {
      "type": "boolean",
      "nullable": true
    },
    "raw": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "url"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "url": {
      "type": "string"
    },
    "content": {
      "type": "string"
    },
    "contentType": {
      "type": "string",
      "nullable": true
    },
    "title": {
      "type": "string",
      "nullable": true
    },
    "summary": {
      "type": "string",
      "nullable": true
    },
    "highlights": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "nullable": true
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "publishedDate": {
      "type": "string",
      "nullable": true
    },
    "author": {
      "type": "string",
      "nullable": true
    },
    "metadata": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "raw": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "content",
    "url"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

### ` jina `

Capabilities: ` fetch `

Provider options schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "apiKey": {
      "type": "string",
      "minLength": 1
    },
    "timeout": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    }
  },
  "additionalProperties": false
}
```

#### Static tools

##### ` fetch `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "format": "uri"
    },
    "text": {
      "type": "boolean",
      "nullable": true
    },
    "summary": {
      "type": "boolean",
      "nullable": true
    },
    "highlights": {
      "type": "boolean",
      "nullable": true
    },
    "live": {
      "type": "boolean",
      "nullable": true
    },
    "maxCharacters": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "main": {
      "type": "boolean",
      "nullable": true
    },
    "metadata": {
      "type": "boolean",
      "nullable": true
    },
    "raw": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "url"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "url": {
      "type": "string"
    },
    "content": {
      "type": "string"
    },
    "contentType": {
      "type": "string",
      "nullable": true
    },
    "title": {
      "type": "string",
      "nullable": true
    },
    "summary": {
      "type": "string",
      "nullable": true
    },
    "highlights": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "nullable": true
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "publishedDate": {
      "type": "string",
      "nullable": true
    },
    "author": {
      "type": "string",
      "nullable": true
    },
    "metadata": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "raw": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "content",
    "url"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

### ` base `

Aliases: ` direct `

Capabilities: ` fetch `

Provider options schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

#### Static tools

##### ` fetch `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "format": "uri"
    },
    "text": {
      "type": "boolean",
      "nullable": true
    },
    "summary": {
      "type": "boolean",
      "nullable": true
    },
    "highlights": {
      "type": "boolean",
      "nullable": true
    },
    "live": {
      "type": "boolean",
      "nullable": true
    },
    "maxCharacters": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "main": {
      "type": "boolean",
      "nullable": true
    },
    "metadata": {
      "type": "boolean",
      "nullable": true
    },
    "raw": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "url"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "url": {
      "type": "string"
    },
    "content": {
      "type": "string"
    },
    "contentType": {
      "type": "string",
      "nullable": true
    },
    "title": {
      "type": "string",
      "nullable": true
    },
    "summary": {
      "type": "string",
      "nullable": true
    },
    "highlights": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "nullable": true
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "publishedDate": {
      "type": "string",
      "nullable": true
    },
    "author": {
      "type": "string",
      "nullable": true
    },
    "metadata": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "raw": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "content",
    "url"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

### ` sql ` — SQL database

Query and inspect SQLite and PostgreSQL databases using the host SQL driver.

Aliases: ` sqlite `, ` postgres `, ` postgresql `, ` pg `

Capabilities: ` sql `

Examples:

Run a read-only query.

```sh
woctl sql query "SELECT 1 AS value"
```

Check the database connection.

```sh
woctl sql ping
```

Provider options schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "dialect": {
      "type": "string",
      "minLength": 1
    },
    "filename": {
      "type": "string",
      "minLength": 1
    },
    "timeoutMs": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "connectTimeoutMs": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "maxRowLimit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "ssl": {
      "type": "boolean"
    }
  },
  "additionalProperties": false
}
```

#### Contract

##### ` ping `

Check SQL connectivity and report database version and latency

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean"
    },
    "durationMs": {
      "type": "number",
      "minimum": 0
    },
    "version": {
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "durationMs",
    "ok"
  ],
  "additionalProperties": false
}
```

##### ` query `

Execute one read-only SQL statement with bound parameters and bounded pagination

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "statement": {
      "type": "string",
      "pattern": "\\S"
    },
    "params": {
      "readOnly": true,
      "type": "array",
      "items": {},
      "nullable": true
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "nullable": true
    }
  },
  "required": [
    "statement"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "columns": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "rows": {
      "type": "array",
      "items": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {}
      }
    },
    "durationMs": {
      "type": "number",
      "minimum": 0
    },
    "affectedRows": {
      "nullable": true,
      "type": [
        "number",
        "string"
      ]
    },
    "lastInsertId": {
      "type": "string",
      "nullable": true
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "nullable": true
    }
  },
  "required": [
    "columns",
    "durationMs",
    "rows"
  ],
  "additionalProperties": false
}
```

##### ` exec `

Execute one SQL statement with bound parameters; requires a writable service

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "statement": {
      "type": "string",
      "pattern": "\\S"
    },
    "params": {
      "readOnly": true,
      "type": "array",
      "items": {},
      "nullable": true
    }
  },
  "required": [
    "statement"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "columns": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "rows": {
      "type": "array",
      "items": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {}
      }
    },
    "durationMs": {
      "type": "number",
      "minimum": 0
    },
    "affectedRows": {
      "nullable": true,
      "type": [
        "number",
        "string"
      ]
    },
    "lastInsertId": {
      "type": "string",
      "nullable": true
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "nullable": true
    }
  },
  "required": [
    "columns",
    "durationMs",
    "rows"
  ],
  "additionalProperties": false
}
```

##### ` listObject `

List database objects under an optional parent with search and bounded pagination

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "parent": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1,
          "nullable": true
        },
        "schema": {
          "type": "string",
          "nullable": true
        },
        "catalog": {
          "type": "string",
          "nullable": true
        },
        "type": {
          "type": "string",
          "nullable": true
        }
      },
      "additionalProperties": false,
      "nullable": true
    },
    "search": {
      "type": "string",
      "nullable": true
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "catalog": {
        "type": "string",
        "nullable": true
      },
      "schema": {
        "type": "string",
        "nullable": true
      },
      "name": {
        "type": "string"
      },
      "type": {
        "type": "string"
      },
      "comment": {
        "type": "string",
        "nullable": true
      },
      "attributes": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {},
        "nullable": true
      }
    },
    "required": [
      "name",
      "type"
    ],
    "additionalProperties": false
  }
}
```

##### ` describeObject `

Describe a named database object, its children and attributes

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "object": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1
        },
        "schema": {
          "type": "string",
          "nullable": true
        },
        "catalog": {
          "type": "string",
          "nullable": true
        },
        "type": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "name"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "object"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "object": {
      "type": "object",
      "properties": {
        "catalog": {
          "type": "string",
          "nullable": true
        },
        "schema": {
          "type": "string",
          "nullable": true
        },
        "name": {
          "type": "string"
        },
        "type": {
          "type": "string"
        },
        "comment": {
          "type": "string",
          "nullable": true
        },
        "attributes": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {},
          "nullable": true
        }
      },
      "required": [
        "name",
        "type"
      ],
      "additionalProperties": false
    },
    "children": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "catalog": {
            "type": "string",
            "nullable": true
          },
          "schema": {
            "type": "string",
            "nullable": true
          },
          "name": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "comment": {
            "type": "string",
            "nullable": true
          },
          "attributes": {
            "type": "object",
            "propertyNames": {
              "type": "string"
            },
            "additionalProperties": {},
            "nullable": true
          }
        },
        "required": [
          "name",
          "type"
        ],
        "additionalProperties": false
      },
      "nullable": true
    },
    "attributes": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "durationMs": {
      "type": "number",
      "minimum": 0,
      "nullable": true
    }
  },
  "required": [
    "object"
  ],
  "additionalProperties": false
}
```

#### Static tools

##### ` ping `

Check SQL connectivity and report database version and latency

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean"
    },
    "durationMs": {
      "type": "number",
      "minimum": 0
    },
    "version": {
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "durationMs",
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` query `

Execute one read-only SQL statement with bound parameters and bounded pagination

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "statement": {
      "type": "string",
      "pattern": "\\S"
    },
    "params": {
      "readOnly": true,
      "type": "array",
      "items": {},
      "nullable": true
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "nullable": true
    }
  },
  "required": [
    "statement"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "columns": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "rows": {
      "type": "array",
      "items": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {}
      }
    },
    "durationMs": {
      "type": "number",
      "minimum": 0
    },
    "affectedRows": {
      "nullable": true,
      "type": [
        "number",
        "string"
      ]
    },
    "lastInsertId": {
      "type": "string",
      "nullable": true
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "nullable": true
    }
  },
  "required": [
    "columns",
    "durationMs",
    "rows"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` exec `

Execute one SQL statement with bound parameters; requires a writable service

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "statement": {
      "type": "string",
      "pattern": "\\S"
    },
    "params": {
      "readOnly": true,
      "type": "array",
      "items": {},
      "nullable": true
    }
  },
  "required": [
    "statement"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "columns": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "rows": {
      "type": "array",
      "items": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {}
      }
    },
    "durationMs": {
      "type": "number",
      "minimum": 0
    },
    "affectedRows": {
      "nullable": true,
      "type": [
        "number",
        "string"
      ]
    },
    "lastInsertId": {
      "type": "string",
      "nullable": true
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "nullable": true
    }
  },
  "required": [
    "columns",
    "durationMs",
    "rows"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` listObject `

List database objects under an optional parent with search and bounded pagination

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "parent": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1,
          "nullable": true
        },
        "schema": {
          "type": "string",
          "nullable": true
        },
        "catalog": {
          "type": "string",
          "nullable": true
        },
        "type": {
          "type": "string",
          "nullable": true
        }
      },
      "additionalProperties": false,
      "nullable": true
    },
    "search": {
      "type": "string",
      "nullable": true
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "catalog": {
        "type": "string",
        "nullable": true
      },
      "schema": {
        "type": "string",
        "nullable": true
      },
      "name": {
        "type": "string"
      },
      "type": {
        "type": "string"
      },
      "comment": {
        "type": "string",
        "nullable": true
      },
      "attributes": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {},
        "nullable": true
      }
    },
    "required": [
      "name",
      "type"
    ],
    "additionalProperties": false
  }
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` describeObject `

Describe a named database object, its children and attributes

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "object": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1
        },
        "schema": {
          "type": "string",
          "nullable": true
        },
        "catalog": {
          "type": "string",
          "nullable": true
        },
        "type": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "name"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "object"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "object": {
      "type": "object",
      "properties": {
        "catalog": {
          "type": "string",
          "nullable": true
        },
        "schema": {
          "type": "string",
          "nullable": true
        },
        "name": {
          "type": "string"
        },
        "type": {
          "type": "string"
        },
        "comment": {
          "type": "string",
          "nullable": true
        },
        "attributes": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {},
          "nullable": true
        }
      },
      "required": [
        "name",
        "type"
      ],
      "additionalProperties": false
    },
    "children": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "catalog": {
            "type": "string",
            "nullable": true
          },
          "schema": {
            "type": "string",
            "nullable": true
          },
          "name": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "comment": {
            "type": "string",
            "nullable": true
          },
          "attributes": {
            "type": "object",
            "propertyNames": {
              "type": "string"
            },
            "additionalProperties": {},
            "nullable": true
          }
        },
        "required": [
          "name",
          "type"
        ],
        "additionalProperties": false
      },
      "nullable": true
    },
    "attributes": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "durationMs": {
      "type": "number",
      "minimum": 0,
      "nullable": true
    }
  },
  "required": [
    "object"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

### ` redis ` — Redis

Read keys, hashes and streams from Redis or Valkey without modifying data.

Aliases: ` valkey `

Capabilities: ` redis `

Examples:

Check the Redis connection.

```sh
woctl redis ping
```

Read a string key.

```sh
woctl redis get example:key
```

Provider options schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "product": {
      "type": "string",
      "enum": [
        "unspecified",
        "redis",
        "valkey"
      ]
    },
    "host": {
      "type": "string",
      "minLength": 1,
      "maxLength": 255
    },
    "port": {
      "type": "integer",
      "minimum": 1,
      "maximum": 65535
    },
    "databaseIndex": {
      "type": "integer",
      "minimum": 0,
      "maximum": 4294967295
    },
    "username": {
      "type": "string"
    },
    "password": {
      "type": "string"
    },
    "keyPrefix": {
      "type": "string"
    },
    "tls": {
      "type": "object",
      "properties": {
        "mode": {
          "default": "verify-full",
          "type": "string",
          "enum": [
            "disabled",
            "verify-ca",
            "verify-full"
          ]
        },
        "serverName": {
          "type": "string",
          "minLength": 1,
          "maxLength": 253
        },
        "ca": {
          "type": "string"
        },
        "cert": {
          "type": "string"
        },
        "key": {
          "type": "string"
        },
        "passphrase": {
          "type": "string"
        },
        "insecureSkipVerify": {
          "type": "boolean",
          "const": false
        }
      },
      "additionalProperties": false
    },
    "connectTimeoutMs": {
      "type": "integer",
      "minimum": 0,
      "maximum": 2147483647
    },
    "requestTimeoutMs": {
      "type": "integer",
      "minimum": 0,
      "maximum": 2147483647
    },
    "maxRetries": {
      "type": "integer",
      "minimum": 0,
      "maximum": 4294967295
    },
    "maxResponseBytes": {
      "type": "integer",
      "minimum": 1,
      "maximum": 67108864
    }
  },
  "additionalProperties": false
}
```

#### Static tools

##### ` ping `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "durationMs": {
      "type": "number",
      "minimum": 0
    },
    "success": {
      "type": "boolean"
    },
    "version": {
      "type": "string",
      "nullable": true
    },
    "errorCode": {
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "durationMs",
    "success"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` get `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "key": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "key"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "durationMs": {
      "type": "number",
      "minimum": 0
    },
    "value": {
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "durationMs"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getType `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "key": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "key"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "durationMs": {
      "type": "number",
      "minimum": 0
    },
    "type": {
      "type": "string"
    }
  },
  "required": [
    "durationMs",
    "type"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getTtl `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "key": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "key"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "durationMs": {
      "type": "number",
      "minimum": 0
    },
    "ttlSeconds": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991
    }
  },
  "required": [
    "durationMs",
    "ttlSeconds"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` scan `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "cursor": {
      "type": "string",
      "pattern": "^\\d+$",
      "nullable": true
    },
    "match": {
      "type": "string",
      "nullable": true
    },
    "count": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10000,
      "nullable": true
    },
    "type": {
      "type": "string",
      "enum": [
        "string",
        "list",
        "set",
        "zset",
        "hash",
        "stream"
      ],
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "durationMs": {
      "type": "number",
      "minimum": 0
    },
    "cursor": {
      "type": "string"
    },
    "keys": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "cursor",
    "durationMs",
    "keys"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getHash `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "key": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "key"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "durationMs": {
      "type": "number",
      "minimum": 0
    },
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "field": {
            "type": "string"
          },
          "value": {
            "type": "string"
          }
        },
        "required": [
          "field",
          "value"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "data",
    "durationMs"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` rangeStream `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "key": {
      "type": "string",
      "minLength": 1
    },
    "start": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "end": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "count": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10000,
      "nullable": true
    }
  },
  "required": [
    "key"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "durationMs": {
      "type": "number",
      "minimum": 0
    },
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "fields": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "field": {
                  "type": "string"
                },
                "value": {
                  "type": "string"
                }
              },
              "required": [
                "field",
                "value"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "fields",
          "id"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "data",
    "durationMs"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

### ` openobserve `

Aliases: ` oo `

Capabilities: ` openobserve `

Provider options schema:

```json
{
  "type": "object",
  "properties": {
    "organization": {
      "type": "string"
    },
    "accessToken": {
      "type": "string"
    },
    "accessTokenEnv": {
      "type": "string"
    },
    "username": {
      "type": "string"
    },
    "usernameEnv": {
      "type": "string"
    },
    "password": {
      "type": "string"
    },
    "passwordEnv": {
      "type": "string"
    },
    "timeoutMs": {
      "type": "integer",
      "minimum": 1
    },
    "maxResponseBytes": {
      "type": "integer",
      "minimum": 1
    }
  },
  "additionalProperties": false
}
```

#### Static tools

##### ` health `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "const": "ok"
    }
  },
  "required": [
    "status"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` status `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "organization": {
      "type": "string",
      "nullable": true
    },
    "streamType": {
      "type": "string",
      "enum": [
        "logs",
        "metrics",
        "traces"
      ],
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "reachable": {
      "type": "boolean"
    },
    "readOnly": {
      "type": "boolean",
      "const": true
    },
    "streamType": {
      "type": "string",
      "enum": [
        "logs",
        "metrics",
        "traces"
      ]
    },
    "authConfigured": {
      "type": "boolean"
    },
    "endpointCount": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "latencyMs": {
      "type": "number",
      "minimum": 0
    },
    "checkedAt": {
      "type": "string"
    },
    "error": {
      "type": "object",
      "properties": {
        "code": {
          "type": "string"
        },
        "message": {
          "type": "string"
        }
      },
      "required": [
        "code",
        "message"
      ],
      "additionalProperties": {},
      "nullable": true
    }
  },
  "required": [
    "authConfigured",
    "checkedAt",
    "endpointCount",
    "latencyMs",
    "reachable",
    "readOnly",
    "streamType"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listStreams `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "organization": {
      "type": "string",
      "nullable": true
    },
    "streamType": {
      "type": "string",
      "enum": [
        "logs",
        "metrics",
        "traces"
      ],
      "nullable": true
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "maximum": 2147483647,
      "nullable": true
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 1000,
      "nullable": true
    },
    "fetchSchema": {
      "type": "boolean",
      "nullable": true
    },
    "keyword": {
      "type": "string",
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "streams": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "organization": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "streamType": {
            "type": "string"
          },
          "documentCount": {
            "type": "number",
            "minimum": 0,
            "nullable": true
          },
          "storageBytes": {
            "type": "number",
            "minimum": 0,
            "nullable": true
          },
          "schemaFields": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": [
          "name",
          "organization",
          "schemaFields",
          "streamType"
        ],
        "additionalProperties": {}
      }
    },
    "total": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    }
  },
  "required": [
    "streams",
    "total"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getStreamSchema `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "organization": {
      "type": "string",
      "nullable": true
    },
    "stream": {
      "type": "string",
      "minLength": 1
    },
    "streamType": {
      "type": "string",
      "enum": [
        "logs",
        "metrics",
        "traces"
      ],
      "nullable": true
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "maximum": 2147483647,
      "nullable": true
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 1000,
      "nullable": true
    },
    "keyword": {
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "stream"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "organization": {
      "type": "string"
    },
    "stream": {
      "type": "string"
    },
    "streamType": {
      "type": "string"
    },
    "fields": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "type": {
            "type": "string"
          }
        },
        "required": [
          "name",
          "type"
        ],
        "additionalProperties": {}
      }
    },
    "totalFields": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    }
  },
  "required": [
    "fields",
    "organization",
    "stream",
    "streamType",
    "totalFields"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` search `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "organization": {
      "type": "string",
      "nullable": true
    },
    "streamType": {
      "type": "string",
      "enum": [
        "logs",
        "metrics",
        "traces"
      ],
      "nullable": true
    },
    "sql": {
      "type": "string",
      "minLength": 1,
      "maxLength": 65536
    },
    "startTimeMicros": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "endTimeMicros": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "from": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "size": {
      "type": "integer",
      "minimum": 1,
      "maximum": 1000,
      "nullable": true
    },
    "timeoutSeconds": {
      "type": "integer",
      "minimum": 1,
      "maximum": 60,
      "nullable": true
    }
  },
  "required": [
    "endTimeMicros",
    "sql",
    "startTimeMicros"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "streamType": {
      "type": "string",
      "enum": [
        "logs",
        "metrics",
        "traces"
      ]
    },
    "total": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "from": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "size": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "tookMs": {
      "type": "number",
      "minimum": 0,
      "nullable": true
    },
    "scanBytes": {
      "type": "number",
      "minimum": 0,
      "nullable": true
    },
    "isPartial": {
      "type": "boolean"
    },
    "functionErrors": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "traceId": {
      "type": "string",
      "nullable": true
    },
    "hits": {
      "type": "array",
      "items": {}
    }
  },
  "required": [
    "from",
    "functionErrors",
    "hits",
    "isPartial",
    "size",
    "streamType",
    "total"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listTraces `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "organization": {
      "type": "string",
      "nullable": true
    },
    "stream": {
      "type": "string",
      "minLength": 1
    },
    "startTimeMicros": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "endTimeMicros": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "from": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "size": {
      "type": "integer",
      "minimum": 1,
      "maximum": 1000,
      "nullable": true
    },
    "filter": {
      "type": "string",
      "nullable": true
    },
    "timeoutSeconds": {
      "type": "integer",
      "minimum": 1,
      "maximum": 60,
      "nullable": true
    },
    "sortBy": {
      "type": "string",
      "enum": [
        "start_time",
        "duration"
      ],
      "nullable": true
    },
    "sortOrder": {
      "type": "string",
      "enum": [
        "asc",
        "desc"
      ],
      "nullable": true
    }
  },
  "required": [
    "endTimeMicros",
    "startTimeMicros",
    "stream"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "streamType": {
      "type": "string",
      "const": "traces"
    },
    "traces": {
      "type": "array",
      "items": {}
    },
    "total": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "from": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "size": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "tookMs": {
      "type": "number",
      "minimum": 0,
      "nullable": true
    },
    "isPartial": {
      "type": "boolean"
    },
    "functionErrors": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "traceId": {
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "from",
    "functionErrors",
    "isPartial",
    "size",
    "streamType",
    "total",
    "traces"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getStreamSettings `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "organization": {
      "type": "string",
      "nullable": true
    },
    "stream": {
      "type": "string",
      "minLength": 1
    },
    "streamType": {
      "type": "string",
      "enum": [
        "logs",
        "metrics",
        "traces"
      ],
      "nullable": true
    }
  },
  "required": [
    "stream"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "organization": {
      "type": "string"
    },
    "stream": {
      "type": "string"
    },
    "streamType": {
      "type": "string",
      "enum": [
        "logs",
        "metrics",
        "traces"
      ]
    },
    "settings": {
      "type": "object",
      "properties": {
        "partition_keys": {
          "anyOf": [
            {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "field": {
                    "type": "string"
                  },
                  "types": {
                    "anyOf": [
                      {
                        "type": "string",
                        "const": "value"
                      },
                      {
                        "type": "string",
                        "const": "prefix"
                      },
                      {
                        "type": "object",
                        "properties": {
                          "hash": {
                            "type": "integer",
                            "minimum": -9007199254740991,
                            "maximum": 9007199254740991
                          }
                        },
                        "required": [
                          "hash"
                        ],
                        "additionalProperties": {}
                      }
                    ]
                  },
                  "disabled": {
                    "type": "boolean"
                  }
                },
                "required": [
                  "field"
                ],
                "additionalProperties": {}
              }
            },
            {
              "type": "object",
              "propertyNames": {
                "type": "string"
              },
              "additionalProperties": {}
            }
          ]
        },
        "index_fields": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "full_text_search_keys": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "bloom_filter_fields": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "defined_schema_fields": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "data_retention": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "flatten_level": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "max_query_range": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "store_original_data": {
          "type": "boolean"
        },
        "approx_partition": {
          "type": "boolean"
        },
        "index_original_data": {
          "type": "boolean"
        },
        "index_all_values": {
          "type": "boolean"
        },
        "extended_retention_days": {
          "type": "array",
          "items": {}
        }
      },
      "additionalProperties": {}
    }
  },
  "required": [
    "organization",
    "settings",
    "stream",
    "streamType"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` updateStreamSettings `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "organization": {
      "type": "string",
      "nullable": true
    },
    "stream": {
      "type": "string",
      "minLength": 1
    },
    "streamType": {
      "type": "string",
      "enum": [
        "logs",
        "metrics",
        "traces"
      ],
      "nullable": true
    },
    "settings": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "$ref": "#/$defs/__schema0"
      }
    }
  },
  "required": [
    "settings",
    "stream"
  ],
  "additionalProperties": false,
  "$defs": {
    "__schema0": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        },
        {
          "type": "boolean"
        },
        {
          "type": "null"
        },
        {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          }
        },
        {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "$ref": "#/$defs/__schema0"
          }
        }
      ]
    }
  }
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "code": {
      "type": "integer",
      "minimum": 200,
      "maximum": 299
    },
    "message": {
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "code"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false
}
```

##### ` deleteStream `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "organization": {
      "type": "string",
      "nullable": true
    },
    "stream": {
      "type": "string",
      "minLength": 1
    },
    "streamType": {
      "type": "string",
      "enum": [
        "logs",
        "metrics",
        "traces"
      ],
      "nullable": true
    },
    "deleteAll": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "stream"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "code": {
      "type": "integer",
      "minimum": 200,
      "maximum": 299
    },
    "message": {
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "code"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` ingestJson `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "organization": {
      "type": "string",
      "nullable": true
    },
    "stream": {
      "type": "string",
      "minLength": 1
    },
    "records": {
      "minItems": 1,
      "maxItems": 10000,
      "type": "array",
      "items": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {
          "$ref": "#/$defs/__schema0"
        }
      }
    }
  },
  "required": [
    "records",
    "stream"
  ],
  "additionalProperties": false,
  "$defs": {
    "__schema0": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        },
        {
          "type": "boolean"
        },
        {
          "type": "null"
        },
        {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          }
        },
        {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "$ref": "#/$defs/__schema0"
          }
        }
      ]
    }
  }
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "code": {
      "type": "integer",
      "minimum": 200,
      "maximum": 599
    },
    "status": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "successful": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "failed": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "error": {
            "type": "string",
            "nullable": true
          }
        },
        "required": [
          "failed",
          "name",
          "successful"
        ],
        "additionalProperties": {}
      }
    }
  },
  "required": [
    "code",
    "status"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false
}
```

##### ` ingestMulti `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "organization": {
      "type": "string",
      "nullable": true
    },
    "stream": {
      "type": "string",
      "minLength": 1
    },
    "records": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1
        },
        {
          "minItems": 1,
          "maxItems": 10000,
          "type": "array",
          "items": {
            "type": "object",
            "propertyNames": {
              "type": "string"
            },
            "additionalProperties": {
              "$ref": "#/$defs/__schema0"
            }
          }
        }
      ]
    }
  },
  "required": [
    "records",
    "stream"
  ],
  "additionalProperties": false,
  "$defs": {
    "__schema0": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        },
        {
          "type": "boolean"
        },
        {
          "type": "null"
        },
        {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          }
        },
        {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "$ref": "#/$defs/__schema0"
          }
        }
      ]
    }
  }
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "code": {
      "type": "integer",
      "minimum": 200,
      "maximum": 599
    },
    "status": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "successful": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "failed": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "error": {
            "type": "string",
            "nullable": true
          }
        },
        "required": [
          "failed",
          "name",
          "successful"
        ],
        "additionalProperties": {}
      }
    }
  },
  "required": [
    "code",
    "status"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false
}
```

##### ` getValues `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "organization": {
      "type": "string",
      "nullable": true
    },
    "stream": {
      "type": "string",
      "minLength": 1
    },
    "streamType": {
      "type": "string",
      "enum": [
        "logs",
        "metrics",
        "traces"
      ],
      "nullable": true
    },
    "fields": {
      "minItems": 1,
      "maxItems": 100,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      }
    },
    "startTimeMicros": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "endTimeMicros": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "size": {
      "type": "integer",
      "minimum": 1,
      "maximum": 1000,
      "nullable": true
    },
    "keyword": {
      "type": "string",
      "nullable": true
    },
    "noCount": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "endTimeMicros",
    "fields",
    "startTimeMicros",
    "stream"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "hits": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "field": {
            "type": "string"
          },
          "values": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "zo_sql_key": {},
                "zo_sql_num": {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 9007199254740991,
                  "nullable": true
                }
              },
              "required": [
                "zo_sql_key"
              ],
              "additionalProperties": {}
            }
          }
        },
        "required": [
          "field",
          "values"
        ],
        "additionalProperties": {}
      }
    },
    "total": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "tookMs": {
      "type": "number",
      "minimum": 0,
      "nullable": true
    },
    "scanBytes": {
      "type": "number",
      "minimum": 0,
      "nullable": true
    }
  },
  "required": [
    "hits",
    "total"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` searchAround `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "organization": {
      "type": "string",
      "nullable": true
    },
    "stream": {
      "type": "string",
      "minLength": 1
    },
    "streamType": {
      "type": "string",
      "enum": [
        "logs",
        "metrics",
        "traces"
      ],
      "nullable": true
    },
    "key": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "size": {
      "type": "integer",
      "minimum": 1,
      "maximum": 1000,
      "nullable": true
    }
  },
  "required": [
    "key",
    "stream"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "streamType": {
      "type": "string",
      "enum": [
        "logs",
        "metrics",
        "traces"
      ]
    },
    "total": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "from": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "size": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "tookMs": {
      "type": "number",
      "minimum": 0,
      "nullable": true
    },
    "scanBytes": {
      "type": "number",
      "minimum": 0,
      "nullable": true
    },
    "isPartial": {
      "type": "boolean"
    },
    "functionErrors": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "traceId": {
      "type": "string",
      "nullable": true
    },
    "hits": {
      "type": "array",
      "items": {}
    }
  },
  "required": [
    "from",
    "functionErrors",
    "hits",
    "isPartial",
    "size",
    "streamType",
    "total"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

### ` apollo `

Capabilities: ` apollo `

Provider options schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "default": "default",
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "default": "application",
      "type": "string",
      "minLength": 1
    },
    "env": {
      "default": "DEV",
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1
    },
    "config": {
      "type": "object",
      "properties": {
        "role": {
          "default": "config",
          "type": "string",
          "const": "config"
        },
        "baseUrl": {
          "type": "string",
          "format": "uri"
        },
        "headers": {
          "default": {},
          "x-sensitive": true,
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": "string",
            "x-sensitive": true
          }
        },
        "requestTimeoutMs": {
          "type": "integer",
          "minimum": 1,
          "maximum": 300000
        },
        "auth": {
          "type": "object",
          "properties": {
            "type": {
              "type": "string",
              "const": "app-secret"
            },
            "appSecret": {
              "type": "string",
              "minLength": 1,
              "x-sensitive": true
            }
          },
          "required": [
            "type",
            "appSecret"
          ]
        }
      },
      "required": [
        "baseUrl"
      ]
    },
    "admin": {
      "type": "object",
      "properties": {
        "role": {
          "default": "admin",
          "type": "string",
          "const": "admin"
        },
        "baseUrl": {
          "type": "string",
          "format": "uri"
        },
        "headers": {
          "default": {},
          "x-sensitive": true,
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": "string",
            "x-sensitive": true
          }
        },
        "requestTimeoutMs": {
          "type": "integer",
          "minimum": 1,
          "maximum": 300000
        },
        "auth": {
          "oneOf": [
            {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "const": "token"
                },
                "token": {
                  "type": "string",
                  "minLength": 1,
                  "x-sensitive": true
                }
              },
              "required": [
                "type",
                "token"
              ]
            },
            {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "const": "basic"
                },
                "username": {
                  "type": "string",
                  "minLength": 1,
                  "x-sensitive": true
                },
                "password": {
                  "type": "string",
                  "minLength": 1,
                  "x-sensitive": true
                }
              },
              "required": [
                "type",
                "username",
                "password"
              ]
            }
          ]
        }
      },
      "required": [
        "baseUrl"
      ]
    },
    "portal": {
      "type": "object",
      "properties": {
        "role": {
          "default": "portal",
          "type": "string",
          "const": "portal"
        },
        "baseUrl": {
          "type": "string",
          "format": "uri"
        },
        "headers": {
          "default": {},
          "x-sensitive": true,
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": "string",
            "x-sensitive": true
          }
        },
        "requestTimeoutMs": {
          "type": "integer",
          "minimum": 1,
          "maximum": 300000
        },
        "auth": {
          "oneOf": [
            {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "const": "token"
                },
                "token": {
                  "type": "string",
                  "minLength": 1,
                  "x-sensitive": true
                }
              },
              "required": [
                "type",
                "token"
              ]
            },
            {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "const": "basic"
                },
                "username": {
                  "type": "string",
                  "minLength": 1,
                  "x-sensitive": true
                },
                "password": {
                  "type": "string",
                  "minLength": 1,
                  "x-sensitive": true
                }
              },
              "required": [
                "type",
                "username",
                "password"
              ]
            }
          ]
        }
      },
      "required": [
        "baseUrl"
      ]
    }
  },
  "required": [
    "config",
    "admin",
    "portal"
  ],
  "additionalProperties": false
}
```

#### Static tools

##### ` readConfig `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "namespace": {
      "type": "string",
      "minLength": 1
    },
    "format": {
      "type": "string",
      "enum": [
        "auto",
        "config",
        "json",
        "properties",
        "raw",
        "content",
        "data"
      ]
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "anyOf": [
    {
      "type": "string"
    },
    {
      "type": "number"
    },
    {
      "type": "boolean"
    },
    {
      "type": "null"
    },
    {
      "type": "array",
      "items": {
        "$ref": "#"
      }
    },
    {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "$ref": "#"
      }
    }
  ],
  "$ref": "#/$defs/__schema0",
  "$defs": {
    "__schema0": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        },
        {
          "type": "boolean"
        },
        {
          "type": "null"
        },
        {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          }
        },
        {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "$ref": "#/$defs/__schema0"
          }
        }
      ]
    }
  }
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` request `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "role": {
      "default": "admin",
      "type": "string",
      "const": "admin"
    },
    "path": {
      "type": "string",
      "pattern": "^\\/"
    },
    "method": {
      "type": "string",
      "enum": [
        "GET",
        "HEAD",
        "OPTIONS",
        "POST",
        "PUT",
        "PATCH",
        "DELETE"
      ]
    },
    "query": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "$ref": "#/$defs/__schema0"
      }
    },
    "body": {
      "$ref": "#/$defs/__schema1"
    },
    "headers": {
      "x-sensitive": true,
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "type": "string"
      }
    }
  },
  "required": [
    "path"
  ],
  "additionalProperties": false,
  "$defs": {
    "__schema0": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        },
        {
          "type": "boolean"
        },
        {
          "type": "null"
        },
        {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          }
        },
        {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "$ref": "#/$defs/__schema0"
          }
        }
      ]
    },
    "__schema1": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        },
        {
          "type": "boolean"
        },
        {
          "type": "null"
        },
        {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema1"
          }
        },
        {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "$ref": "#/$defs/__schema1"
          }
        }
      ]
    }
  }
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` getStatus `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listPortalApp `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listPortalOrganization `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listPortalEnv `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getPortalNavTree `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listPortalNamespace `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getPortalNamespace `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listPortalItem `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    },
    "orderBy": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listPortalRelease `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {
    "page": 0,
    "size": 5
  },
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    },
    "page": {
      "default": 0,
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "size": {
      "default": 5,
      "type": "integer",
      "minimum": 1,
      "maximum": 1000
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getPortalConfig `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listRelease `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {
    "page": 0,
    "size": 20,
    "active": false
  },
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    },
    "page": {
      "default": 0,
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "size": {
      "default": 20,
      "type": "integer",
      "minimum": 1,
      "maximum": 1000
    },
    "active": {
      "default": false,
      "type": "boolean"
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getRelease `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "env": {
      "type": "string",
      "minLength": 1
    },
    "releaseId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "releaseId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` diffRelease `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "env": {
      "type": "string",
      "minLength": 1
    },
    "baseReleaseId": {
      "type": "string",
      "minLength": 1
    },
    "toCompareReleaseId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "baseReleaseId",
    "toCompareReleaseId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listApp `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appIds": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      }
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getApp `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listSelfApp `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {
    "page": 0,
    "size": 50
  },
  "type": "object",
  "properties": {
    "page": {
      "default": 0,
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "size": {
      "default": 50,
      "type": "integer",
      "minimum": 1,
      "maximum": 1000
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` createApp `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1
    },
    "name": {
      "type": "string"
    },
    "orgId": {
      "type": "string"
    },
    "orgName": {
      "type": "string"
    },
    "ownerName": {
      "type": "string"
    },
    "ownerEmail": {
      "type": "string"
    },
    "body": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "$ref": "#/$defs/__schema0"
      }
    },
    "assignRoleToSelf": {
      "default": false,
      "type": "boolean"
    }
  },
  "required": [
    "appId"
  ],
  "additionalProperties": false,
  "$defs": {
    "__schema0": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        },
        {
          "type": "boolean"
        },
        {
          "type": "null"
        },
        {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          }
        },
        {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "$ref": "#/$defs/__schema0"
          }
        }
      ]
    }
  }
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` createAppEnv `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1
    },
    "name": {
      "type": "string"
    },
    "orgId": {
      "type": "string"
    },
    "orgName": {
      "type": "string"
    },
    "ownerName": {
      "type": "string"
    },
    "ownerEmail": {
      "type": "string"
    },
    "body": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "$ref": "#/$defs/__schema0"
      }
    }
  },
  "required": [
    "appId"
  ],
  "additionalProperties": false,
  "$defs": {
    "__schema0": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        },
        {
          "type": "boolean"
        },
        {
          "type": "null"
        },
        {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          }
        },
        {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "$ref": "#/$defs/__schema0"
          }
        }
      ]
    }
  }
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` updateApp `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1
    },
    "name": {
      "type": "string"
    },
    "orgId": {
      "type": "string"
    },
    "orgName": {
      "type": "string"
    },
    "ownerName": {
      "type": "string"
    },
    "ownerEmail": {
      "type": "string"
    },
    "body": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "$ref": "#/$defs/__schema0"
      }
    }
  },
  "required": [
    "appId"
  ],
  "additionalProperties": false,
  "$defs": {
    "__schema0": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        },
        {
          "type": "boolean"
        },
        {
          "type": "null"
        },
        {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          }
        },
        {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "$ref": "#/$defs/__schema0"
          }
        }
      ]
    }
  }
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` deleteApp `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "appId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` listMissingAppEnv `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getEnvCluster `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getCluster `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` createCluster `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "cluster"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` deleteCluster `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "cluster"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "appId": {
      "type": "string"
    },
    "env": {
      "type": "string"
    },
    "cluster": {
      "type": "string"
    }
  },
  "required": [
    "appId",
    "cluster",
    "env",
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` listNamespace `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {
    "fillItemDetail": true
  },
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "fillItemDetail": {
      "default": true,
      "type": "boolean"
    },
    "extendInfo": {
      "type": "boolean"
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getNamespace `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {
    "fillItemDetail": true
  },
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    },
    "fillItemDetail": {
      "default": true,
      "type": "boolean"
    },
    "extendInfo": {
      "type": "boolean"
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getNamespaceLock `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` createNamespace `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    },
    "format": {
      "default": "properties",
      "type": "string",
      "minLength": 1
    },
    "isPublic": {
      "default": false,
      "type": "boolean"
    },
    "comment": {
      "type": "string"
    }
  },
  "required": [
    "namespace"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` deleteNamespace `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "appId": {
      "type": "string"
    },
    "env": {
      "type": "string"
    },
    "cluster": {
      "type": "string"
    },
    "namespace": {
      "type": "string"
    }
  },
  "required": [
    "appId",
    "cluster",
    "env",
    "namespace",
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` listNamespaceUsage `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listMissingNamespace `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` createMissingNamespace `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` listItem `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {
    "page": 0,
    "size": 50
  },
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    },
    "page": {
      "default": 0,
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "size": {
      "default": 50,
      "type": "integer",
      "minimum": 1,
      "maximum": 1000
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getItem `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    },
    "key": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "key"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` upsertItem `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1
    },
    "key": {
      "type": "string",
      "minLength": 1
    },
    "value": {
      "type": "string"
    },
    "comment": {
      "type": "string"
    },
    "createIfNotExists": {
      "default": true,
      "type": "boolean"
    },
    "release": {
      "default": false,
      "type": "boolean"
    },
    "releaseTitle": {
      "type": "string"
    },
    "releaseComment": {
      "type": "string"
    }
  },
  "required": [
    "key",
    "value"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` deleteItem `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1
    },
    "key": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "key"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` getLatestRelease `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` publishRelease `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1
    },
    "title": {
      "type": "string"
    },
    "comment": {
      "type": "string"
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Apollo Portal/Admin response: shape depends on endpoint and server version."
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` rollbackRelease `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "env": {
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1
    },
    "releaseId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "releaseId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "env": {
      "type": "string"
    },
    "releaseId": {
      "type": "string"
    }
  },
  "required": [
    "env",
    "ok",
    "releaseId"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` patchNamespaceItem `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1
    },
    "set": {
      "default": [],
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "key": {
            "type": "string",
            "minLength": 1
          },
          "value": {
            "type": "string"
          }
        },
        "required": [
          "key",
          "value"
        ]
      }
    },
    "delete": {
      "default": [],
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      }
    },
    "comment": {
      "type": "string"
    },
    "publish": {
      "default": false,
      "type": "boolean"
    },
    "releaseTitle": {
      "type": "string"
    },
    "releaseComment": {
      "type": "string"
    },
    "dryRun": {
      "default": false,
      "type": "boolean"
    },
    "createIfNotExists": {
      "default": true,
      "type": "boolean"
    },
    "allowUnpublishedDraft": {
      "default": false,
      "type": "boolean"
    }
  },
  "required": [],
  "additionalProperties": false,
  "anyOf": [
    {
      "required": [
        "set"
      ],
      "properties": {
        "set": {
          "minItems": 1
        }
      }
    },
    {
      "required": [
        "delete"
      ],
      "properties": {
        "delete": {
          "minItems": 1
        }
      }
    }
  ]
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "appId": {
      "type": "string"
    },
    "env": {
      "type": "string"
    },
    "cluster": {
      "type": "string"
    },
    "namespace": {
      "type": "string"
    },
    "dryRun": {
      "type": "boolean"
    },
    "changes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "key": {
            "type": "string"
          },
          "op": {
            "type": "string",
            "enum": [
              "create",
              "update",
              "delete"
            ]
          },
          "oldValue": {},
          "newValue": {},
          "modifiedBy": {
            "type": "string"
          }
        },
        "required": [
          "key",
          "op"
        ],
        "additionalProperties": false
      }
    },
    "baseRelease": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {},
            "name": {},
            "releasedBy": {},
            "releasedTime": {}
          },
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "pending": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "key": {
            "type": "string"
          },
          "op": {
            "type": "string",
            "enum": [
              "create",
              "update",
              "delete"
            ]
          },
          "oldValue": {},
          "newValue": {},
          "modifiedBy": {
            "type": "string"
          }
        },
        "required": [
          "key",
          "op"
        ],
        "additionalProperties": false
      }
    },
    "publishChanges": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "key": {
            "type": "string"
          },
          "op": {
            "type": "string",
            "enum": [
              "create",
              "update",
              "delete"
            ]
          },
          "oldValue": {},
          "newValue": {},
          "modifiedBy": {
            "type": "string"
          }
        },
        "required": [
          "key",
          "op"
        ],
        "additionalProperties": false
      }
    },
    "unchanged": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "applied": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "published": {
      "type": "boolean"
    },
    "release": {}
  },
  "required": [
    "appId",
    "changes",
    "cluster",
    "dryRun",
    "env",
    "namespace",
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true,
  "supportsDryRun": true
}
```

##### ` writeNamespaceText `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    },
    "configText": {
      "type": "string"
    },
    "format": {
      "type": "string",
      "enum": [
        "json",
        "xml",
        "yaml",
        "yml",
        "properties",
        "txt"
      ]
    },
    "publish": {
      "default": false,
      "type": "boolean"
    },
    "releaseTitle": {
      "type": "string"
    },
    "releaseComment": {
      "type": "string"
    },
    "dryRun": {
      "default": false,
      "type": "boolean"
    },
    "validate": {
      "default": true,
      "type": "boolean"
    }
  },
  "required": [
    "configText"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "anyOf": [
    {
      "type": "object",
      "properties": {
        "ok": {
          "type": "boolean",
          "const": true
        },
        "appId": {
          "type": "string"
        },
        "env": {
          "type": "string"
        },
        "cluster": {
          "type": "string"
        },
        "namespace": {
          "type": "string"
        },
        "dryRun": {
          "type": "boolean",
          "const": true
        },
        "namespaceId": {
          "type": "number"
        },
        "format": {
          "type": "string",
          "enum": [
            "json",
            "xml",
            "yaml",
            "yml",
            "properties",
            "txt"
          ]
        },
        "bytes": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "publish": {
          "type": "boolean"
        },
        "validation": {
          "type": "object",
          "properties": {
            "validated": {
              "type": "boolean"
            },
            "validator": {
              "type": "string"
            },
            "skipped": {
              "type": "boolean"
            }
          },
          "required": [
            "validated"
          ],
          "additionalProperties": false
        },
        "permission": {
          "type": "object",
          "properties": {
            "user": {
              "type": "string"
            },
            "modify": {
              "type": "boolean"
            },
            "release": {
              "type": "boolean"
            },
            "assignRole": {
              "type": "boolean"
            }
          },
          "additionalProperties": false
        }
      },
      "required": [
        "appId",
        "bytes",
        "cluster",
        "dryRun",
        "env",
        "format",
        "namespace",
        "namespaceId",
        "ok",
        "permission",
        "publish",
        "validation"
      ],
      "additionalProperties": false
    },
    {
      "type": "object",
      "properties": {
        "ok": {
          "type": "boolean",
          "const": true
        },
        "appId": {
          "type": "string"
        },
        "env": {
          "type": "string"
        },
        "cluster": {
          "type": "string"
        },
        "namespace": {
          "type": "string"
        },
        "namespaceId": {
          "type": "number"
        },
        "format": {
          "type": "string",
          "enum": [
            "json",
            "xml",
            "yaml",
            "yml",
            "properties",
            "txt"
          ]
        },
        "published": {
          "type": "boolean"
        },
        "release": {}
      },
      "required": [
        "appId",
        "cluster",
        "env",
        "format",
        "namespace",
        "namespaceId",
        "ok",
        "published"
      ],
      "additionalProperties": false
    }
  ]
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true,
  "supportsDryRun": true
}
```

##### ` patchNamespaceDocument `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    },
    "set": {
      "default": [],
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "minLength": 1
          },
          "value": {
            "$ref": "#/$defs/__schema0"
          }
        },
        "required": [
          "path",
          "value"
        ]
      }
    },
    "merge": {
      "default": [],
      "type": "array",
      "items": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {
          "$ref": "#/$defs/__schema0"
        }
      }
    },
    "delete": {
      "default": [],
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      }
    },
    "publish": {
      "default": false,
      "type": "boolean"
    },
    "releaseTitle": {
      "type": "string"
    },
    "releaseComment": {
      "type": "string"
    },
    "dryRun": {
      "default": false,
      "type": "boolean"
    },
    "allowUnpublishedDraft": {
      "default": false,
      "type": "boolean"
    }
  },
  "required": [],
  "additionalProperties": false,
  "anyOf": [
    {
      "required": [
        "set"
      ],
      "properties": {
        "set": {
          "minItems": 1
        }
      }
    },
    {
      "required": [
        "merge"
      ],
      "properties": {
        "merge": {
          "minItems": 1
        }
      }
    },
    {
      "required": [
        "delete"
      ],
      "properties": {
        "delete": {
          "minItems": 1
        }
      }
    }
  ],
  "$defs": {
    "__schema0": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        },
        {
          "type": "boolean"
        },
        {
          "type": "null"
        },
        {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          }
        },
        {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "$ref": "#/$defs/__schema0"
          }
        }
      ]
    }
  }
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "appId": {
      "type": "string"
    },
    "env": {
      "type": "string"
    },
    "cluster": {
      "type": "string"
    },
    "namespace": {
      "type": "string"
    },
    "dryRun": {
      "type": "boolean"
    },
    "namespaceId": {
      "type": "number"
    },
    "format": {
      "type": "string",
      "enum": [
        "json",
        "xml",
        "yaml",
        "yml",
        "properties",
        "txt"
      ]
    },
    "applied": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "changes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "key": {
            "type": "string"
          },
          "op": {
            "type": "string",
            "enum": [
              "create",
              "update",
              "delete"
            ]
          },
          "oldValue": {},
          "newValue": {},
          "modifiedBy": {
            "type": "string"
          }
        },
        "required": [
          "key",
          "op"
        ],
        "additionalProperties": false
      }
    },
    "reformatted": {
      "type": "boolean"
    },
    "baseRelease": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {},
            "name": {},
            "releasedBy": {},
            "releasedTime": {}
          },
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "pending": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "key": {
            "type": "string"
          },
          "op": {
            "type": "string",
            "enum": [
              "create",
              "update",
              "delete"
            ]
          },
          "oldValue": {},
          "newValue": {},
          "modifiedBy": {
            "type": "string"
          }
        },
        "required": [
          "key",
          "op"
        ],
        "additionalProperties": false
      }
    },
    "publishChanges": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "key": {
            "type": "string"
          },
          "op": {
            "type": "string",
            "enum": [
              "create",
              "update",
              "delete"
            ]
          },
          "oldValue": {},
          "newValue": {},
          "modifiedBy": {
            "type": "string"
          }
        },
        "required": [
          "key",
          "op"
        ],
        "additionalProperties": false
      }
    },
    "unchanged": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "permission": {
      "type": "object",
      "properties": {
        "user": {
          "type": "string"
        },
        "modify": {
          "type": "boolean"
        },
        "release": {
          "type": "boolean"
        },
        "assignRole": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "published": {
      "type": "boolean"
    },
    "release": {}
  },
  "required": [
    "appId",
    "applied",
    "changes",
    "cluster",
    "dryRun",
    "env",
    "format",
    "namespace",
    "namespaceId",
    "ok",
    "reformatted"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true,
  "supportsDryRun": true
}
```

##### ` diffNamespaceRelease `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "appId": {
      "type": "string"
    },
    "env": {
      "type": "string"
    },
    "cluster": {
      "type": "string"
    },
    "namespace": {
      "type": "string"
    },
    "format": {
      "type": "string",
      "enum": [
        "json",
        "xml",
        "yaml",
        "yml",
        "properties",
        "txt"
      ]
    },
    "baseRelease": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {},
            "name": {},
            "releasedBy": {},
            "releasedTime": {}
          },
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "fingerprint": {
      "type": "string"
    },
    "count": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "modifiedBy": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "changes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "key": {
            "type": "string"
          },
          "op": {
            "type": "string",
            "enum": [
              "create",
              "update",
              "delete"
            ]
          },
          "oldValue": {},
          "newValue": {},
          "modifiedBy": {
            "type": "string"
          }
        },
        "required": [
          "key",
          "op"
        ],
        "additionalProperties": false
      }
    },
    "message": {
      "type": "string"
    }
  },
  "required": [
    "appId",
    "baseRelease",
    "changes",
    "cluster",
    "count",
    "env",
    "fingerprint",
    "format",
    "modifiedBy",
    "namespace",
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` publishNamespaceRelease `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {
    "dryRun": false
  },
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1
    },
    "env": {
      "type": "string",
      "minLength": 1
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "namespace": {
      "type": "string",
      "minLength": 1
    },
    "title": {
      "type": "string"
    },
    "comment": {
      "type": "string"
    },
    "dryRun": {
      "default": false,
      "type": "boolean"
    },
    "ifMatch": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "appId": {
      "type": "string"
    },
    "env": {
      "type": "string"
    },
    "cluster": {
      "type": "string"
    },
    "namespace": {
      "type": "string"
    },
    "format": {
      "type": "string",
      "enum": [
        "json",
        "xml",
        "yaml",
        "yml",
        "properties",
        "txt"
      ]
    },
    "baseRelease": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {},
            "name": {},
            "releasedBy": {},
            "releasedTime": {}
          },
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "fingerprint": {
      "type": "string"
    },
    "count": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "modifiedBy": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "changes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "key": {
            "type": "string"
          },
          "op": {
            "type": "string",
            "enum": [
              "create",
              "update",
              "delete"
            ]
          },
          "oldValue": {},
          "newValue": {},
          "modifiedBy": {
            "type": "string"
          }
        },
        "required": [
          "key",
          "op"
        ],
        "additionalProperties": false
      }
    },
    "message": {
      "type": "string"
    },
    "dryRun": {
      "type": "boolean"
    },
    "published": {
      "type": "boolean"
    },
    "release": {},
    "permission": {
      "type": "object",
      "properties": {
        "user": {
          "type": "string"
        },
        "modify": {
          "type": "boolean"
        },
        "release": {
          "type": "boolean"
        },
        "assignRole": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "appId",
    "baseRelease",
    "changes",
    "cluster",
    "count",
    "dryRun",
    "env",
    "fingerprint",
    "format",
    "modifiedBy",
    "namespace",
    "ok",
    "published"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true,
  "supportsDryRun": true
}
```

### ` prometheus ` — Prometheus

Query Prometheus metrics and discover series, labels and metric metadata.

Aliases: ` prom `

Capabilities: ` prometheus `

Examples:

Query the current target health.

```sh
woctl prometheus query up
```

List available label names.

```sh
woctl prometheus labels
```

Provider options schema:

```json
{
  "type": "object",
  "properties": {
    "apiPrefix": {
      "type": "string"
    },
    "accessToken": {
      "type": "string"
    },
    "accessTokenEnv": {
      "type": "string"
    },
    "username": {
      "type": "string"
    },
    "usernameEnv": {
      "type": "string"
    },
    "password": {
      "type": "string"
    },
    "passwordEnv": {
      "type": "string"
    },
    "timeoutMs": {
      "type": "integer",
      "minimum": 1
    },
    "maxResponseBytes": {
      "type": "integer",
      "minimum": 1
    }
  },
  "additionalProperties": false
}
```

#### Static tools

##### ` query `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "minLength": 1
    },
    "time": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 256
        }
      ],
      "nullable": true
    },
    "timeout": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    }
  },
  "required": [
    "query"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "const": "success"
    },
    "data": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "resultType": {
              "type": "string",
              "const": "scalar"
            },
            "result": {
              "type": "array",
              "prefixItems": [
                {
                  "type": "number"
                },
                {
                  "type": "string"
                }
              ],
              "items": false,
              "minItems": 2,
              "maxItems": 2
            }
          },
          "required": [
            "result",
            "resultType"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "resultType": {
              "type": "string",
              "const": "string"
            },
            "result": {
              "type": "array",
              "prefixItems": [
                {
                  "type": "number"
                },
                {
                  "type": "string"
                }
              ],
              "items": false,
              "minItems": 2,
              "maxItems": 2
            }
          },
          "required": [
            "result",
            "resultType"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "resultType": {
              "type": "string",
              "const": "vector"
            },
            "result": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "metric": {
                    "type": "object",
                    "propertyNames": {
                      "type": "string"
                    },
                    "additionalProperties": {
                      "type": "string"
                    }
                  },
                  "value": {
                    "type": "array",
                    "prefixItems": [
                      {
                        "type": "number"
                      },
                      {
                        "type": "string"
                      }
                    ],
                    "items": false,
                    "minItems": 2,
                    "maxItems": 2
                  }
                },
                "required": [
                  "metric",
                  "value"
                ],
                "additionalProperties": false
              }
            }
          },
          "required": [
            "result",
            "resultType"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "resultType": {
              "type": "string",
              "const": "matrix"
            },
            "result": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "metric": {
                    "type": "object",
                    "propertyNames": {
                      "type": "string"
                    },
                    "additionalProperties": {
                      "type": "string"
                    }
                  },
                  "values": {
                    "type": "array",
                    "items": {
                      "type": "array",
                      "prefixItems": [
                        {
                          "type": "number"
                        },
                        {
                          "type": "string"
                        }
                      ],
                      "items": false,
                      "minItems": 2,
                      "maxItems": 2
                    }
                  }
                },
                "required": [
                  "metric",
                  "values"
                ],
                "additionalProperties": false
              }
            }
          },
          "required": [
            "result",
            "resultType"
          ],
          "additionalProperties": false
        }
      ]
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "data",
    "status",
    "warnings"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` queryRange `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "minLength": 1
    },
    "start": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 256
        }
      ]
    },
    "end": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 256
        }
      ]
    },
    "step": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 256
        }
      ]
    },
    "timeout": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    }
  },
  "required": [
    "end",
    "query",
    "start",
    "step"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "const": "success"
    },
    "data": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "resultType": {
              "type": "string",
              "const": "scalar"
            },
            "result": {
              "type": "array",
              "prefixItems": [
                {
                  "type": "number"
                },
                {
                  "type": "string"
                }
              ],
              "items": false,
              "minItems": 2,
              "maxItems": 2
            }
          },
          "required": [
            "result",
            "resultType"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "resultType": {
              "type": "string",
              "const": "string"
            },
            "result": {
              "type": "array",
              "prefixItems": [
                {
                  "type": "number"
                },
                {
                  "type": "string"
                }
              ],
              "items": false,
              "minItems": 2,
              "maxItems": 2
            }
          },
          "required": [
            "result",
            "resultType"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "resultType": {
              "type": "string",
              "const": "vector"
            },
            "result": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "metric": {
                    "type": "object",
                    "propertyNames": {
                      "type": "string"
                    },
                    "additionalProperties": {
                      "type": "string"
                    }
                  },
                  "value": {
                    "type": "array",
                    "prefixItems": [
                      {
                        "type": "number"
                      },
                      {
                        "type": "string"
                      }
                    ],
                    "items": false,
                    "minItems": 2,
                    "maxItems": 2
                  }
                },
                "required": [
                  "metric",
                  "value"
                ],
                "additionalProperties": false
              }
            }
          },
          "required": [
            "result",
            "resultType"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "resultType": {
              "type": "string",
              "const": "matrix"
            },
            "result": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "metric": {
                    "type": "object",
                    "propertyNames": {
                      "type": "string"
                    },
                    "additionalProperties": {
                      "type": "string"
                    }
                  },
                  "values": {
                    "type": "array",
                    "items": {
                      "type": "array",
                      "prefixItems": [
                        {
                          "type": "number"
                        },
                        {
                          "type": "string"
                        }
                      ],
                      "items": false,
                      "minItems": 2,
                      "maxItems": 2
                    }
                  }
                },
                "required": [
                  "metric",
                  "values"
                ],
                "additionalProperties": false
              }
            }
          },
          "required": [
            "result",
            "resultType"
          ],
          "additionalProperties": false
        }
      ]
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "data",
    "status",
    "warnings"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` series `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "match": {
      "minItems": 1,
      "maxItems": 10000,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      }
    },
    "start": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 256
        }
      ],
      "nullable": true
    },
    "end": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 256
        }
      ],
      "nullable": true
    }
  },
  "required": [
    "match"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "const": "success"
    },
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {
          "type": "string"
        }
      }
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "data",
    "status",
    "warnings"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` labels `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "match": {
      "minItems": 1,
      "maxItems": 10000,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "nullable": true
    },
    "start": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 256
        }
      ],
      "nullable": true
    },
    "end": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 256
        }
      ],
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "const": "success"
    },
    "data": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "data",
    "status",
    "warnings"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` labelValues `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "label": {
      "type": "string",
      "minLength": 1
    },
    "match": {
      "minItems": 1,
      "maxItems": 10000,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "nullable": true
    },
    "start": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 256
        }
      ],
      "nullable": true
    },
    "end": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 256
        }
      ],
      "nullable": true
    }
  },
  "required": [
    "label"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "const": "success"
    },
    "data": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "data",
    "status",
    "warnings"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` metadata `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 1000000,
      "nullable": true
    },
    "metric": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "const": "success"
    },
    "data": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "type": {
              "type": "string"
            },
            "help": {
              "type": "string"
            },
            "unit": {
              "type": "string"
            }
          },
          "required": [
            "type",
            "help",
            "unit"
          ],
          "additionalProperties": false
        }
      }
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "data",
    "status",
    "warnings"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

### ` linear ` — Linear

Read and manage Linear teams, issues, projects, users and comments through GraphQL.

Capabilities: ` linear `

Documentation: https://developers.linear.app/docs/graphql/working-with-the-graphql-api

Examples:

Show the authenticated user.

```sh
woctl linear status
```

List issues.

```sh
woctl linear issue list
```

Provider options schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "apiKey": {
      "description": "Personal API key, passed verbatim in Authorization; supports env://NAME.",
      "type": "string",
      "minLength": 1,
      "x-sensitive": true
    },
    "apiKeyEnv": {
      "description": "Environment variable containing the personal API key.",
      "type": "string",
      "pattern": "^[A-Za-z_][A-Za-z0-9_]*$"
    },
    "accessToken": {
      "description": "OAuth access token, passed with the Bearer scheme; supports env://NAME.",
      "type": "string",
      "minLength": 1,
      "x-sensitive": true
    },
    "accessTokenEnv": {
      "description": "Environment variable containing the OAuth access token.",
      "type": "string",
      "pattern": "^[A-Za-z_][A-Za-z0-9_]*$"
    },
    "requestTimeoutMs": {
      "default": 30000,
      "type": "integer",
      "minimum": 1000,
      "maximum": 120000
    },
    "maxResponseBytes": {
      "default": 8388608,
      "type": "integer",
      "minimum": 1024,
      "maximum": 33554432
    },
    "maxRetries": {
      "default": 2,
      "type": "integer",
      "minimum": 0,
      "maximum": 5
    },
    "maxRetryDelayMs": {
      "default": 5000,
      "type": "integer",
      "minimum": 0,
      "maximum": 30000
    }
  },
  "additionalProperties": false
}
```

#### Contract

##### ` getViewer `

Get the authenticated Linear user.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "displayName": {
      "type": "string",
      "nullable": true
    },
    "email": {
      "type": "string",
      "nullable": true
    },
    "active": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "id",
    "name"
  ],
  "additionalProperties": {}
}
```

##### ` listTeam `

List teams with cursor pagination and optional archived teams.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {
    "first": 50,
    "includeArchived": false
  },
  "type": "object",
  "properties": {
    "first": {
      "default": 50,
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "after": {
      "type": "string",
      "minLength": 1
    },
    "includeArchived": {
      "default": false,
      "type": "boolean"
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "key": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string",
            "nullable": true
          }
        },
        "required": [
          "id",
          "key",
          "name"
        ],
        "additionalProperties": {}
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": {}
}
```

##### ` listIssueState `

List workflow states for a team with cursor pagination.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "first": {
      "default": 50,
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "after": {
      "type": "string",
      "minLength": 1
    },
    "teamId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "teamId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "color": {
            "type": "string",
            "nullable": true
          },
          "position": {
            "type": "number",
            "nullable": true
          }
        },
        "required": [
          "id",
          "name",
          "type"
        ],
        "additionalProperties": {}
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": {}
}
```

##### ` listUser `

List users, optionally filtered by name or email.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {
    "first": 50,
    "includeArchived": false
  },
  "type": "object",
  "properties": {
    "first": {
      "default": 50,
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "after": {
      "type": "string",
      "minLength": 1
    },
    "includeArchived": {
      "default": false,
      "type": "boolean"
    },
    "query": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "displayName": {
            "type": "string",
            "nullable": true
          },
          "email": {
            "type": "string",
            "nullable": true
          },
          "active": {
            "type": "boolean",
            "nullable": true
          }
        },
        "required": [
          "id",
          "name"
        ],
        "additionalProperties": {}
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": {}
}
```

##### ` listProject `

List projects, optionally filtered by team and name.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {
    "first": 50,
    "includeArchived": false
  },
  "type": "object",
  "properties": {
    "first": {
      "default": 50,
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "after": {
      "type": "string",
      "minLength": 1
    },
    "includeArchived": {
      "default": false,
      "type": "boolean"
    },
    "teamId": {
      "type": "string",
      "minLength": 1
    },
    "query": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "status": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "type": {
                "type": "string"
              },
              "color": {
                "type": "string",
                "nullable": true
              }
            },
            "required": [
              "id",
              "name",
              "type"
            ],
            "additionalProperties": {},
            "nullable": true
          },
          "priority": {
            "type": "number",
            "nullable": true
          },
          "health": {
            "type": "string",
            "nullable": true
          },
          "startDate": {
            "type": "string",
            "nullable": true
          },
          "targetDate": {
            "type": "string",
            "nullable": true
          },
          "createdAt": {
            "type": "string"
          },
          "updatedAt": {
            "type": "string"
          },
          "url": {
            "type": "string"
          },
          "teams": {
            "type": "object",
            "properties": {
              "nodes": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string"
                    },
                    "key": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string",
                      "nullable": true
                    }
                  },
                  "required": [
                    "id",
                    "key",
                    "name"
                  ],
                  "additionalProperties": {}
                }
              }
            },
            "required": [
              "nodes"
            ],
            "additionalProperties": {}
          }
        },
        "required": [
          "createdAt",
          "id",
          "name",
          "teams",
          "updatedAt",
          "url"
        ],
        "additionalProperties": {}
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": {}
}
```

##### ` listIssue `

List issues with cursor pagination, field filters, text search and nested GraphQL filters.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {
    "first": 50,
    "includeArchived": false
  },
  "type": "object",
  "properties": {
    "first": {
      "default": 50,
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "after": {
      "type": "string",
      "minLength": 1
    },
    "includeArchived": {
      "default": false,
      "type": "boolean"
    },
    "teamId": {
      "type": "string",
      "minLength": 1
    },
    "assigneeId": {
      "type": "string",
      "minLength": 1
    },
    "projectId": {
      "type": "string",
      "minLength": 1
    },
    "stateId": {
      "type": "string",
      "minLength": 1
    },
    "query": {
      "type": "string",
      "minLength": 1
    },
    "updatedAfter": {
      "type": "string",
      "format": "date-time",
      "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"
    },
    "filter": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "$ref": "#/$defs/__schema0"
      }
    }
  },
  "$defs": {
    "__schema0": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        },
        {
          "type": "boolean"
        },
        {
          "type": "null"
        },
        {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          }
        },
        {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "$ref": "#/$defs/__schema0"
          }
        }
      ]
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "identifier": {
            "type": "string"
          },
          "title": {
            "type": "string"
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "url": {
            "type": "string"
          },
          "branchName": {
            "type": "string",
            "nullable": true
          },
          "priority": {
            "type": "integer",
            "minimum": -9007199254740991,
            "maximum": 9007199254740991
          },
          "estimate": {
            "type": "number",
            "nullable": true
          },
          "dueDate": {
            "type": "string",
            "nullable": true
          },
          "createdAt": {
            "type": "string"
          },
          "updatedAt": {
            "type": "string"
          },
          "archivedAt": {
            "type": "string",
            "nullable": true
          },
          "completedAt": {
            "type": "string",
            "nullable": true
          },
          "canceledAt": {
            "type": "string",
            "nullable": true
          },
          "team": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "key": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "description": {
                "type": "string",
                "nullable": true
              }
            },
            "required": [
              "id",
              "key",
              "name"
            ],
            "additionalProperties": {}
          },
          "state": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "type": {
                "type": "string"
              },
              "color": {
                "type": "string",
                "nullable": true
              },
              "position": {
                "type": "number",
                "nullable": true
              }
            },
            "required": [
              "id",
              "name",
              "type"
            ],
            "additionalProperties": {},
            "nullable": true
          },
          "assignee": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "displayName": {
                "type": "string",
                "nullable": true
              },
              "email": {
                "type": "string",
                "nullable": true
              },
              "active": {
                "type": "boolean",
                "nullable": true
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": {},
            "nullable": true
          },
          "creator": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "displayName": {
                "type": "string",
                "nullable": true
              },
              "email": {
                "type": "string",
                "nullable": true
              },
              "active": {
                "type": "boolean",
                "nullable": true
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": {},
            "nullable": true
          },
          "project": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": {},
            "nullable": true
          },
          "labels": {
            "type": "object",
            "properties": {
              "nodes": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    },
                    "color": {
                      "type": "string",
                      "nullable": true
                    }
                  },
                  "required": [
                    "id",
                    "name"
                  ],
                  "additionalProperties": {}
                }
              }
            },
            "required": [
              "nodes"
            ],
            "additionalProperties": {}
          }
        },
        "required": [
          "createdAt",
          "id",
          "identifier",
          "labels",
          "priority",
          "team",
          "title",
          "updatedAt",
          "url"
        ],
        "additionalProperties": {}
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": {}
}
```

##### ` getIssue `

Get an issue by ID or identifier.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "identifier": {
      "type": "string"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "url": {
      "type": "string"
    },
    "branchName": {
      "type": "string",
      "nullable": true
    },
    "priority": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991
    },
    "estimate": {
      "type": "number",
      "nullable": true
    },
    "dueDate": {
      "type": "string",
      "nullable": true
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "archivedAt": {
      "type": "string",
      "nullable": true
    },
    "completedAt": {
      "type": "string",
      "nullable": true
    },
    "canceledAt": {
      "type": "string",
      "nullable": true
    },
    "team": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "key": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "description": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "id",
        "key",
        "name"
      ],
      "additionalProperties": {}
    },
    "state": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "type": {
          "type": "string"
        },
        "color": {
          "type": "string",
          "nullable": true
        },
        "position": {
          "type": "number",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name",
        "type"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "assignee": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "displayName": {
          "type": "string",
          "nullable": true
        },
        "email": {
          "type": "string",
          "nullable": true
        },
        "active": {
          "type": "boolean",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "creator": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "displayName": {
          "type": "string",
          "nullable": true
        },
        "email": {
          "type": "string",
          "nullable": true
        },
        "active": {
          "type": "boolean",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "project": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "labels": {
      "type": "object",
      "properties": {
        "nodes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "color": {
                "type": "string",
                "nullable": true
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": {}
          }
        }
      },
      "required": [
        "nodes"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "createdAt",
    "id",
    "identifier",
    "labels",
    "priority",
    "team",
    "title",
    "updatedAt",
    "url"
  ],
  "additionalProperties": {}
}
```

##### ` createIssue `

Create an issue; requires a writable service.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "teamId": {
      "type": "string",
      "minLength": 1
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 512
    },
    "description": {
      "type": "string",
      "maxLength": 100000
    },
    "stateId": {
      "type": "string",
      "minLength": 1
    },
    "assigneeId": {
      "type": "string",
      "minLength": 1
    },
    "projectId": {
      "type": "string",
      "minLength": 1
    },
    "priority": {
      "type": "integer",
      "minimum": 0,
      "maximum": 4
    },
    "dueDate": {
      "type": "string",
      "format": "date",
      "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$"
    },
    "labelIds": {
      "maxItems": 100,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      }
    }
  },
  "required": [
    "teamId",
    "title"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "identifier": {
      "type": "string"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "url": {
      "type": "string"
    },
    "branchName": {
      "type": "string",
      "nullable": true
    },
    "priority": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991
    },
    "estimate": {
      "type": "number",
      "nullable": true
    },
    "dueDate": {
      "type": "string",
      "nullable": true
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "archivedAt": {
      "type": "string",
      "nullable": true
    },
    "completedAt": {
      "type": "string",
      "nullable": true
    },
    "canceledAt": {
      "type": "string",
      "nullable": true
    },
    "team": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "key": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "description": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "id",
        "key",
        "name"
      ],
      "additionalProperties": {}
    },
    "state": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "type": {
          "type": "string"
        },
        "color": {
          "type": "string",
          "nullable": true
        },
        "position": {
          "type": "number",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name",
        "type"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "assignee": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "displayName": {
          "type": "string",
          "nullable": true
        },
        "email": {
          "type": "string",
          "nullable": true
        },
        "active": {
          "type": "boolean",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "creator": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "displayName": {
          "type": "string",
          "nullable": true
        },
        "email": {
          "type": "string",
          "nullable": true
        },
        "active": {
          "type": "boolean",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "project": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "labels": {
      "type": "object",
      "properties": {
        "nodes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "color": {
                "type": "string",
                "nullable": true
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": {}
          }
        }
      },
      "required": [
        "nodes"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "createdAt",
    "id",
    "identifier",
    "labels",
    "priority",
    "team",
    "title",
    "updatedAt",
    "url"
  ],
  "additionalProperties": {}
}
```

##### ` updateIssue `

Update issue fields; requires a writable service and at least one change.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 512
    },
    "description": {
      "type": "string",
      "maxLength": 100000
    },
    "stateId": {
      "type": "string",
      "minLength": 1
    },
    "assigneeId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "null"
        }
      ]
    },
    "projectId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "null"
        }
      ]
    },
    "priority": {
      "type": "integer",
      "minimum": 0,
      "maximum": 4
    },
    "dueDate": {
      "anyOf": [
        {
          "type": "string",
          "format": "date",
          "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$"
        },
        {
          "type": "null"
        }
      ]
    },
    "labelIds": {
      "maxItems": 100,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      }
    },
    "id": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false,
  "anyOf": [
    {
      "required": [
        "title"
      ]
    },
    {
      "required": [
        "description"
      ]
    },
    {
      "required": [
        "stateId"
      ]
    },
    {
      "required": [
        "assigneeId"
      ]
    },
    {
      "required": [
        "projectId"
      ]
    },
    {
      "required": [
        "priority"
      ]
    },
    {
      "required": [
        "dueDate"
      ]
    },
    {
      "required": [
        "labelIds"
      ]
    }
  ]
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "identifier": {
      "type": "string"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "url": {
      "type": "string"
    },
    "branchName": {
      "type": "string",
      "nullable": true
    },
    "priority": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991
    },
    "estimate": {
      "type": "number",
      "nullable": true
    },
    "dueDate": {
      "type": "string",
      "nullable": true
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "archivedAt": {
      "type": "string",
      "nullable": true
    },
    "completedAt": {
      "type": "string",
      "nullable": true
    },
    "canceledAt": {
      "type": "string",
      "nullable": true
    },
    "team": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "key": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "description": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "id",
        "key",
        "name"
      ],
      "additionalProperties": {}
    },
    "state": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "type": {
          "type": "string"
        },
        "color": {
          "type": "string",
          "nullable": true
        },
        "position": {
          "type": "number",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name",
        "type"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "assignee": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "displayName": {
          "type": "string",
          "nullable": true
        },
        "email": {
          "type": "string",
          "nullable": true
        },
        "active": {
          "type": "boolean",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "creator": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "displayName": {
          "type": "string",
          "nullable": true
        },
        "email": {
          "type": "string",
          "nullable": true
        },
        "active": {
          "type": "boolean",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "project": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "labels": {
      "type": "object",
      "properties": {
        "nodes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "color": {
                "type": "string",
                "nullable": true
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": {}
          }
        }
      },
      "required": [
        "nodes"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "createdAt",
    "id",
    "identifier",
    "labels",
    "priority",
    "team",
    "title",
    "updatedAt",
    "url"
  ],
  "additionalProperties": {}
}
```

##### ` listComment `

List comments for an issue with cursor pagination.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "first": {
      "default": 50,
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "after": {
      "type": "string",
      "minLength": 1
    },
    "issueId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "issueId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "body": {
            "type": "string"
          },
          "createdAt": {
            "type": "string"
          },
          "updatedAt": {
            "type": "string"
          },
          "user": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "displayName": {
                "type": "string",
                "nullable": true
              },
              "email": {
                "type": "string",
                "nullable": true
              },
              "active": {
                "type": "boolean",
                "nullable": true
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": {},
            "nullable": true
          }
        },
        "required": [
          "body",
          "createdAt",
          "id",
          "updatedAt"
        ],
        "additionalProperties": {}
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": {}
}
```

##### ` createComment `

Create a comment on an issue; requires a writable service.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "issueId": {
      "type": "string",
      "minLength": 1
    },
    "body": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100000
    }
  },
  "required": [
    "body",
    "issueId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "body": {
      "type": "string"
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "user": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "displayName": {
          "type": "string",
          "nullable": true
        },
        "email": {
          "type": "string",
          "nullable": true
        },
        "active": {
          "type": "boolean",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    }
  },
  "required": [
    "body",
    "createdAt",
    "id",
    "updatedAt"
  ],
  "additionalProperties": {}
}
```

#### Static tools

##### ` getViewer `

Get the authenticated Linear user.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "displayName": {
      "type": "string",
      "nullable": true
    },
    "email": {
      "type": "string",
      "nullable": true
    },
    "active": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "id",
    "name"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listTeam `

List teams with cursor pagination and optional archived teams.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {
    "first": 50,
    "includeArchived": false
  },
  "type": "object",
  "properties": {
    "first": {
      "default": 50,
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "after": {
      "type": "string",
      "minLength": 1
    },
    "includeArchived": {
      "default": false,
      "type": "boolean"
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "key": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string",
            "nullable": true
          }
        },
        "required": [
          "id",
          "key",
          "name"
        ],
        "additionalProperties": {}
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listIssueState `

List workflow states for a team with cursor pagination.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "first": {
      "default": 50,
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "after": {
      "type": "string",
      "minLength": 1
    },
    "teamId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "teamId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "color": {
            "type": "string",
            "nullable": true
          },
          "position": {
            "type": "number",
            "nullable": true
          }
        },
        "required": [
          "id",
          "name",
          "type"
        ],
        "additionalProperties": {}
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listUser `

List users, optionally filtered by name or email.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {
    "first": 50,
    "includeArchived": false
  },
  "type": "object",
  "properties": {
    "first": {
      "default": 50,
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "after": {
      "type": "string",
      "minLength": 1
    },
    "includeArchived": {
      "default": false,
      "type": "boolean"
    },
    "query": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "displayName": {
            "type": "string",
            "nullable": true
          },
          "email": {
            "type": "string",
            "nullable": true
          },
          "active": {
            "type": "boolean",
            "nullable": true
          }
        },
        "required": [
          "id",
          "name"
        ],
        "additionalProperties": {}
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listProject `

List projects, optionally filtered by team and name.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {
    "first": 50,
    "includeArchived": false
  },
  "type": "object",
  "properties": {
    "first": {
      "default": 50,
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "after": {
      "type": "string",
      "minLength": 1
    },
    "includeArchived": {
      "default": false,
      "type": "boolean"
    },
    "teamId": {
      "type": "string",
      "minLength": 1
    },
    "query": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "status": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "type": {
                "type": "string"
              },
              "color": {
                "type": "string",
                "nullable": true
              }
            },
            "required": [
              "id",
              "name",
              "type"
            ],
            "additionalProperties": {},
            "nullable": true
          },
          "priority": {
            "type": "number",
            "nullable": true
          },
          "health": {
            "type": "string",
            "nullable": true
          },
          "startDate": {
            "type": "string",
            "nullable": true
          },
          "targetDate": {
            "type": "string",
            "nullable": true
          },
          "createdAt": {
            "type": "string"
          },
          "updatedAt": {
            "type": "string"
          },
          "url": {
            "type": "string"
          },
          "teams": {
            "type": "object",
            "properties": {
              "nodes": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string"
                    },
                    "key": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string",
                      "nullable": true
                    }
                  },
                  "required": [
                    "id",
                    "key",
                    "name"
                  ],
                  "additionalProperties": {}
                }
              }
            },
            "required": [
              "nodes"
            ],
            "additionalProperties": {}
          }
        },
        "required": [
          "createdAt",
          "id",
          "name",
          "teams",
          "updatedAt",
          "url"
        ],
        "additionalProperties": {}
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listIssue `

List issues with cursor pagination, field filters, text search and nested GraphQL filters.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {
    "first": 50,
    "includeArchived": false
  },
  "type": "object",
  "properties": {
    "first": {
      "default": 50,
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "after": {
      "type": "string",
      "minLength": 1
    },
    "includeArchived": {
      "default": false,
      "type": "boolean"
    },
    "teamId": {
      "type": "string",
      "minLength": 1
    },
    "assigneeId": {
      "type": "string",
      "minLength": 1
    },
    "projectId": {
      "type": "string",
      "minLength": 1
    },
    "stateId": {
      "type": "string",
      "minLength": 1
    },
    "query": {
      "type": "string",
      "minLength": 1
    },
    "updatedAfter": {
      "type": "string",
      "format": "date-time",
      "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"
    },
    "filter": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "$ref": "#/$defs/__schema0"
      }
    }
  },
  "$defs": {
    "__schema0": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        },
        {
          "type": "boolean"
        },
        {
          "type": "null"
        },
        {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          }
        },
        {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "$ref": "#/$defs/__schema0"
          }
        }
      ]
    }
  },
  "required": [],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "identifier": {
            "type": "string"
          },
          "title": {
            "type": "string"
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "url": {
            "type": "string"
          },
          "branchName": {
            "type": "string",
            "nullable": true
          },
          "priority": {
            "type": "integer",
            "minimum": -9007199254740991,
            "maximum": 9007199254740991
          },
          "estimate": {
            "type": "number",
            "nullable": true
          },
          "dueDate": {
            "type": "string",
            "nullable": true
          },
          "createdAt": {
            "type": "string"
          },
          "updatedAt": {
            "type": "string"
          },
          "archivedAt": {
            "type": "string",
            "nullable": true
          },
          "completedAt": {
            "type": "string",
            "nullable": true
          },
          "canceledAt": {
            "type": "string",
            "nullable": true
          },
          "team": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "key": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "description": {
                "type": "string",
                "nullable": true
              }
            },
            "required": [
              "id",
              "key",
              "name"
            ],
            "additionalProperties": {}
          },
          "state": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "type": {
                "type": "string"
              },
              "color": {
                "type": "string",
                "nullable": true
              },
              "position": {
                "type": "number",
                "nullable": true
              }
            },
            "required": [
              "id",
              "name",
              "type"
            ],
            "additionalProperties": {},
            "nullable": true
          },
          "assignee": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "displayName": {
                "type": "string",
                "nullable": true
              },
              "email": {
                "type": "string",
                "nullable": true
              },
              "active": {
                "type": "boolean",
                "nullable": true
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": {},
            "nullable": true
          },
          "creator": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "displayName": {
                "type": "string",
                "nullable": true
              },
              "email": {
                "type": "string",
                "nullable": true
              },
              "active": {
                "type": "boolean",
                "nullable": true
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": {},
            "nullable": true
          },
          "project": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": {},
            "nullable": true
          },
          "labels": {
            "type": "object",
            "properties": {
              "nodes": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    },
                    "color": {
                      "type": "string",
                      "nullable": true
                    }
                  },
                  "required": [
                    "id",
                    "name"
                  ],
                  "additionalProperties": {}
                }
              }
            },
            "required": [
              "nodes"
            ],
            "additionalProperties": {}
          }
        },
        "required": [
          "createdAt",
          "id",
          "identifier",
          "labels",
          "priority",
          "team",
          "title",
          "updatedAt",
          "url"
        ],
        "additionalProperties": {}
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getIssue `

Get an issue by ID or identifier.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "identifier": {
      "type": "string"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "url": {
      "type": "string"
    },
    "branchName": {
      "type": "string",
      "nullable": true
    },
    "priority": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991
    },
    "estimate": {
      "type": "number",
      "nullable": true
    },
    "dueDate": {
      "type": "string",
      "nullable": true
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "archivedAt": {
      "type": "string",
      "nullable": true
    },
    "completedAt": {
      "type": "string",
      "nullable": true
    },
    "canceledAt": {
      "type": "string",
      "nullable": true
    },
    "team": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "key": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "description": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "id",
        "key",
        "name"
      ],
      "additionalProperties": {}
    },
    "state": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "type": {
          "type": "string"
        },
        "color": {
          "type": "string",
          "nullable": true
        },
        "position": {
          "type": "number",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name",
        "type"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "assignee": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "displayName": {
          "type": "string",
          "nullable": true
        },
        "email": {
          "type": "string",
          "nullable": true
        },
        "active": {
          "type": "boolean",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "creator": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "displayName": {
          "type": "string",
          "nullable": true
        },
        "email": {
          "type": "string",
          "nullable": true
        },
        "active": {
          "type": "boolean",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "project": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "labels": {
      "type": "object",
      "properties": {
        "nodes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "color": {
                "type": "string",
                "nullable": true
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": {}
          }
        }
      },
      "required": [
        "nodes"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "createdAt",
    "id",
    "identifier",
    "labels",
    "priority",
    "team",
    "title",
    "updatedAt",
    "url"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` createIssue `

Create an issue; requires a writable service.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "teamId": {
      "type": "string",
      "minLength": 1
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 512
    },
    "description": {
      "type": "string",
      "maxLength": 100000
    },
    "stateId": {
      "type": "string",
      "minLength": 1
    },
    "assigneeId": {
      "type": "string",
      "minLength": 1
    },
    "projectId": {
      "type": "string",
      "minLength": 1
    },
    "priority": {
      "type": "integer",
      "minimum": 0,
      "maximum": 4
    },
    "dueDate": {
      "type": "string",
      "format": "date",
      "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$"
    },
    "labelIds": {
      "maxItems": 100,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      }
    }
  },
  "required": [
    "teamId",
    "title"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "identifier": {
      "type": "string"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "url": {
      "type": "string"
    },
    "branchName": {
      "type": "string",
      "nullable": true
    },
    "priority": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991
    },
    "estimate": {
      "type": "number",
      "nullable": true
    },
    "dueDate": {
      "type": "string",
      "nullable": true
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "archivedAt": {
      "type": "string",
      "nullable": true
    },
    "completedAt": {
      "type": "string",
      "nullable": true
    },
    "canceledAt": {
      "type": "string",
      "nullable": true
    },
    "team": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "key": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "description": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "id",
        "key",
        "name"
      ],
      "additionalProperties": {}
    },
    "state": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "type": {
          "type": "string"
        },
        "color": {
          "type": "string",
          "nullable": true
        },
        "position": {
          "type": "number",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name",
        "type"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "assignee": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "displayName": {
          "type": "string",
          "nullable": true
        },
        "email": {
          "type": "string",
          "nullable": true
        },
        "active": {
          "type": "boolean",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "creator": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "displayName": {
          "type": "string",
          "nullable": true
        },
        "email": {
          "type": "string",
          "nullable": true
        },
        "active": {
          "type": "boolean",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "project": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "labels": {
      "type": "object",
      "properties": {
        "nodes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "color": {
                "type": "string",
                "nullable": true
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": {}
          }
        }
      },
      "required": [
        "nodes"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "createdAt",
    "id",
    "identifier",
    "labels",
    "priority",
    "team",
    "title",
    "updatedAt",
    "url"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false
}
```

##### ` updateIssue `

Update issue fields; requires a writable service and at least one change.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 512
    },
    "description": {
      "type": "string",
      "maxLength": 100000
    },
    "stateId": {
      "type": "string",
      "minLength": 1
    },
    "assigneeId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "null"
        }
      ]
    },
    "projectId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "null"
        }
      ]
    },
    "priority": {
      "type": "integer",
      "minimum": 0,
      "maximum": 4
    },
    "dueDate": {
      "anyOf": [
        {
          "type": "string",
          "format": "date",
          "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$"
        },
        {
          "type": "null"
        }
      ]
    },
    "labelIds": {
      "maxItems": 100,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      }
    },
    "id": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false,
  "anyOf": [
    {
      "required": [
        "title"
      ]
    },
    {
      "required": [
        "description"
      ]
    },
    {
      "required": [
        "stateId"
      ]
    },
    {
      "required": [
        "assigneeId"
      ]
    },
    {
      "required": [
        "projectId"
      ]
    },
    {
      "required": [
        "priority"
      ]
    },
    {
      "required": [
        "dueDate"
      ]
    },
    {
      "required": [
        "labelIds"
      ]
    }
  ]
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "identifier": {
      "type": "string"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "url": {
      "type": "string"
    },
    "branchName": {
      "type": "string",
      "nullable": true
    },
    "priority": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991
    },
    "estimate": {
      "type": "number",
      "nullable": true
    },
    "dueDate": {
      "type": "string",
      "nullable": true
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "archivedAt": {
      "type": "string",
      "nullable": true
    },
    "completedAt": {
      "type": "string",
      "nullable": true
    },
    "canceledAt": {
      "type": "string",
      "nullable": true
    },
    "team": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "key": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "description": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "id",
        "key",
        "name"
      ],
      "additionalProperties": {}
    },
    "state": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "type": {
          "type": "string"
        },
        "color": {
          "type": "string",
          "nullable": true
        },
        "position": {
          "type": "number",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name",
        "type"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "assignee": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "displayName": {
          "type": "string",
          "nullable": true
        },
        "email": {
          "type": "string",
          "nullable": true
        },
        "active": {
          "type": "boolean",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "creator": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "displayName": {
          "type": "string",
          "nullable": true
        },
        "email": {
          "type": "string",
          "nullable": true
        },
        "active": {
          "type": "boolean",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "project": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "labels": {
      "type": "object",
      "properties": {
        "nodes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "color": {
                "type": "string",
                "nullable": true
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": {}
          }
        }
      },
      "required": [
        "nodes"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "createdAt",
    "id",
    "identifier",
    "labels",
    "priority",
    "team",
    "title",
    "updatedAt",
    "url"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` listComment `

List comments for an issue with cursor pagination.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "first": {
      "default": 50,
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "after": {
      "type": "string",
      "minLength": 1
    },
    "issueId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "issueId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "body": {
            "type": "string"
          },
          "createdAt": {
            "type": "string"
          },
          "updatedAt": {
            "type": "string"
          },
          "user": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "displayName": {
                "type": "string",
                "nullable": true
              },
              "email": {
                "type": "string",
                "nullable": true
              },
              "active": {
                "type": "boolean",
                "nullable": true
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": {},
            "nullable": true
          }
        },
        "required": [
          "body",
          "createdAt",
          "id",
          "updatedAt"
        ],
        "additionalProperties": {}
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": {}
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` createComment `

Create a comment on an issue; requires a writable service.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "issueId": {
      "type": "string",
      "minLength": 1
    },
    "body": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100000
    }
  },
  "required": [
    "body",
    "issueId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "body": {
      "type": "string"
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "user": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "displayName": {
          "type": "string",
          "nullable": true
        },
        "email": {
          "type": "string",
          "nullable": true
        },
        "active": {
          "type": "boolean",
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": {},
      "nullable": true
    }
  },
  "required": [
    "body",
    "createdAt",
    "id",
    "updatedAt"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false
}
```

### ` edge-tts ` — Edge speech

Synthesize MP3 speech without an API key, using a Chinese voice by default.

Aliases: ` edge `

Capabilities: ` tts `

Provider options schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "voice": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "timeoutMs": {
      "type": "integer",
      "minimum": 1,
      "maximum": 2147483647
    },
    "maxAudioBytes": {
      "type": "integer",
      "minimum": 1,
      "maximum": 16777216
    }
  },
  "additionalProperties": false
}
```

#### Contract

##### ` synthesize `

Synthesize text into audio bytes.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "text": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100000
    },
    "voice": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "format": {
      "type": "string",
      "enum": [
        "mp3",
        "wav",
        "opus",
        "aac",
        "flac",
        "pcm"
      ],
      "nullable": true
    },
    "speed": {
      "type": "number",
      "minimum": 0.25,
      "maximum": 4,
      "nullable": true
    },
    "rate": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}%$",
      "nullable": true
    },
    "pitch": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}Hz$",
      "nullable": true
    },
    "volume": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}%$",
      "nullable": true
    },
    "instructions": {
      "type": "string",
      "maxLength": 100000,
      "nullable": true
    }
  },
  "required": [
    "text"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "audioBase64": {
      "type": "string",
      "minLength": 4,
      "maxLength": 22369624,
      "pattern": "^[A-Za-z0-9+/]*={0,2}$"
    },
    "format": {
      "type": "string",
      "enum": [
        "mp3",
        "wav",
        "opus",
        "aac",
        "flac",
        "pcm"
      ]
    },
    "mediaType": {
      "type": "string",
      "maxLength": 64
    },
    "voice": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "byteLength": {
      "type": "integer",
      "minimum": 1,
      "maximum": 16777216
    }
  },
  "required": [
    "audioBase64",
    "byteLength",
    "format",
    "mediaType"
  ],
  "additionalProperties": false
}
```

##### ` listVoices `

List available voices when supported by the provider.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "locale": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "query": {
      "type": "string",
      "maxLength": 256,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "supported": {
      "type": "boolean"
    },
    "voices": {
      "maxItems": 10000,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          },
          "name": {
            "type": "string",
            "maxLength": 512,
            "nullable": true
          },
          "locale": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256,
            "nullable": true
          },
          "gender": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256,
            "nullable": true
          }
        },
        "required": [
          "id"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "supported",
    "voices"
  ],
  "additionalProperties": false
}
```

#### Static tools

##### ` synthesize `

Synthesize text into audio bytes.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "text": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100000
    },
    "voice": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "format": {
      "type": "string",
      "enum": [
        "mp3",
        "wav",
        "opus",
        "aac",
        "flac",
        "pcm"
      ],
      "nullable": true
    },
    "speed": {
      "type": "number",
      "minimum": 0.25,
      "maximum": 4,
      "nullable": true
    },
    "rate": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}%$",
      "nullable": true
    },
    "pitch": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}Hz$",
      "nullable": true
    },
    "volume": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}%$",
      "nullable": true
    },
    "instructions": {
      "type": "string",
      "maxLength": 100000,
      "nullable": true
    }
  },
  "required": [
    "text"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "audioBase64": {
      "type": "string",
      "minLength": 4,
      "maxLength": 22369624,
      "pattern": "^[A-Za-z0-9+/]*={0,2}$"
    },
    "format": {
      "type": "string",
      "enum": [
        "mp3",
        "wav",
        "opus",
        "aac",
        "flac",
        "pcm"
      ]
    },
    "mediaType": {
      "type": "string",
      "maxLength": 64
    },
    "voice": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "byteLength": {
      "type": "integer",
      "minimum": 1,
      "maximum": 16777216
    }
  },
  "required": [
    "audioBase64",
    "byteLength",
    "format",
    "mediaType"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listVoices `

List available voices when supported by the provider.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "locale": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "query": {
      "type": "string",
      "maxLength": 256,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "supported": {
      "type": "boolean"
    },
    "voices": {
      "maxItems": 10000,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          },
          "name": {
            "type": "string",
            "maxLength": 512,
            "nullable": true
          },
          "locale": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256,
            "nullable": true
          },
          "gender": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256,
            "nullable": true
          }
        },
        "required": [
          "id"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "supported",
    "voices"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

### ` openai-tts ` — OpenAI speech

Synthesize speech using an explicitly selected OpenAI-compatible audio model.

Aliases: ` openai-speech `

Capabilities: ` tts `

Provider options schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "apiKey": {
      "type": "string",
      "minLength": 1
    },
    "apiKeyEnv": {
      "type": "string",
      "pattern": "^[A-Za-z_][A-Za-z0-9_]*$"
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "voice": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "timeoutMs": {
      "type": "integer",
      "minimum": 1,
      "maximum": 2147483647
    },
    "maxAudioBytes": {
      "type": "integer",
      "minimum": 1,
      "maximum": 16777216
    }
  },
  "additionalProperties": false
}
```

#### Contract

##### ` synthesize `

Synthesize text into audio bytes.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "text": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100000
    },
    "voice": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "format": {
      "type": "string",
      "enum": [
        "mp3",
        "wav",
        "opus",
        "aac",
        "flac",
        "pcm"
      ],
      "nullable": true
    },
    "speed": {
      "type": "number",
      "minimum": 0.25,
      "maximum": 4,
      "nullable": true
    },
    "rate": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}%$",
      "nullable": true
    },
    "pitch": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}Hz$",
      "nullable": true
    },
    "volume": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}%$",
      "nullable": true
    },
    "instructions": {
      "type": "string",
      "maxLength": 100000,
      "nullable": true
    }
  },
  "required": [
    "text"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "audioBase64": {
      "type": "string",
      "minLength": 4,
      "maxLength": 22369624,
      "pattern": "^[A-Za-z0-9+/]*={0,2}$"
    },
    "format": {
      "type": "string",
      "enum": [
        "mp3",
        "wav",
        "opus",
        "aac",
        "flac",
        "pcm"
      ]
    },
    "mediaType": {
      "type": "string",
      "maxLength": 64
    },
    "voice": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "byteLength": {
      "type": "integer",
      "minimum": 1,
      "maximum": 16777216
    }
  },
  "required": [
    "audioBase64",
    "byteLength",
    "format",
    "mediaType"
  ],
  "additionalProperties": false
}
```

##### ` listVoices `

List available voices when supported by the provider.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "locale": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "query": {
      "type": "string",
      "maxLength": 256,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "supported": {
      "type": "boolean"
    },
    "voices": {
      "maxItems": 10000,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          },
          "name": {
            "type": "string",
            "maxLength": 512,
            "nullable": true
          },
          "locale": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256,
            "nullable": true
          },
          "gender": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256,
            "nullable": true
          }
        },
        "required": [
          "id"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "supported",
    "voices"
  ],
  "additionalProperties": false
}
```

#### Static tools

##### ` synthesize `

Synthesize text into audio bytes.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "text": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100000
    },
    "voice": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "format": {
      "type": "string",
      "enum": [
        "mp3",
        "wav",
        "opus",
        "aac",
        "flac",
        "pcm"
      ],
      "nullable": true
    },
    "speed": {
      "type": "number",
      "minimum": 0.25,
      "maximum": 4,
      "nullable": true
    },
    "rate": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}%$",
      "nullable": true
    },
    "pitch": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}Hz$",
      "nullable": true
    },
    "volume": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}%$",
      "nullable": true
    },
    "instructions": {
      "type": "string",
      "maxLength": 100000,
      "nullable": true
    }
  },
  "required": [
    "text"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "audioBase64": {
      "type": "string",
      "minLength": 4,
      "maxLength": 22369624,
      "pattern": "^[A-Za-z0-9+/]*={0,2}$"
    },
    "format": {
      "type": "string",
      "enum": [
        "mp3",
        "wav",
        "opus",
        "aac",
        "flac",
        "pcm"
      ]
    },
    "mediaType": {
      "type": "string",
      "maxLength": 64
    },
    "voice": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "byteLength": {
      "type": "integer",
      "minimum": 1,
      "maximum": 16777216
    }
  },
  "required": [
    "audioBase64",
    "byteLength",
    "format",
    "mediaType"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listVoices `

List available voices when supported by the provider.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "locale": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "query": {
      "type": "string",
      "maxLength": 256,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "supported": {
      "type": "boolean"
    },
    "voices": {
      "maxItems": 10000,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          },
          "name": {
            "type": "string",
            "maxLength": 512,
            "nullable": true
          },
          "locale": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256,
            "nullable": true
          },
          "gender": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256,
            "nullable": true
          }
        },
        "required": [
          "id"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "supported",
    "voices"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

### ` grafana ` — Grafana

Manage classic Grafana dashboards and panels, inspect health and call the authenticated HTTP API.

Aliases: ` gf `

Capabilities: ` grafana `

Examples:

Check Grafana health.

```sh
woctl grafana status
```

List dashboards.

```sh
woctl grafana api /api/search --query type=dash-db
```

Provider options schema:

```json
{
  "type": "object",
  "properties": {
    "accessToken": {
      "type": "string"
    },
    "accessTokenEnv": {
      "type": "string"
    },
    "username": {
      "type": "string"
    },
    "usernameEnv": {
      "type": "string"
    },
    "password": {
      "type": "string"
    },
    "passwordEnv": {
      "type": "string"
    },
    "timeoutMs": {
      "type": "integer",
      "minimum": 1
    },
    "maxResponseBytes": {
      "type": "integer",
      "minimum": 1
    }
  },
  "additionalProperties": false
}
```

#### Static tools

##### ` health `

Check Grafana health.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "database": {
      "type": "string",
      "nullable": true
    },
    "version": {
      "type": "string",
      "nullable": true
    },
    "commit": {
      "type": "string",
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` whoami `

Read the authenticated Grafana user.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "login": {
      "type": "string",
      "nullable": true
    },
    "email": {
      "type": "string",
      "nullable": true
    },
    "name": {
      "type": "string",
      "nullable": true
    },
    "isGrafanaAdmin": {
      "type": "boolean",
      "nullable": true
    },
    "orgId": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991,
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` request `

Call an authenticated Grafana API path. Non-read HTTP methods require a writable service.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "minLength": 1,
      "maxLength": 2048
    },
    "method": {
      "type": "string",
      "enum": [
        "GET",
        "HEAD",
        "OPTIONS",
        "POST",
        "PUT",
        "PATCH",
        "DELETE"
      ],
      "nullable": true
    },
    "params": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        ]
      },
      "nullable": true
    },
    "body": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "path"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema"
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` listDashboard `

Search one page of classic dashboard summaries; use page to retrieve further results.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "nullable": true
    },
    "tag": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "nullable": true
    },
    "folderUid": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "limit": {
      "description": "Page size; this is not an all-pages operation.",
      "type": "integer",
      "minimum": 1,
      "maximum": 500,
      "nullable": true
    },
    "page": {
      "description": "Classic search page, starting at 1.",
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "uid": {
        "type": "string"
      },
      "id": {
        "type": "integer",
        "minimum": -9007199254740991,
        "maximum": 9007199254740991,
        "nullable": true
      },
      "title": {
        "type": "string",
        "nullable": true
      },
      "url": {
        "type": "string",
        "nullable": true
      },
      "type": {
        "type": "string",
        "nullable": true
      },
      "folderUid": {
        "type": "string",
        "nullable": true
      },
      "folderTitle": {
        "type": "string",
        "nullable": true
      },
      "tags": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "nullable": true
      }
    },
    "required": [
      "uid"
    ],
    "additionalProperties": {}
  }
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getDashboard `

Read a classic dashboard and its metadata by Grafana UID.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "uid": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "uid"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "dashboard": {
      "type": "object",
      "properties": {
        "uid": {
          "type": "string",
          "nullable": true
        },
        "title": {
          "type": "string",
          "nullable": true
        },
        "version": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991,
          "nullable": true
        },
        "panels": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          },
          "nullable": true
        }
      },
      "additionalProperties": {}
    },
    "meta": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    }
  },
  "required": [
    "dashboard"
  ],
  "additionalProperties": {},
  "$defs": {
    "__schema0": {
      "type": "object",
      "properties": {
        "id": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "title": {
          "type": "string",
          "nullable": true
        },
        "type": {
          "type": "string",
          "nullable": true
        },
        "panels": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          },
          "nullable": true
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": {}
    }
  }
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` updateDashboard `

Create or update a classic dashboard. dryRun previews the payload locally without comparing or saving remotely.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "dashboard": {
      "type": "object",
      "properties": {
        "uid": {
          "type": "string",
          "nullable": true
        },
        "title": {
          "type": "string",
          "nullable": true
        },
        "version": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991,
          "nullable": true
        },
        "panels": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          },
          "nullable": true
        }
      },
      "additionalProperties": {}
    },
    "folderUid": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "message": {
      "type": "string",
      "maxLength": 500,
      "nullable": true
    },
    "overwrite": {
      "type": "boolean",
      "nullable": true
    },
    "expectedVersion": {
      "description": "Classic numeric version precondition; incompatible with overwrite.",
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "dashboard"
  ],
  "additionalProperties": false,
  "$defs": {
    "__schema0": {
      "type": "object",
      "properties": {
        "id": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "title": {
          "type": "string",
          "nullable": true
        },
        "type": {
          "type": "string",
          "nullable": true
        },
        "panels": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          },
          "nullable": true
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": {}
    }
  }
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "anyOf": [
    {
      "type": "object",
      "properties": {
        "dryRun": {
          "type": "boolean",
          "const": true
        },
        "changed": {
          "type": "boolean",
          "const": true,
          "description": "A save is planned; no comparison with the remote dashboard was performed."
        },
        "compared": {
          "type": "boolean",
          "const": false
        },
        "dashboard": {
          "type": "object",
          "properties": {
            "uid": {
              "type": "string",
              "nullable": true
            },
            "title": {
              "type": "string",
              "nullable": true
            },
            "version": {
              "type": "integer",
              "minimum": 0,
              "maximum": 9007199254740991,
              "nullable": true
            },
            "panels": {
              "type": "array",
              "items": {
                "$ref": "#/$defs/__schema0"
              },
              "nullable": true
            }
          },
          "additionalProperties": {}
        },
        "folderUid": {
          "type": "string",
          "nullable": true
        },
        "message": {
          "type": "string",
          "nullable": true
        },
        "overwrite": {
          "type": "boolean"
        }
      },
      "required": [
        "changed",
        "compared",
        "dashboard",
        "dryRun",
        "overwrite"
      ],
      "additionalProperties": {}
    },
    {
      "type": "object",
      "properties": {
        "uid": {
          "type": "string",
          "nullable": true
        },
        "url": {
          "type": "string",
          "nullable": true
        },
        "status": {
          "type": "string",
          "nullable": true
        },
        "id": {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991,
          "nullable": true
        },
        "version": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991,
          "nullable": true
        },
        "dryRun": {
          "type": "boolean",
          "const": false,
          "nullable": true
        }
      },
      "additionalProperties": {}
    }
  ],
  "$defs": {
    "__schema0": {
      "type": "object",
      "properties": {
        "id": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "title": {
          "type": "string",
          "nullable": true
        },
        "type": {
          "type": "string",
          "nullable": true
        },
        "panels": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          },
          "nullable": true
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": {}
    }
  }
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true,
  "supportsDryRun": true
}
```

##### ` listPanel `

List classic panels, including rows and panels nested in collapsed rows.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "dashboardUid": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "dashboardUid"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "array",
  "items": {
    "$ref": "#/$defs/__schema0"
  },
  "$defs": {
    "__schema0": {
      "type": "object",
      "properties": {
        "id": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "title": {
          "type": "string",
          "nullable": true
        },
        "type": {
          "type": "string",
          "nullable": true
        },
        "panels": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          },
          "nullable": true
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": {}
    }
  }
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getPanel `

Read one classic panel by dashboard UID and numeric panel ID.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "dashboardUid": {
      "type": "string",
      "minLength": 1
    },
    "panelId": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    }
  },
  "required": [
    "dashboardUid",
    "panelId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "title": {
      "type": "string",
      "nullable": true
    },
    "type": {
      "type": "string",
      "nullable": true
    },
    "panels": {
      "type": "array",
      "items": {
        "$ref": "#"
      },
      "nullable": true
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` patchPanel `

Patch one classic panel using exactly one of set, merge or replace. dryRun reads and computes changes without saving.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "anyOf": [
    {
      "type": "object",
      "properties": {
        "dashboardUid": {
          "type": "string",
          "minLength": 1
        },
        "panelId": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "message": {
          "type": "string",
          "maxLength": 500,
          "nullable": true
        },
        "expectedVersion": {
          "description": "Requires the fetched classic dashboard to have this version before patching.",
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991,
          "nullable": true
        },
        "dryRun": {
          "type": "boolean",
          "nullable": true
        },
        "set": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {}
        }
      },
      "required": [
        "dashboardUid",
        "panelId",
        "set"
      ],
      "additionalProperties": false
    },
    {
      "type": "object",
      "properties": {
        "dashboardUid": {
          "type": "string",
          "minLength": 1
        },
        "panelId": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "message": {
          "type": "string",
          "maxLength": 500,
          "nullable": true
        },
        "expectedVersion": {
          "description": "Requires the fetched classic dashboard to have this version before patching.",
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991,
          "nullable": true
        },
        "dryRun": {
          "type": "boolean",
          "nullable": true
        },
        "merge": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {}
        }
      },
      "required": [
        "dashboardUid",
        "merge",
        "panelId"
      ],
      "additionalProperties": false
    },
    {
      "type": "object",
      "properties": {
        "dashboardUid": {
          "type": "string",
          "minLength": 1
        },
        "panelId": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "message": {
          "type": "string",
          "maxLength": 500,
          "nullable": true
        },
        "expectedVersion": {
          "description": "Requires the fetched classic dashboard to have this version before patching.",
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991,
          "nullable": true
        },
        "dryRun": {
          "type": "boolean",
          "nullable": true
        },
        "replace": {
          "$ref": "#/$defs/__schema0"
        }
      },
      "required": [
        "dashboardUid",
        "panelId",
        "replace"
      ],
      "additionalProperties": false
    }
  ],
  "$defs": {
    "__schema0": {
      "type": "object",
      "properties": {
        "id": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "title": {
          "type": "string",
          "nullable": true
        },
        "type": {
          "type": "string",
          "nullable": true
        },
        "panels": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          },
          "nullable": true
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": {}
    }
  }
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "changed": {
      "type": "boolean"
    },
    "panel": {
      "$ref": "#/$defs/__schema0"
    },
    "dashboard": {
      "type": "object",
      "properties": {
        "uid": {
          "type": "string",
          "nullable": true
        },
        "version": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991,
          "nullable": true
        },
        "url": {
          "type": "string",
          "nullable": true
        }
      },
      "additionalProperties": false
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "changed",
    "dashboard",
    "panel"
  ],
  "additionalProperties": {},
  "$defs": {
    "__schema0": {
      "type": "object",
      "properties": {
        "id": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "title": {
          "type": "string",
          "nullable": true
        },
        "type": {
          "type": "string",
          "nullable": true
        },
        "panels": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          },
          "nullable": true
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": {}
    }
  }
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true,
  "supportsDryRun": true
}
```

### ` telegram ` — Telegram Bot

Use Telegram Bot API messages, chats, updates, webhooks, bot commands and files.

Aliases: ` tg `

Capabilities: ` telegram `

Examples:

Check the configured bot identity.

```sh
woctl telegram whoami
```

Send a message.

```sh
woctl telegram send --chat 123456789 --text "hello" --yes
```

Provider options schema:

```json
{
  "type": "object",
  "properties": {
    "botTokenEnv": {
      "type": "string"
    },
    "timeoutMs": {
      "type": "integer",
      "minimum": 1
    },
    "maxResponseBytes": {
      "type": "integer",
      "minimum": 1
    }
  },
  "required": [
    "botTokenEnv"
  ],
  "additionalProperties": false
}
```

#### Static tools

##### ` getMe `

Read the configured Telegram bot identity.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` whoami `

Read the configured Telegram bot identity.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` sendMessage `

Send a Telegram message.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chatId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "pattern": "^\\S+$"
        },
        {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        }
      ]
    },
    "text": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4096
    },
    "parseMode": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "disableNotification": {
      "type": "boolean",
      "nullable": true
    },
    "replyToMessageId": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "nullable": true
    }
  },
  "required": [
    "chatId",
    "text"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` getChat `

Read Telegram chat information.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chatId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "pattern": "^\\S+$"
        },
        {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        }
      ]
    }
  },
  "required": [
    "chatId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getChatMember `

Read a Telegram chat member.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chatId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "pattern": "^\\S+$"
        },
        {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        }
      ]
    },
    "userId": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    }
  },
  "required": [
    "chatId",
    "userId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getChatAdministrators `

List Telegram chat administrators.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chatId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "pattern": "^\\S+$"
        },
        {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        }
      ]
    }
  },
  "required": [
    "chatId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getChatMemberCount `

Read the Telegram chat member count.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chatId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "pattern": "^\\S+$"
        },
        {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        }
      ]
    }
  },
  "required": [
    "chatId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getUpdates `

Receive Telegram updates; this may consume or change update queue state.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "offset": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "nullable": true
    },
    "timeout": {
      "type": "integer",
      "minimum": 0,
      "maximum": 50,
      "nullable": true
    },
    "allowedUpdates": {
      "maxItems": 100,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` getWebhookInfo `

Read Telegram webhook status.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` setWebhook `

Set the Telegram webhook.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "format": "uri"
    },
    "secretToken": {
      "type": "string",
      "pattern": "^[A-Za-z0-9_-]{1,256}$",
      "nullable": true
    },
    "dropPendingUpdates": {
      "type": "boolean",
      "nullable": true
    },
    "allowedUpdates": {
      "maxItems": 100,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "nullable": true
    },
    "maxConnections": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "nullable": true
    }
  },
  "required": [
    "url"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` deleteWebhook `

Delete the Telegram webhook.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "dropPendingUpdates": {
      "type": "boolean",
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` editMessageText `

Edit a Telegram message.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chatId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "pattern": "^\\S+$"
        },
        {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        }
      ]
    },
    "messageId": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "text": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4096
    },
    "parseMode": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "replyMarkup": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    }
  },
  "required": [
    "chatId",
    "messageId",
    "text"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` deleteMessage `

Delete a Telegram message.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chatId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "pattern": "^\\S+$"
        },
        {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        }
      ]
    },
    "messageId": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    }
  },
  "required": [
    "chatId",
    "messageId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` forwardMessage `

Forward a Telegram message.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chatId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "pattern": "^\\S+$"
        },
        {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        }
      ]
    },
    "fromChatId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "pattern": "^\\S+$"
        },
        {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        }
      ]
    },
    "messageId": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "disableNotification": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "chatId",
    "fromChatId",
    "messageId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` copyMessage `

Copy a Telegram message.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chatId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "pattern": "^\\S+$"
        },
        {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        }
      ]
    },
    "fromChatId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "pattern": "^\\S+$"
        },
        {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        }
      ]
    },
    "messageId": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "disableNotification": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "chatId",
    "fromChatId",
    "messageId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` pinChatMessage `

Pin a Telegram chat message.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chatId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "pattern": "^\\S+$"
        },
        {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        }
      ]
    },
    "messageId": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "disableNotification": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "chatId",
    "messageId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` unpinChatMessage `

Unpin a Telegram chat message.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chatId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "pattern": "^\\S+$"
        },
        {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        }
      ]
    },
    "messageId": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "nullable": true
    }
  },
  "required": [
    "chatId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` answerCallbackQuery `

Answer a Telegram callback query.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "callbackQueryId": {
      "type": "string",
      "minLength": 1
    },
    "text": {
      "type": "string",
      "maxLength": 200,
      "nullable": true
    },
    "showAlert": {
      "type": "boolean",
      "nullable": true
    },
    "url": {
      "type": "string",
      "format": "uri",
      "nullable": true
    },
    "cacheTime": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "nullable": true
    }
  },
  "required": [
    "callbackQueryId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` getMyCommands `

Read Telegram bot commands.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "languageCode": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` setMyCommands `

Set Telegram bot commands.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "commands": {
      "minItems": 1,
      "maxItems": 100,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "command": {
            "type": "string",
            "pattern": "^[a-z0-9_]{1,32}$"
          },
          "description": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          }
        },
        "required": [
          "command",
          "description"
        ],
        "additionalProperties": false
      }
    },
    "languageCode": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    }
  },
  "required": [
    "commands"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` deleteMyCommands `

Delete Telegram bot commands.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "languageCode": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` getFile `

Read Telegram file metadata.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "fileId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "fileId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` sendPhoto `

Send a Telegram photo.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chatId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "pattern": "^\\S+$"
        },
        {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        }
      ]
    },
    "photo": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "object",
          "properties": {
            "base64": {
              "type": "string",
              "minLength": 4,
              "maxLength": 13981016,
              "pattern": "^[A-Za-z0-9+/]*={0,2}$"
            },
            "byteLength": {
              "type": "integer",
              "minimum": 1,
              "maximum": 10485760
            },
            "filename": {
              "type": "string",
              "minLength": 1,
              "maxLength": 255
            },
            "contentType": {
              "type": "string",
              "maxLength": 255,
              "nullable": true
            }
          },
          "required": [
            "base64",
            "byteLength",
            "filename"
          ],
          "additionalProperties": false
        }
      ]
    },
    "caption": {
      "type": "string",
      "maxLength": 1024,
      "nullable": true
    },
    "parseMode": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "disableNotification": {
      "type": "boolean",
      "nullable": true
    },
    "replyToMessageId": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "nullable": true
    }
  },
  "required": [
    "chatId",
    "photo"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` sendDocument `

Send a Telegram document.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chatId": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "pattern": "^\\S+$"
        },
        {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        }
      ]
    },
    "document": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "object",
          "properties": {
            "base64": {
              "type": "string",
              "minLength": 4,
              "maxLength": 27962028,
              "pattern": "^[A-Za-z0-9+/]*={0,2}$"
            },
            "byteLength": {
              "type": "integer",
              "minimum": 1,
              "maximum": 20971520
            },
            "filename": {
              "type": "string",
              "minLength": 1,
              "maxLength": 255
            },
            "contentType": {
              "type": "string",
              "maxLength": 255,
              "nullable": true
            }
          },
          "required": [
            "base64",
            "byteLength",
            "filename"
          ],
          "additionalProperties": false
        }
      ]
    },
    "caption": {
      "type": "string",
      "maxLength": 1024,
      "nullable": true
    },
    "parseMode": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "disableNotification": {
      "type": "boolean",
      "nullable": true
    },
    "replyToMessageId": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "nullable": true
    }
  },
  "required": [
    "chatId",
    "document"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` downloadFile `

Download a Telegram file by its returned file path.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "filePath": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "filePath"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "base64": {
      "type": "string",
      "minLength": 4,
      "maxLength": 27962028,
      "pattern": "^[A-Za-z0-9+/]*={0,2}$"
    },
    "byteLength": {
      "type": "integer",
      "minimum": 1,
      "maximum": 20971520
    },
    "filePath": {
      "type": "string",
      "minLength": 1
    },
    "contentType": {
      "type": "string",
      "maxLength": 256,
      "nullable": true
    }
  },
  "required": [
    "base64",
    "byteLength",
    "filePath"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` request `

Call a Telegram Bot API method; unknown methods require write access.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "method": {
      "type": "string",
      "minLength": 1,
      "maxLength": 64,
      "pattern": "^[A-Za-z][A-Za-z0-9]*$"
    },
    "params": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    }
  },
  "required": [
    "method"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` requestRead `

Call a whitelisted read-only Telegram Bot API method.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "method": {
      "type": "string",
      "minLength": 1,
      "maxLength": 64,
      "pattern": "^[A-Za-z][A-Za-z0-9]*$"
    },
    "params": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    }
  },
  "required": [
    "method"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "result": {}
  },
  "required": [
    "ok",
    "result"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

### ` feishu ` — Feishu

Send Feishu/Lark messages via app credential or group webhook, and call the Feishu OpenAPI.

Capabilities: ` feishu `

Provider options schema:

```json
{
  "type": "object",
  "properties": {
    "appIdEnv": {
      "type": "string"
    },
    "appSecretEnv": {
      "type": "string"
    },
    "webhookUrlEnv": {
      "type": "string"
    },
    "webhookSecretEnv": {
      "type": "string"
    },
    "timeoutMs": {
      "type": "integer",
      "minimum": 1
    }
  },
  "additionalProperties": false
}
```

#### Static tools

##### ` sendMessage `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "to": {
      "type": "string",
      "minLength": 1
    },
    "text": {
      "type": "string",
      "minLength": 1,
      "maxLength": 10000
    }
  },
  "required": [
    "text",
    "to"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "code": {
      "type": "number"
    },
    "msg": {
      "type": "string",
      "nullable": true
    },
    "data": {
      "type": "object",
      "properties": {
        "message_id": {
          "type": "string",
          "nullable": true
        },
        "root_id": {
          "type": "string",
          "nullable": true
        },
        "parent_id": {
          "type": "string",
          "nullable": true
        },
        "thread_id": {
          "type": "string",
          "nullable": true
        },
        "msg_type": {
          "type": "string",
          "nullable": true
        },
        "create_time": {
          "type": "string",
          "nullable": true
        },
        "update_time": {
          "type": "string",
          "nullable": true
        },
        "deleted": {
          "type": "boolean",
          "nullable": true
        },
        "updated": {
          "type": "boolean",
          "nullable": true
        },
        "chat_id": {
          "type": "string",
          "nullable": true
        },
        "body": {
          "type": [
            "object",
            "array",
            "string",
            "number",
            "boolean",
            "null"
          ],
          "nullable": true
        },
        "sender": {
          "type": [
            "object",
            "array",
            "string",
            "number",
            "boolean",
            "null"
          ],
          "nullable": true
        },
        "mentions": {
          "type": "array",
          "items": {},
          "nullable": true
        }
      },
      "additionalProperties": {},
      "nullable": true
    }
  },
  "required": [
    "code"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` sendWebhook `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "text": {
      "type": "string",
      "minLength": 1,
      "maxLength": 10000,
      "nullable": true
    },
    "markdown": {
      "type": "string",
      "minLength": 1,
      "maxLength": 10000,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "code": {
      "type": "number"
    },
    "msg": {
      "type": "string",
      "nullable": true
    },
    "StatusCode": {
      "type": "number",
      "nullable": true
    },
    "StatusMessage": {
      "type": "string",
      "nullable": true
    },
    "data": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    }
  },
  "required": [
    "code"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` request `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "minLength": 1,
      "maxLength": 2048
    },
    "method": {
      "type": "string",
      "minLength": 1,
      "maxLength": 16,
      "nullable": true
    },
    "params": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "type": "string"
      },
      "nullable": true
    },
    "body": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "path"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema"
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` listChat `

List chats the app bot belongs to, paginated with pageToken.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "userIdType": {
      "type": "string",
      "enum": [
        "open_id",
        "union_id",
        "user_id"
      ],
      "nullable": true
    },
    "sortType": {
      "type": "string",
      "enum": [
        "ByCreateTimeAsc",
        "ByActiveTimeDesc"
      ],
      "nullable": true
    },
    "pageSize": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "nullable": true
    },
    "pageToken": {
      "type": "string",
      "minLength": 1,
      "maxLength": 2048,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "chat_id": {
            "type": "string",
            "nullable": true
          },
          "name": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "avatar": {
            "type": "string",
            "nullable": true
          },
          "owner_id": {
            "type": "string",
            "nullable": true
          },
          "owner_id_type": {
            "type": "string",
            "nullable": true
          },
          "external": {
            "type": "boolean",
            "nullable": true
          },
          "tenant_key": {
            "type": "string",
            "nullable": true
          },
          "chat_status": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": {}
      }
    },
    "hasMore": {
      "type": "boolean"
    },
    "pageToken": {
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "hasMore",
    "items"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getChat `

Get chat information.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chatId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "userIdType": {
      "type": "string",
      "enum": [
        "open_id",
        "union_id",
        "user_id"
      ],
      "nullable": true
    }
  },
  "required": [
    "chatId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chat_id": {
      "type": "string",
      "nullable": true
    },
    "name": {
      "type": "string",
      "nullable": true
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "avatar": {
      "type": "string",
      "nullable": true
    },
    "owner_id": {
      "type": "string",
      "nullable": true
    },
    "owner_id_type": {
      "type": "string",
      "nullable": true
    },
    "external": {
      "type": "boolean",
      "nullable": true
    },
    "tenant_key": {
      "type": "string",
      "nullable": true
    },
    "chat_status": {
      "type": "string",
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listChatMember `

List chat members, paginated with pageToken.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chatId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "memberIdType": {
      "type": "string",
      "enum": [
        "open_id",
        "union_id",
        "user_id"
      ],
      "nullable": true
    },
    "pageSize": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "nullable": true
    },
    "pageToken": {
      "type": "string",
      "minLength": 1,
      "maxLength": 2048,
      "nullable": true
    }
  },
  "required": [
    "chatId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "member_id": {
            "type": "string",
            "nullable": true
          },
          "member_id_type": {
            "type": "string",
            "nullable": true
          },
          "name": {
            "type": "string",
            "nullable": true
          },
          "tenant_key": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": {}
      }
    },
    "hasMore": {
      "type": "boolean"
    },
    "pageToken": {
      "type": "string",
      "nullable": true
    },
    "memberTotal": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991,
      "nullable": true
    }
  },
  "required": [
    "hasMore",
    "items"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getUser `

Get a contact user by id, or by email through batch_get_id.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "userId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "nullable": true
    },
    "email": {
      "type": "string",
      "minLength": 3,
      "maxLength": 320,
      "pattern": "^[^\\s@]+@[^\\s@]+$",
      "nullable": true
    },
    "userIdType": {
      "type": "string",
      "enum": [
        "open_id",
        "union_id",
        "user_id"
      ],
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "open_id": {
      "type": "string",
      "nullable": true
    },
    "union_id": {
      "type": "string",
      "nullable": true
    },
    "user_id": {
      "type": "string",
      "nullable": true
    },
    "name": {
      "type": "string",
      "nullable": true
    },
    "en_name": {
      "type": "string",
      "nullable": true
    },
    "email": {
      "type": "string",
      "nullable": true
    },
    "department_ids": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "nullable": true
    },
    "avatar": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    },
    "status": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listMessage `

List chat messages, paginated with pageToken.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "chatId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "startTime": {
      "type": "string",
      "pattern": "^\\d{1,13}$",
      "nullable": true
    },
    "endTime": {
      "type": "string",
      "pattern": "^\\d{1,13}$",
      "nullable": true
    },
    "sortType": {
      "type": "string",
      "enum": [
        "ByCreateTimeAsc",
        "ByCreateTimeDesc"
      ],
      "nullable": true
    },
    "pageSize": {
      "type": "integer",
      "minimum": 1,
      "maximum": 50,
      "nullable": true
    },
    "pageToken": {
      "type": "string",
      "minLength": 1,
      "maxLength": 2048,
      "nullable": true
    }
  },
  "required": [
    "chatId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "message_id": {
            "type": "string",
            "nullable": true
          },
          "root_id": {
            "type": "string",
            "nullable": true
          },
          "parent_id": {
            "type": "string",
            "nullable": true
          },
          "thread_id": {
            "type": "string",
            "nullable": true
          },
          "msg_type": {
            "type": "string",
            "nullable": true
          },
          "create_time": {
            "type": "string",
            "nullable": true
          },
          "update_time": {
            "type": "string",
            "nullable": true
          },
          "deleted": {
            "type": "boolean",
            "nullable": true
          },
          "updated": {
            "type": "boolean",
            "nullable": true
          },
          "chat_id": {
            "type": "string",
            "nullable": true
          },
          "body": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ],
            "nullable": true
          },
          "sender": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ],
            "nullable": true
          },
          "mentions": {
            "type": "array",
            "items": {},
            "nullable": true
          }
        },
        "additionalProperties": {}
      }
    },
    "hasMore": {
      "type": "boolean"
    },
    "pageToken": {
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "hasMore",
    "items"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getMessage `

Get a message.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "messageId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    }
  },
  "required": [
    "messageId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "message_id": {
            "type": "string",
            "nullable": true
          },
          "root_id": {
            "type": "string",
            "nullable": true
          },
          "parent_id": {
            "type": "string",
            "nullable": true
          },
          "thread_id": {
            "type": "string",
            "nullable": true
          },
          "msg_type": {
            "type": "string",
            "nullable": true
          },
          "create_time": {
            "type": "string",
            "nullable": true
          },
          "update_time": {
            "type": "string",
            "nullable": true
          },
          "deleted": {
            "type": "boolean",
            "nullable": true
          },
          "updated": {
            "type": "boolean",
            "nullable": true
          },
          "chat_id": {
            "type": "string",
            "nullable": true
          },
          "body": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ],
            "nullable": true
          },
          "sender": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ],
            "nullable": true
          },
          "mentions": {
            "type": "array",
            "items": {},
            "nullable": true
          }
        },
        "additionalProperties": {}
      }
    }
  },
  "required": [
    "items"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` replyMessage `

Reply to a message; requires a writable service.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "messageId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "text": {
      "type": "string",
      "minLength": 1,
      "maxLength": 30000,
      "nullable": true
    },
    "content": {
      "type": "string",
      "minLength": 2,
      "maxLength": 150000,
      "nullable": true
    },
    "msgType": {
      "type": "string",
      "pattern": "^[a-z_]{1,32}$",
      "nullable": true
    },
    "replyInThread": {
      "type": "boolean",
      "nullable": true
    },
    "uuid": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50,
      "nullable": true
    }
  },
  "required": [
    "messageId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "message_id": {
      "type": "string",
      "nullable": true
    },
    "root_id": {
      "type": "string",
      "nullable": true
    },
    "parent_id": {
      "type": "string",
      "nullable": true
    },
    "thread_id": {
      "type": "string",
      "nullable": true
    },
    "msg_type": {
      "type": "string",
      "nullable": true
    },
    "create_time": {
      "type": "string",
      "nullable": true
    },
    "update_time": {
      "type": "string",
      "nullable": true
    },
    "deleted": {
      "type": "boolean",
      "nullable": true
    },
    "updated": {
      "type": "boolean",
      "nullable": true
    },
    "chat_id": {
      "type": "string",
      "nullable": true
    },
    "body": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    },
    "sender": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    },
    "mentions": {
      "type": "array",
      "items": {},
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false
}
```

##### ` deleteMessage `

Recall (delete) a message sent by the app; requires a writable service.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "messageId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    }
  },
  "required": [
    "messageId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "messageId": {
      "type": "string"
    },
    "deleted": {
      "type": "boolean",
      "const": true
    }
  },
  "required": [
    "deleted",
    "messageId"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` addMessageReaction `

Add an emoji reaction to a message; requires a writable service.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "messageId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "emojiType": {
      "type": "string",
      "pattern": "^[A-Za-z0-9_]{1,64}$"
    }
  },
  "required": [
    "emojiType",
    "messageId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "reaction_id": {
      "type": "string",
      "nullable": true
    },
    "operator": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    },
    "action_time": {
      "type": "string",
      "nullable": true
    },
    "reaction_type": {
      "type": "object",
      "properties": {
        "emoji_type": {
          "type": "string",
          "nullable": true
        }
      },
      "additionalProperties": {},
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false
}
```

##### ` deleteMessageReaction `

Remove a reaction added by the app; requires a writable service.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "messageId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "reactionId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    }
  },
  "required": [
    "messageId",
    "reactionId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "reaction_id": {
      "type": "string",
      "nullable": true
    },
    "operator": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    },
    "action_time": {
      "type": "string",
      "nullable": true
    },
    "reaction_type": {
      "type": "object",
      "properties": {
        "emoji_type": {
          "type": "string",
          "nullable": true
        }
      },
      "additionalProperties": {},
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` uploadImage `

Upload an image (at most 10 MiB) for messages; requires a writable service.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "imageBase64": {
      "type": "string",
      "minLength": 4,
      "maxLength": 13981016,
      "pattern": "^[A-Za-z0-9+/]*={0,2}$"
    },
    "byteLength": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10485760
    },
    "imageType": {
      "type": "string",
      "enum": [
        "message",
        "avatar"
      ],
      "nullable": true
    },
    "filename": {
      "type": "string",
      "minLength": 1,
      "maxLength": 255,
      "nullable": true
    }
  },
  "required": [
    "byteLength",
    "imageBase64"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "imageKey": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "imageKey"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false
}
```

##### ` uploadFile `

Upload a file (at most 30 MiB) for messages; requires a writable service.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "fileBase64": {
      "type": "string",
      "minLength": 4,
      "maxLength": 41943040,
      "pattern": "^[A-Za-z0-9+/]*={0,2}$"
    },
    "byteLength": {
      "type": "integer",
      "minimum": 1,
      "maximum": 31457280
    },
    "fileType": {
      "type": "string",
      "enum": [
        "opus",
        "mp4",
        "pdf",
        "doc",
        "xls",
        "ppt",
        "stream"
      ]
    },
    "fileName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 255
    },
    "duration": {
      "type": "integer",
      "minimum": 0,
      "maximum": 86400000,
      "nullable": true
    }
  },
  "required": [
    "byteLength",
    "fileBase64",
    "fileName",
    "fileType"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "fileKey": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "fileKey"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false
}
```

##### ` downloadMessageResource `

Download an image or file attached to a message, bounded by maxBytes.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "messageId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "fileKey": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "type": {
      "type": "string",
      "enum": [
        "image",
        "file"
      ]
    },
    "maxBytes": {
      "type": "integer",
      "minimum": 1,
      "maximum": 31457280,
      "nullable": true
    }
  },
  "required": [
    "fileKey",
    "messageId",
    "type"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "contentBase64": {
      "type": "string",
      "minLength": 4,
      "maxLength": 41943040,
      "pattern": "^[A-Za-z0-9+/]*={0,2}$"
    },
    "byteLength": {
      "type": "integer",
      "minimum": 1,
      "maximum": 31457280
    },
    "contentType": {
      "type": "string",
      "maxLength": 256,
      "nullable": true
    },
    "filename": {
      "type": "string",
      "maxLength": 255,
      "nullable": true
    }
  },
  "required": [
    "byteLength",
    "contentBase64"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listApi `

List generic Feishu OpenAPI catalog entries with availability; filter by service, risk or text.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "service": {
      "type": "string",
      "minLength": 1,
      "maxLength": 64,
      "nullable": true
    },
    "risk": {
      "type": "string",
      "enum": [
        "read",
        "write",
        "high-risk-write"
      ],
      "nullable": true
    },
    "query": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200,
      "nullable": true
    },
    "includeUnavailable": {
      "type": "boolean",
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "service": {
            "type": "string"
          },
          "resource": {
            "type": "string"
          },
          "method": {
            "type": "string"
          },
          "httpMethod": {
            "type": "string"
          },
          "path": {
            "type": "string"
          },
          "risk": {
            "type": "string"
          },
          "accessTokens": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "scopes": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "summary": {
            "type": "string"
          },
          "docUrl": {
            "type": "string"
          },
          "multipart": {
            "type": "boolean",
            "nullable": true
          },
          "available": {
            "type": "boolean"
          },
          "unavailableReason": {
            "type": "string",
            "nullable": true
          }
        },
        "required": [
          "accessTokens",
          "available",
          "docUrl",
          "httpMethod",
          "id",
          "method",
          "path",
          "resource",
          "risk",
          "scopes",
          "service",
          "summary"
        ],
        "additionalProperties": {}
      }
    },
    "total": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991
    }
  },
  "required": [
    "items",
    "total"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` describeApi `

Describe a catalog API with JSON Schemas of path parameters, query, body and response data.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "minLength": 3,
      "maxLength": 200,
      "pattern": "^[a-z0-9_]+(?:\\.[A-Za-z0-9_]+)+$"
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "service": {
      "type": "string"
    },
    "resource": {
      "type": "string"
    },
    "method": {
      "type": "string"
    },
    "httpMethod": {
      "type": "string"
    },
    "path": {
      "type": "string"
    },
    "risk": {
      "type": "string"
    },
    "accessTokens": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "scopes": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "summary": {
      "type": "string"
    },
    "docUrl": {
      "type": "string"
    },
    "multipart": {
      "type": "boolean",
      "nullable": true
    },
    "available": {
      "type": "boolean"
    },
    "unavailableReason": {
      "type": "string",
      "nullable": true
    },
    "schemas": {
      "type": "object",
      "properties": {
        "pathParams": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {},
          "nullable": true
        },
        "query": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {},
          "nullable": true
        },
        "body": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {},
          "nullable": true
        },
        "response": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {},
          "nullable": true
        }
      },
      "additionalProperties": false
    }
  },
  "required": [
    "accessTokens",
    "available",
    "docUrl",
    "httpMethod",
    "id",
    "method",
    "path",
    "resource",
    "risk",
    "schemas",
    "scopes",
    "service",
    "summary"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` callReadApi `

Call a read-risk catalog API by id with a tenant token; rejects write APIs. dryRun returns the built request.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "minLength": 3,
      "maxLength": 200,
      "pattern": "^[a-z0-9_]+(?:\\.[A-Za-z0-9_]+)+$"
    },
    "path": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "type": [
          "string",
          "number"
        ]
      },
      "nullable": true
    },
    "query": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "body": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "request": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "query": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            ]
          }
        },
        "body": {
          "type": [
            "object",
            "array",
            "string",
            "number",
            "boolean",
            "null"
          ],
          "nullable": true
        }
      },
      "required": [
        "method",
        "path",
        "query"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "data": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    },
    "schemaWarning": {
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` callWriteApi `

Call a write or high-risk-write catalog API by id; requires a writable service, and confirmHighRisk for high-risk-write. dryRun returns the built request without credentials or HTTP.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "minLength": 3,
      "maxLength": 200,
      "pattern": "^[a-z0-9_]+(?:\\.[A-Za-z0-9_]+)+$"
    },
    "path": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "type": [
          "string",
          "number"
        ]
      },
      "nullable": true
    },
    "query": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "body": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "confirmHighRisk": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "request": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "query": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            ]
          }
        },
        "body": {
          "type": [
            "object",
            "array",
            "string",
            "number",
            "boolean",
            "null"
          ],
          "nullable": true
        }
      },
      "required": [
        "method",
        "path",
        "query"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "data": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    },
    "schemaWarning": {
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true,
  "supportsDryRun": true
}
```

### ` cls ` — Tencent CLS

Query Tencent Cloud Log Service (CLS) logs and list log topics.

Aliases: ` tencent-cls `, ` tencent-log `

Capabilities: ` cls `

Examples:

Search a log topic.

```sh
woctl cls query --topic my-topic "*"
```

List log topics.

```sh
woctl cls topics
```

Provider options schema:

```json
{
  "type": "object",
  "properties": {
    "clientIdEnv": {
      "type": "string"
    },
    "clientSecretEnv": {
      "type": "string"
    },
    "region": {
      "type": "string"
    },
    "endpoint": {
      "type": "string"
    }
  },
  "required": [
    "clientIdEnv",
    "clientSecretEnv"
  ],
  "additionalProperties": false
}
```

#### Static tools

##### ` query `

Search Tencent Cloud Log Service topics.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "topic": {
      "minItems": 1,
      "maxItems": 20,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      }
    },
    "query": {
      "type": "string",
      "minLength": 1
    },
    "from": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "to": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 1000,
      "nullable": true
    },
    "sort": {
      "type": "string",
      "enum": [
        "asc",
        "desc"
      ],
      "nullable": true
    },
    "cursor": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "sql": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "from",
    "query",
    "to",
    "topic"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "Context": {
      "type": "string"
    },
    "ListOver": {
      "type": "boolean"
    },
    "RequestId": {
      "type": "string"
    },
    "Analysis": {
      "type": "boolean",
      "nullable": true
    },
    "Results": {
      "type": "array",
      "items": {},
      "nullable": true
    },
    "ColNames": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "nullable": true
    },
    "AnalysisResults": {
      "type": "array",
      "items": {},
      "nullable": true
    },
    "AnalysisRecords": {
      "type": "array",
      "items": {},
      "nullable": true
    },
    "Columns": {
      "type": "array",
      "items": {},
      "nullable": true
    },
    "SamplingRate": {
      "type": "number",
      "nullable": true
    },
    "Topics": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    }
  },
  "required": [
    "Context",
    "ListOver",
    "RequestId"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listTopic `

List Tencent Cloud Log Service topics.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "search": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 1000,
      "nullable": true
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "RequestId": {
      "type": "string"
    },
    "TotalCount": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "Topics": {
      "type": "array",
      "items": {}
    }
  },
  "required": [
    "RequestId",
    "Topics",
    "TotalCount"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

### ` s3 ` — S3

List, read, write and delete objects in an S3-compatible bucket.

Aliases: ` s3mini `

Capabilities: ` s3 `

Examples:

List objects under a prefix.

```sh
woctl s3 list --prefix uploads/
```

Read an object as text.

```sh
woctl s3 get path/to/object.txt
```

Provider options schema:

```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string"
    },
    "accessKeyIdEnv": {
      "type": "string"
    },
    "secretAccessKeyEnv": {
      "type": "string"
    },
    "bucket": {
      "type": "string"
    },
    "region": {
      "type": "string"
    },
    "pathStyle": {
      "type": "boolean"
    }
  },
  "required": [
    "url",
    "accessKeyIdEnv",
    "secretAccessKeyEnv"
  ],
  "additionalProperties": false
}
```

#### Static tools

##### ` listObject `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "delimiter": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "prefix": {
      "type": "string",
      "nullable": true
    },
    "maxKeys": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "Key": {
        "type": "string"
      },
      "Size": {
        "type": "number"
      },
      "LastModified": {
        "type": "string",
        "format": "date-time",
        "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
        "nullable": true
      },
      "ETag": {
        "type": "string"
      },
      "StorageClass": {
        "type": "string"
      },
      "VersionId": {
        "type": "string",
        "nullable": true
      },
      "IsLatest": {
        "type": "boolean",
        "nullable": true
      },
      "IsDeleteMarker": {
        "type": "boolean",
        "nullable": true
      }
    },
    "required": [
      "ETag",
      "Key",
      "LastModified",
      "Size",
      "StorageClass"
    ],
    "additionalProperties": {}
  },
  "nullable": true
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getObject `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "key": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "key"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "string",
  "nullable": true
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` putObject `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "key": {
      "type": "string",
      "minLength": 1
    },
    "content": {
      "type": "string"
    },
    "contentType": {
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "content",
    "key"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean"
    },
    "status": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991
    },
    "etag": {
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "ok",
    "status"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` deleteObject `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "key": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "key"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "boolean"
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

### ` google-analytics ` — Google Analytics

Query Google Analytics (GA4) account summaries, property metadata and standard or realtime reports.

Aliases: ` ga `

Capabilities: ` google-analytics `

Examples:

List accessible accounts and properties.

```sh
woctl google-analytics status
```

Run a standard report.

```sh
woctl ga report run --property 123 --dimension date --metric activeUsers
```

Provider options schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "projectId": {
      "type": "string",
      "pattern": "^[A-Za-z0-9._:-]{1,128}$"
    },
    "accessToken": {
      "type": "string",
      "minLength": 1
    },
    "accessTokenEnv": {
      "type": "string",
      "pattern": "^[A-Za-z_][A-Za-z0-9_]*$"
    },
    "serviceAccountJson": {
      "type": "string",
      "minLength": 1
    },
    "serviceAccountJsonEnv": {
      "type": "string",
      "pattern": "^[A-Za-z_][A-Za-z0-9_]*$"
    },
    "dataBaseUrl": {
      "type": "string",
      "format": "uri"
    },
    "adminBaseUrl": {
      "type": "string",
      "format": "uri"
    },
    "timeoutMs": {
      "type": "integer",
      "minimum": 1,
      "maximum": 3600000
    },
    "maxResponseBytes": {
      "type": "integer",
      "minimum": 1,
      "maximum": 67108864
    }
  },
  "additionalProperties": false
}
```

#### Static tools

##### ` listAccountSummaries `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "pageSize": {
      "type": "integer",
      "minimum": 1,
      "maximum": 200,
      "nullable": true
    },
    "pageToken": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4096,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "accountSummaries": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "nullable": true
          },
          "account": {
            "type": "string",
            "nullable": true
          },
          "displayName": {
            "type": "string",
            "nullable": true
          },
          "propertySummaries": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "property": {
                  "type": "string",
                  "nullable": true
                },
                "displayName": {
                  "type": "string",
                  "nullable": true
                },
                "propertyType": {
                  "type": "string",
                  "nullable": true
                },
                "parent": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          }
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "nextPageToken": {
      "type": "string",
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getProperty `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "propertyId": {}
  },
  "required": [
    "propertyId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "nullable": true
    },
    "displayName": {
      "type": "string",
      "nullable": true
    },
    "propertyType": {
      "type": "string",
      "nullable": true
    },
    "parent": {
      "type": "string",
      "nullable": true
    },
    "timeZone": {
      "type": "string",
      "nullable": true
    },
    "currencyCode": {
      "type": "string",
      "nullable": true
    },
    "industryCategory": {
      "type": "string",
      "nullable": true
    },
    "createTime": {
      "type": "string",
      "nullable": true
    },
    "updateTime": {
      "type": "string",
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getMetadata `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "propertyId": {}
  },
  "required": [
    "propertyId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "nullable": true
    },
    "dimensions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "apiName": {
            "type": "string",
            "nullable": true
          },
          "uiName": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "category": {
            "type": "string",
            "nullable": true
          },
          "customDefinition": {
            "type": "boolean",
            "nullable": true
          }
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "metrics": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "apiName": {
            "type": "string",
            "nullable": true
          },
          "uiName": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "category": {
            "type": "string",
            "nullable": true
          },
          "customDefinition": {
            "type": "boolean",
            "nullable": true
          }
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "comparisons": {
      "type": "array",
      "items": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {}
      },
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` runReport `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "propertyId": {},
    "dateRanges": {
      "minItems": 1,
      "maxItems": 4,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "startDate": {
            "type": "string",
            "minLength": 1,
            "maxLength": 64
          },
          "endDate": {
            "type": "string",
            "minLength": 1,
            "maxLength": 64
          },
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256,
            "nullable": true
          }
        },
        "required": [
          "endDate",
          "startDate"
        ],
        "additionalProperties": false
      }
    },
    "dimensions": {
      "minItems": 1,
      "maxItems": 100,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 256
      }
    },
    "metrics": {
      "minItems": 1,
      "maxItems": 100,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 256
      }
    },
    "dimensionFilter": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "metricFilter": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "orderBys": {
      "type": "array",
      "items": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 250000,
      "nullable": true
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "currencyCode": {
      "type": "string",
      "minLength": 3,
      "maxLength": 3,
      "nullable": true
    },
    "keepEmptyRows": {
      "type": "boolean",
      "nullable": true
    },
    "returnPropertyQuota": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "dateRanges",
    "dimensions",
    "metrics",
    "propertyId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "dimensionHeaders": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "nullable": true
          },
          "type": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "metricHeaders": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "nullable": true
          },
          "type": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "rows": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "dimensionValues": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          },
          "metricValues": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          }
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "totals": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "dimensionValues": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          },
          "metricValues": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          }
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "maximums": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "dimensionValues": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          },
          "metricValues": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          }
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "minimums": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "dimensionValues": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          },
          "metricValues": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          }
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "rowCount": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "metadata": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "propertyQuota": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "kind": {
      "type": "string",
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` runRealtimeReport `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "propertyId": {},
    "dimensions": {
      "minItems": 1,
      "maxItems": 100,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 256
      }
    },
    "metrics": {
      "minItems": 1,
      "maxItems": 100,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 256
      }
    },
    "dimensionFilter": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "metricFilter": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "orderBys": {
      "type": "array",
      "items": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 250000,
      "nullable": true
    },
    "returnPropertyQuota": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "dimensions",
    "metrics",
    "propertyId"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "dimensionHeaders": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "nullable": true
          },
          "type": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "metricHeaders": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "nullable": true
          },
          "type": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "rows": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "dimensionValues": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          },
          "metricValues": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          }
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "totals": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "dimensionValues": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          },
          "metricValues": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          }
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "maximums": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "dimensionValues": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          },
          "metricValues": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          }
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "minimums": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "dimensionValues": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          },
          "metricValues": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "nullable": true
                }
              },
              "additionalProperties": {}
            },
            "nullable": true
          }
        },
        "additionalProperties": {}
      },
      "nullable": true
    },
    "rowCount": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "metadata": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "propertyQuota": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {},
      "nullable": true
    },
    "kind": {
      "type": "string",
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

### ` powerdns ` — PowerDNS

PowerDNS Authoritative HTTP API: portable DNS zones and RRSets plus servers, metadata, DNSSEC cryptokeys and TSIG keys.

Aliases: ` pdns `

Capabilities: ` dns `, ` powerdns `

Examples:

List zones.

```sh
woctl dns zone list
```

List RRSets of a zone.

```sh
woctl dns record list example.com
```

Provider options schema:

```json
{
  "type": "object",
  "properties": {
    "apiKey": {
      "type": "string",
      "description": "PowerDNS API key; prefer apiKeyEnv."
    },
    "apiKeyEnv": {
      "type": "string",
      "description": "Environment variable holding the API key."
    },
    "server": {
      "type": "string",
      "description": "Default server id (localhost)."
    },
    "timeoutMs": {
      "type": "integer",
      "minimum": 1
    },
    "maxResponseBytes": {
      "type": "integer",
      "minimum": 1
    }
  },
  "additionalProperties": false
}
```

#### Static tools

##### ` listZone `

List DNS zones.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "name": {
      "description": "Only return this zone.",
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "nullable": true
    },
    "cursor": {
      "description": "Opaque cursor from a previous nextCursor.",
      "type": "string",
      "minLength": 1,
      "maxLength": 4096,
      "nullable": true
    },
    "limit": {
      "description": "Maximum items per page; providers may return fewer.",
      "type": "integer",
      "minimum": 1,
      "maximum": 10000,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zones": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string",
            "description": "Canonical zone name with a trailing dot."
          },
          "kind": {
            "type": "string",
            "nullable": true
          },
          "serial": {
            "type": "number",
            "nullable": true
          },
          "metadata": {
            "type": "object",
            "propertyNames": {
              "type": "string"
            },
            "additionalProperties": {
              "type": [
                "object",
                "array",
                "string",
                "number",
                "boolean",
                "null"
              ]
            },
            "nullable": true
          }
        },
        "required": [
          "id",
          "name"
        ],
        "additionalProperties": false
      }
    },
    "nextCursor": {
      "description": "Present when more items are available; absent on the last page.",
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "zones"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getZone `

Read one DNS zone.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string",
      "description": "Canonical zone name with a trailing dot."
    },
    "kind": {
      "type": "string",
      "nullable": true
    },
    "serial": {
      "type": "number",
      "nullable": true
    },
    "metadata": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "type": [
          "object",
          "array",
          "string",
          "number",
          "boolean",
          "null"
        ]
      },
      "nullable": true
    }
  },
  "required": [
    "id",
    "name"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` createZone `

Create a DNS zone. dryRun previews the request.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "kind": {
      "description": "Supplier zone kind, for example Native for PowerDNS.",
      "type": "string",
      "minLength": 1,
      "maxLength": 64,
      "nullable": true
    },
    "nameservers": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 1024
      },
      "nullable": true
    },
    "dryRun": {
      "description": "Preview the change without applying it.",
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "zone": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string",
          "description": "Canonical zone name with a trailing dot."
        },
        "kind": {
          "type": "string",
          "nullable": true
        },
        "serial": {
          "type": "number",
          "nullable": true
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "rrset": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Canonical owner name with a trailing dot."
        },
        "type": {
          "type": "string"
        },
        "ttl": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "values": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records."
        },
        "metadata": {
          "description": "Supplier-specific fields, for example disabledValues or comments.",
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "name",
        "ttl",
        "type",
        "values"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "request": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false,
  "supportsDryRun": true
}
```

##### ` deleteZone `

Delete a DNS zone and all its records. dryRun previews the request.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "dryRun": {
      "description": "Preview the change without applying it.",
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "zone": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string",
          "description": "Canonical zone name with a trailing dot."
        },
        "kind": {
          "type": "string",
          "nullable": true
        },
        "serial": {
          "type": "number",
          "nullable": true
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "rrset": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Canonical owner name with a trailing dot."
        },
        "type": {
          "type": "string"
        },
        "ttl": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "values": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records."
        },
        "metadata": {
          "description": "Supplier-specific fields, for example disabledValues or comments.",
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "name",
        "ttl",
        "type",
        "values"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "request": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true,
  "supportsDryRun": true
}
```

##### ` listRecord `

List RRSets of a zone, optionally filtered by name and type.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Record name; @ is the apex and relative names resolve below the zone.",
      "nullable": true
    },
    "type": {
      "type": "string",
      "minLength": 1,
      "maxLength": 32,
      "pattern": "^[A-Za-z0-9-]+$",
      "description": "Record type, for example A, AAAA, CNAME or TXT.",
      "nullable": true
    },
    "cursor": {
      "description": "Opaque cursor from a previous nextCursor.",
      "type": "string",
      "minLength": 1,
      "maxLength": 4096,
      "nullable": true
    },
    "limit": {
      "description": "Maximum items per page; providers may return fewer.",
      "type": "integer",
      "minimum": 1,
      "maximum": 10000,
      "nullable": true
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "rrsets": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Canonical owner name with a trailing dot."
          },
          "type": {
            "type": "string"
          },
          "ttl": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "values": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records."
          },
          "metadata": {
            "description": "Supplier-specific fields, for example disabledValues or comments.",
            "type": "object",
            "propertyNames": {
              "type": "string"
            },
            "additionalProperties": {
              "type": [
                "object",
                "array",
                "string",
                "number",
                "boolean",
                "null"
              ]
            },
            "nullable": true
          }
        },
        "required": [
          "name",
          "ttl",
          "type",
          "values"
        ],
        "additionalProperties": false
      }
    },
    "nextCursor": {
      "description": "Present when more items are available; absent on the last page.",
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "rrsets"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` setRecord `

Replace the whole RRSet identified by name and type with the given enabled values (presentation format); other records, including disabled ones, are removed. dryRun previews the request.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Record name; @ is the apex and relative names resolve below the zone."
    },
    "type": {
      "type": "string",
      "minLength": 1,
      "maxLength": 32,
      "pattern": "^[A-Za-z0-9-]+$",
      "description": "Record type, for example A, AAAA, CNAME or TXT."
    },
    "ttl": {
      "type": "integer",
      "minimum": 0,
      "maximum": 2147483647
    },
    "values": {
      "minItems": 1,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 65535
      },
      "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records. All given values are enabled; records not listed (including disabled ones) are removed."
    },
    "dryRun": {
      "description": "Preview the change without applying it.",
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "name",
    "ttl",
    "type",
    "values",
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "zone": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string",
          "description": "Canonical zone name with a trailing dot."
        },
        "kind": {
          "type": "string",
          "nullable": true
        },
        "serial": {
          "type": "number",
          "nullable": true
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "rrset": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Canonical owner name with a trailing dot."
        },
        "type": {
          "type": "string"
        },
        "ttl": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "values": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records."
        },
        "metadata": {
          "description": "Supplier-specific fields, for example disabledValues or comments.",
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "name",
        "ttl",
        "type",
        "values"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "request": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true,
  "supportsDryRun": true
}
```

##### ` deleteRecord `

Delete the RRSet identified by name and type. dryRun previews the request.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Record name; @ is the apex and relative names resolve below the zone."
    },
    "type": {
      "type": "string",
      "minLength": 1,
      "maxLength": 32,
      "pattern": "^[A-Za-z0-9-]+$",
      "description": "Record type, for example A, AAAA, CNAME or TXT."
    },
    "dryRun": {
      "description": "Preview the change without applying it.",
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "name",
    "type",
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "zone": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string",
          "description": "Canonical zone name with a trailing dot."
        },
        "kind": {
          "type": "string",
          "nullable": true
        },
        "serial": {
          "type": "number",
          "nullable": true
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "rrset": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Canonical owner name with a trailing dot."
        },
        "type": {
          "type": "string"
        },
        "ttl": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "values": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records."
        },
        "metadata": {
          "description": "Supplier-specific fields, for example disabledValues or comments.",
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "name",
        "ttl",
        "type",
        "values"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "request": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true,
  "supportsDryRun": true
}
```

##### ` listServer `

List PowerDNS servers.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "nullable": true
      },
      "daemon_type": {
        "type": "string",
        "nullable": true
      },
      "version": {
        "type": "string",
        "nullable": true
      },
      "url": {
        "type": "string",
        "nullable": true
      }
    },
    "additionalProperties": {}
  }
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getServer `

Read one PowerDNS server.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "nullable": true
    },
    "daemon_type": {
      "type": "string",
      "nullable": true
    },
    "version": {
      "type": "string",
      "nullable": true
    },
    "url": {
      "type": "string",
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listServerStatistic `

Read server statistics.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {},
    "additionalProperties": {}
  }
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` searchData `

Search zones, records and comments.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "query": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Search term; * and ? are wildcards."
    },
    "max": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10000,
      "nullable": true
    },
    "objectType": {
      "type": "string",
      "enum": [
        "all",
        "zone",
        "record",
        "comment"
      ],
      "nullable": true
    }
  },
  "required": [
    "query"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {},
    "additionalProperties": {}
  }
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` createPowerDnsZone `

Create a zone with PowerDNS-specific fields (kind, masters, account, dnssec). dryRun previews the request locally.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "kind": {
      "description": "PowerDNS zone kind (default Native).",
      "type": "string",
      "enum": [
        "Native",
        "Master",
        "Slave",
        "Producer",
        "Consumer"
      ],
      "nullable": true
    },
    "masters": {
      "description": "Primary server addresses for Slave/Consumer zones, e.g. 192.0.2.53 or 192.0.2.53:5300.",
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 256
      },
      "nullable": true
    },
    "nameservers": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 1024
      },
      "nullable": true
    },
    "account": {
      "type": "string",
      "maxLength": 1024,
      "nullable": true
    },
    "dnssec": {
      "description": "Sign the zone on creation.",
      "type": "boolean",
      "nullable": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "anyOf": [
    {
      "type": "object",
      "properties": {
        "ok": {
          "type": "boolean",
          "const": true
        },
        "dryRun": {
          "type": "boolean",
          "nullable": true
        },
        "request": {
          "type": "object",
          "properties": {
            "method": {
              "type": "string"
            },
            "path": {
              "type": "string"
            },
            "body": {
              "type": [
                "object",
                "array",
                "string",
                "number",
                "boolean",
                "null"
              ],
              "nullable": true
            }
          },
          "required": [
            "method",
            "path"
          ],
          "additionalProperties": {},
          "nullable": true
        },
        "result": {
          "type": [
            "object",
            "array",
            "string",
            "number",
            "boolean",
            "null"
          ],
          "nullable": true
        }
      },
      "required": [
        "ok"
      ],
      "additionalProperties": {}
    },
    {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "nullable": true
        },
        "name": {
          "type": "string",
          "nullable": true
        },
        "kind": {
          "type": "string",
          "nullable": true
        }
      },
      "additionalProperties": {}
    }
  ]
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false,
  "supportsDryRun": true
}
```

##### ` notifyZone `

Send DNS NOTIFY to the zone secondaries.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "request": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "body": {
          "type": [
            "object",
            "array",
            "string",
            "number",
            "boolean",
            "null"
          ],
          "nullable": true
        }
      },
      "required": [
        "method",
        "path"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "result": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false
}
```

##### ` retrieveZoneAxfr `

Retrieve a secondary zone from its primary via AXFR.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "request": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "body": {
          "type": [
            "object",
            "array",
            "string",
            "number",
            "boolean",
            "null"
          ],
          "nullable": true
        }
      },
      "required": [
        "method",
        "path"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "result": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false
}
```

##### ` listMetadata `

List zone metadata.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "kind": {
        "type": "string",
        "nullable": true
      },
      "metadata": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "nullable": true
      }
    },
    "additionalProperties": {}
  }
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getMetadata `

Read one zone metadata kind.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "kind": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    }
  },
  "required": [
    "kind",
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "kind": {
      "type": "string",
      "nullable": true
    },
    "metadata": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` setMetadata `

Replace all values of one zone metadata kind.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "kind": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "values": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "kind",
    "values",
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "kind": {
      "type": "string",
      "nullable": true
    },
    "metadata": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` deleteMetadata `

Delete one zone metadata kind.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "kind": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    }
  },
  "required": [
    "kind",
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "request": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "body": {
          "type": [
            "object",
            "array",
            "string",
            "number",
            "boolean",
            "null"
          ],
          "nullable": true
        }
      },
      "required": [
        "method",
        "path"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "result": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` listCryptokey `

List DNSSEC cryptokeys of a zone.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "number",
        "nullable": true
      },
      "keytype": {
        "type": "string",
        "nullable": true
      },
      "active": {
        "type": "boolean",
        "nullable": true
      }
    },
    "additionalProperties": {}
  }
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getCryptokey `

Read one DNSSEC cryptokey.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "id": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    }
  },
  "required": [
    "id",
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "number",
      "nullable": true
    },
    "keytype": {
      "type": "string",
      "nullable": true
    },
    "active": {
      "type": "boolean",
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` createCryptokey `

Create or import a DNSSEC cryptokey.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "keytype": {
      "type": "string",
      "enum": [
        "ksk",
        "zsk",
        "csk"
      ],
      "nullable": true
    },
    "algorithm": {
      "type": "string",
      "minLength": 1,
      "maxLength": 64,
      "nullable": true
    },
    "bits": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991,
      "nullable": true
    },
    "active": {
      "type": "boolean",
      "nullable": true
    },
    "published": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "number",
      "nullable": true
    },
    "keytype": {
      "type": "string",
      "nullable": true
    },
    "active": {
      "type": "boolean",
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false
}
```

##### ` updateCryptokey `

Activate, deactivate, publish or unpublish a DNSSEC cryptokey.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "id": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "active": {
      "type": "boolean",
      "nullable": true
    },
    "published": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "id",
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "request": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "body": {
          "type": [
            "object",
            "array",
            "string",
            "number",
            "boolean",
            "null"
          ],
          "nullable": true
        }
      },
      "required": [
        "method",
        "path"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "result": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` deleteCryptokey `

Delete a DNSSEC cryptokey.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "id": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    }
  },
  "required": [
    "id",
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "request": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "body": {
          "type": [
            "object",
            "array",
            "string",
            "number",
            "boolean",
            "null"
          ],
          "nullable": true
        }
      },
      "required": [
        "method",
        "path"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "result": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` listTsigKey `

List TSIG keys without secrets.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "nullable": true
      },
      "name": {
        "type": "string",
        "nullable": true
      },
      "algorithm": {
        "type": "string",
        "nullable": true
      },
      "key": {
        "type": "string",
        "nullable": true
      }
    },
    "additionalProperties": {}
  }
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getTsigKey `

Read one TSIG key including its secret.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "id": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "nullable": true
    },
    "name": {
      "type": "string",
      "nullable": true
    },
    "algorithm": {
      "type": "string",
      "nullable": true
    },
    "key": {
      "type": "string",
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` createTsigKey `

Create a TSIG key; the response contains the secret.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "algorithm": {
      "type": "string",
      "minLength": 1,
      "maxLength": 64,
      "nullable": true
    },
    "key": {
      "description": "Base64 secret; PowerDNS generates one when omitted.",
      "type": "string",
      "minLength": 1,
      "maxLength": 4096,
      "nullable": true
    }
  },
  "required": [
    "name"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "nullable": true
    },
    "name": {
      "type": "string",
      "nullable": true
    },
    "algorithm": {
      "type": "string",
      "nullable": true
    },
    "key": {
      "type": "string",
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false
}
```

##### ` updateTsigKey `

Rename a TSIG key or replace its algorithm or secret.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "id": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "nullable": true
    },
    "algorithm": {
      "type": "string",
      "minLength": 1,
      "maxLength": 64,
      "nullable": true
    },
    "key": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4096,
      "nullable": true
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "nullable": true
    },
    "name": {
      "type": "string",
      "nullable": true
    },
    "algorithm": {
      "type": "string",
      "nullable": true
    },
    "key": {
      "type": "string",
      "nullable": true
    }
  },
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` deleteTsigKey `

Delete a TSIG key.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "server": {
      "description": "Server id; defaults to the configured server (usually localhost).",
      "type": "string",
      "minLength": 1,
      "maxLength": 512,
      "nullable": true
    },
    "id": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "request": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "body": {
          "type": [
            "object",
            "array",
            "string",
            "number",
            "boolean",
            "null"
          ],
          "nullable": true
        }
      },
      "required": [
        "method",
        "path"
      ],
      "additionalProperties": {},
      "nullable": true
    },
    "result": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` request `

Call a PowerDNS API path relative to /api/v1. Non-read methods or a body require a writable service.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "minLength": 1,
      "maxLength": 2048,
      "description": "Path relative to /api/v1, for example /servers/localhost/zones."
    },
    "method": {
      "type": "string",
      "enum": [
        "GET",
        "HEAD",
        "OPTIONS",
        "POST",
        "PUT",
        "PATCH",
        "DELETE"
      ],
      "nullable": true
    },
    "query": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "anyOf": [
          {
            "type": [
              "string",
              "number",
              "boolean"
            ]
          },
          {
            "type": "array",
            "items": {
              "type": [
                "string",
                "number",
                "boolean"
              ]
            }
          }
        ]
      },
      "nullable": true
    },
    "body": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "path"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema"
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

### ` cloudflare ` — Cloudflare DNS

Cloudflare DNS zones and records as portable RRSets; record writes use one atomic batch request.

Aliases: ` cf `

Capabilities: ` dns `

Examples:

List zones.

```sh
woctl dns zone list --service cf
```

Preview an RRSet change.

```sh
woctl dns record set example.com www A 192.0.2.1 --dry-run
```

Provider options schema:

```json
{
  "type": "object",
  "properties": {
    "apiToken": {
      "type": "string",
      "description": "Cloudflare API token (Bearer); prefer apiTokenEnv."
    },
    "apiTokenEnv": {
      "type": "string",
      "description": "Environment variable holding the API token."
    },
    "accountId": {
      "type": "string",
      "description": "Account id used when creating zones."
    },
    "timeoutMs": {
      "type": "integer",
      "minimum": 1,
      "description": "Deadline of one whole DNS operation (default 30000)."
    },
    "maxBatchChanges": {
      "type": "integer",
      "minimum": 1,
      "description": "Largest batch one setRecord/deleteRecord may send (default 200, the Cloudflare free plan limit)."
    }
  },
  "additionalProperties": false
}
```

#### Static tools

##### ` listZone `

List DNS zones.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "name": {
      "description": "Only return this zone.",
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "nullable": true
    },
    "cursor": {
      "description": "Opaque cursor from a previous nextCursor.",
      "type": "string",
      "minLength": 1,
      "maxLength": 4096,
      "nullable": true
    },
    "limit": {
      "description": "Maximum items per page; providers may return fewer.",
      "type": "integer",
      "minimum": 1,
      "maximum": 10000,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zones": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string",
            "description": "Canonical zone name with a trailing dot."
          },
          "kind": {
            "type": "string",
            "nullable": true
          },
          "serial": {
            "type": "number",
            "nullable": true
          },
          "metadata": {
            "type": "object",
            "propertyNames": {
              "type": "string"
            },
            "additionalProperties": {
              "type": [
                "object",
                "array",
                "string",
                "number",
                "boolean",
                "null"
              ]
            },
            "nullable": true
          }
        },
        "required": [
          "id",
          "name"
        ],
        "additionalProperties": false
      }
    },
    "nextCursor": {
      "description": "Present when more items are available; absent on the last page.",
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "zones"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getZone `

Read one DNS zone.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string",
      "description": "Canonical zone name with a trailing dot."
    },
    "kind": {
      "type": "string",
      "nullable": true
    },
    "serial": {
      "type": "number",
      "nullable": true
    },
    "metadata": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "type": [
          "object",
          "array",
          "string",
          "number",
          "boolean",
          "null"
        ]
      },
      "nullable": true
    }
  },
  "required": [
    "id",
    "name"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` createZone `

Create a DNS zone. dryRun previews the request.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "kind": {
      "description": "Supplier zone kind, for example Native for PowerDNS.",
      "type": "string",
      "minLength": 1,
      "maxLength": 64,
      "nullable": true
    },
    "nameservers": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 1024
      },
      "nullable": true
    },
    "dryRun": {
      "description": "Preview the change without applying it.",
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "zone": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string",
          "description": "Canonical zone name with a trailing dot."
        },
        "kind": {
          "type": "string",
          "nullable": true
        },
        "serial": {
          "type": "number",
          "nullable": true
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "rrset": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Canonical owner name with a trailing dot."
        },
        "type": {
          "type": "string"
        },
        "ttl": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "values": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records."
        },
        "metadata": {
          "description": "Supplier-specific fields, for example disabledValues or comments.",
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "name",
        "ttl",
        "type",
        "values"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "request": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false,
  "supportsDryRun": true
}
```

##### ` deleteZone `

Delete a DNS zone and all its records. dryRun previews the request.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "dryRun": {
      "description": "Preview the change without applying it.",
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "zone": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string",
          "description": "Canonical zone name with a trailing dot."
        },
        "kind": {
          "type": "string",
          "nullable": true
        },
        "serial": {
          "type": "number",
          "nullable": true
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "rrset": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Canonical owner name with a trailing dot."
        },
        "type": {
          "type": "string"
        },
        "ttl": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "values": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records."
        },
        "metadata": {
          "description": "Supplier-specific fields, for example disabledValues or comments.",
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "name",
        "ttl",
        "type",
        "values"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "request": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true,
  "supportsDryRun": true
}
```

##### ` listRecord `

List RRSets of a zone, optionally filtered by name and type.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Record name; @ is the apex and relative names resolve below the zone.",
      "nullable": true
    },
    "type": {
      "type": "string",
      "minLength": 1,
      "maxLength": 32,
      "pattern": "^[A-Za-z0-9-]+$",
      "description": "Record type, for example A, AAAA, CNAME or TXT.",
      "nullable": true
    },
    "cursor": {
      "description": "Opaque cursor from a previous nextCursor.",
      "type": "string",
      "minLength": 1,
      "maxLength": 4096,
      "nullable": true
    },
    "limit": {
      "description": "Maximum items per page; providers may return fewer.",
      "type": "integer",
      "minimum": 1,
      "maximum": 10000,
      "nullable": true
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "rrsets": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Canonical owner name with a trailing dot."
          },
          "type": {
            "type": "string"
          },
          "ttl": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "values": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records."
          },
          "metadata": {
            "description": "Supplier-specific fields, for example disabledValues or comments.",
            "type": "object",
            "propertyNames": {
              "type": "string"
            },
            "additionalProperties": {
              "type": [
                "object",
                "array",
                "string",
                "number",
                "boolean",
                "null"
              ]
            },
            "nullable": true
          }
        },
        "required": [
          "name",
          "ttl",
          "type",
          "values"
        ],
        "additionalProperties": false
      }
    },
    "nextCursor": {
      "description": "Present when more items are available; absent on the last page.",
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "rrsets"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` setRecord `

Replace the whole RRSet identified by name and type with the given enabled values (presentation format); other records, including disabled ones, are removed. dryRun previews the request.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Record name; @ is the apex and relative names resolve below the zone."
    },
    "type": {
      "type": "string",
      "minLength": 1,
      "maxLength": 32,
      "pattern": "^[A-Za-z0-9-]+$",
      "description": "Record type, for example A, AAAA, CNAME or TXT."
    },
    "ttl": {
      "type": "integer",
      "minimum": 0,
      "maximum": 2147483647
    },
    "values": {
      "minItems": 1,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 65535
      },
      "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records. All given values are enabled; records not listed (including disabled ones) are removed."
    },
    "dryRun": {
      "description": "Preview the change without applying it.",
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "name",
    "ttl",
    "type",
    "values",
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "zone": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string",
          "description": "Canonical zone name with a trailing dot."
        },
        "kind": {
          "type": "string",
          "nullable": true
        },
        "serial": {
          "type": "number",
          "nullable": true
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "rrset": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Canonical owner name with a trailing dot."
        },
        "type": {
          "type": "string"
        },
        "ttl": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "values": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records."
        },
        "metadata": {
          "description": "Supplier-specific fields, for example disabledValues or comments.",
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "name",
        "ttl",
        "type",
        "values"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "request": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true,
  "supportsDryRun": true
}
```

##### ` deleteRecord `

Delete the RRSet identified by name and type. dryRun previews the request.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Record name; @ is the apex and relative names resolve below the zone."
    },
    "type": {
      "type": "string",
      "minLength": 1,
      "maxLength": 32,
      "pattern": "^[A-Za-z0-9-]+$",
      "description": "Record type, for example A, AAAA, CNAME or TXT."
    },
    "dryRun": {
      "description": "Preview the change without applying it.",
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "name",
    "type",
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "zone": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string",
          "description": "Canonical zone name with a trailing dot."
        },
        "kind": {
          "type": "string",
          "nullable": true
        },
        "serial": {
          "type": "number",
          "nullable": true
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "rrset": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Canonical owner name with a trailing dot."
        },
        "type": {
          "type": "string"
        },
        "ttl": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "values": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records."
        },
        "metadata": {
          "description": "Supplier-specific fields, for example disabledValues or comments.",
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "name",
        "ttl",
        "type",
        "values"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "request": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true,
  "supportsDryRun": true
}
```

### ` alidns ` — Alibaba Cloud DNS

Alibaba Cloud DNS (Alidns) domains and records as portable RRSets; record writes are sequential, not atomic.

Aliases: ` aliyun-dns `

Capabilities: ` dns `

Examples:

List domains.

```sh
woctl dns zone list --service alidns
```

Preview an RRSet change.

```sh
woctl dns record set example.com @ MX "10 mx.example.com." --dry-run
```

Provider options schema:

```json
{
  "type": "object",
  "properties": {
    "accessKeyId": {
      "type": "string",
      "description": "AccessKey id; prefer accessKeyIdEnv."
    },
    "accessKeyIdEnv": {
      "type": "string",
      "description": "Environment variable holding the AccessKey id."
    },
    "accessKeySecret": {
      "type": "string",
      "description": "AccessKey secret; prefer accessKeySecretEnv."
    },
    "accessKeySecretEnv": {
      "type": "string",
      "description": "Environment variable holding the AccessKey secret."
    },
    "endpoint": {
      "type": "string",
      "description": "API host (default alidns.aliyuncs.com)."
    },
    "timeoutMs": {
      "type": "integer",
      "minimum": 1,
      "description": "Deadline of one whole DNS operation (default 30000)."
    }
  },
  "additionalProperties": false
}
```

#### Static tools

##### ` listZone `

List DNS zones.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {
    "name": {
      "description": "Only return this zone.",
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "nullable": true
    },
    "cursor": {
      "description": "Opaque cursor from a previous nextCursor.",
      "type": "string",
      "minLength": 1,
      "maxLength": 4096,
      "nullable": true
    },
    "limit": {
      "description": "Maximum items per page; providers may return fewer.",
      "type": "integer",
      "minimum": 1,
      "maximum": 10000,
      "nullable": true
    }
  },
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zones": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string",
            "description": "Canonical zone name with a trailing dot."
          },
          "kind": {
            "type": "string",
            "nullable": true
          },
          "serial": {
            "type": "number",
            "nullable": true
          },
          "metadata": {
            "type": "object",
            "propertyNames": {
              "type": "string"
            },
            "additionalProperties": {
              "type": [
                "object",
                "array",
                "string",
                "number",
                "boolean",
                "null"
              ]
            },
            "nullable": true
          }
        },
        "required": [
          "id",
          "name"
        ],
        "additionalProperties": false
      }
    },
    "nextCursor": {
      "description": "Present when more items are available; absent on the last page.",
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "zones"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getZone `

Read one DNS zone.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string",
      "description": "Canonical zone name with a trailing dot."
    },
    "kind": {
      "type": "string",
      "nullable": true
    },
    "serial": {
      "type": "number",
      "nullable": true
    },
    "metadata": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "type": [
          "object",
          "array",
          "string",
          "number",
          "boolean",
          "null"
        ]
      },
      "nullable": true
    }
  },
  "required": [
    "id",
    "name"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` createZone `

Create a DNS zone. dryRun previews the request.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "kind": {
      "description": "Supplier zone kind, for example Native for PowerDNS.",
      "type": "string",
      "minLength": 1,
      "maxLength": 64,
      "nullable": true
    },
    "nameservers": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 1024
      },
      "nullable": true
    },
    "dryRun": {
      "description": "Preview the change without applying it.",
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "zone": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string",
          "description": "Canonical zone name with a trailing dot."
        },
        "kind": {
          "type": "string",
          "nullable": true
        },
        "serial": {
          "type": "number",
          "nullable": true
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "rrset": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Canonical owner name with a trailing dot."
        },
        "type": {
          "type": "string"
        },
        "ttl": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "values": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records."
        },
        "metadata": {
          "description": "Supplier-specific fields, for example disabledValues or comments.",
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "name",
        "ttl",
        "type",
        "values"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "request": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false,
  "supportsDryRun": true
}
```

##### ` deleteZone `

Delete a DNS zone and all its records. dryRun previews the request.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "dryRun": {
      "description": "Preview the change without applying it.",
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "zone": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string",
          "description": "Canonical zone name with a trailing dot."
        },
        "kind": {
          "type": "string",
          "nullable": true
        },
        "serial": {
          "type": "number",
          "nullable": true
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "rrset": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Canonical owner name with a trailing dot."
        },
        "type": {
          "type": "string"
        },
        "ttl": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "values": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records."
        },
        "metadata": {
          "description": "Supplier-specific fields, for example disabledValues or comments.",
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "name",
        "ttl",
        "type",
        "values"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "request": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true,
  "supportsDryRun": true
}
```

##### ` listRecord `

List RRSets of a zone, optionally filtered by name and type.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Record name; @ is the apex and relative names resolve below the zone.",
      "nullable": true
    },
    "type": {
      "type": "string",
      "minLength": 1,
      "maxLength": 32,
      "pattern": "^[A-Za-z0-9-]+$",
      "description": "Record type, for example A, AAAA, CNAME or TXT.",
      "nullable": true
    },
    "cursor": {
      "description": "Opaque cursor from a previous nextCursor.",
      "type": "string",
      "minLength": 1,
      "maxLength": 4096,
      "nullable": true
    },
    "limit": {
      "description": "Maximum items per page; providers may return fewer.",
      "type": "integer",
      "minimum": 1,
      "maximum": 10000,
      "nullable": true
    }
  },
  "required": [
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "rrsets": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Canonical owner name with a trailing dot."
          },
          "type": {
            "type": "string"
          },
          "ttl": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "values": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records."
          },
          "metadata": {
            "description": "Supplier-specific fields, for example disabledValues or comments.",
            "type": "object",
            "propertyNames": {
              "type": "string"
            },
            "additionalProperties": {
              "type": [
                "object",
                "array",
                "string",
                "number",
                "boolean",
                "null"
              ]
            },
            "nullable": true
          }
        },
        "required": [
          "name",
          "ttl",
          "type",
          "values"
        ],
        "additionalProperties": false
      }
    },
    "nextCursor": {
      "description": "Present when more items are available; absent on the last page.",
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "rrsets"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` setRecord `

Replace the whole RRSet identified by name and type with the given enabled values (presentation format); other records, including disabled ones, are removed. dryRun previews the request.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Record name; @ is the apex and relative names resolve below the zone."
    },
    "type": {
      "type": "string",
      "minLength": 1,
      "maxLength": 32,
      "pattern": "^[A-Za-z0-9-]+$",
      "description": "Record type, for example A, AAAA, CNAME or TXT."
    },
    "ttl": {
      "type": "integer",
      "minimum": 0,
      "maximum": 2147483647
    },
    "values": {
      "minItems": 1,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 65535
      },
      "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records. All given values are enabled; records not listed (including disabled ones) are removed."
    },
    "dryRun": {
      "description": "Preview the change without applying it.",
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "name",
    "ttl",
    "type",
    "values",
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "zone": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string",
          "description": "Canonical zone name with a trailing dot."
        },
        "kind": {
          "type": "string",
          "nullable": true
        },
        "serial": {
          "type": "number",
          "nullable": true
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "rrset": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Canonical owner name with a trailing dot."
        },
        "type": {
          "type": "string"
        },
        "ttl": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "values": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records."
        },
        "metadata": {
          "description": "Supplier-specific fields, for example disabledValues or comments.",
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "name",
        "ttl",
        "type",
        "values"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "request": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true,
  "supportsDryRun": true
}
```

##### ` deleteRecord `

Delete the RRSet identified by name and type. dryRun previews the request.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "zone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Zone name; a trailing dot is added when missing. \".\" is the root zone."
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1024,
      "description": "Record name; @ is the apex and relative names resolve below the zone."
    },
    "type": {
      "type": "string",
      "minLength": 1,
      "maxLength": 32,
      "pattern": "^[A-Za-z0-9-]+$",
      "description": "Record type, for example A, AAAA, CNAME or TXT."
    },
    "dryRun": {
      "description": "Preview the change without applying it.",
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "name",
    "type",
    "zone"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "ok": {
      "type": "boolean",
      "const": true
    },
    "dryRun": {
      "type": "boolean",
      "nullable": true
    },
    "zone": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string",
          "description": "Canonical zone name with a trailing dot."
        },
        "kind": {
          "type": "string",
          "nullable": true
        },
        "serial": {
          "type": "number",
          "nullable": true
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "rrset": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Canonical owner name with a trailing dot."
        },
        "type": {
          "type": "string"
        },
        "ttl": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "values": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "RDATA in RFC 1035 presentation (zone-file) format: TXT quoted (\"a\" \"b\"), MX \"10 mx.example.com.\", CNAME/NS targets absolute with a trailing dot. Only enabled records."
        },
        "metadata": {
          "description": "Supplier-specific fields, for example disabledValues or comments.",
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "nullable": true
        }
      },
      "required": [
        "name",
        "ttl",
        "type",
        "values"
      ],
      "additionalProperties": false,
      "nullable": true
    },
    "request": {
      "type": [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null"
      ],
      "nullable": true
    }
  },
  "required": [
    "ok"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true,
  "supportsDryRun": true
}
```

### ` fs ` — Filesystem

List, read, write, move, copy and remove files on local, S3 or WebDAV storage selected by URL.

Aliases: ` file `, ` webdav `, ` dav `

Capabilities: ` fs `

Examples:

List a directory.

```sh
woctl fs list /docs
```

Read a file as text.

```sh
woctl fs read /docs/readme.txt
```

Provider options schema:

```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string"
    },
    "usernameEnv": {
      "type": "string"
    },
    "passwordEnv": {
      "type": "string"
    },
    "tokenEnv": {
      "type": "string"
    },
    "region": {
      "type": "string"
    }
  },
  "required": [
    "url"
  ],
  "additionalProperties": false
}
```

#### Static tools

##### ` list `

List a directory, optionally recursively, bounded by maxEntries.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {
    "path": "/",
    "maxEntries": 1000
  },
  "type": "object",
  "properties": {
    "path": {
      "default": "/",
      "type": "string",
      "minLength": 1,
      "maxLength": 4096
    },
    "recursive": {
      "type": "boolean",
      "nullable": true
    },
    "depth": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 64,
      "nullable": true
    },
    "glob": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "kind": {
      "type": "string",
      "enum": [
        "file",
        "directory"
      ],
      "nullable": true
    },
    "hidden": {
      "type": "boolean",
      "nullable": true
    },
    "maxEntries": {
      "default": 1000,
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 10000
    }
  },
  "required": [
    "maxEntries",
    "path"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "kind": {
        "type": "string",
        "enum": [
          "file",
          "directory"
        ]
      },
      "size": {
        "type": "integer",
        "minimum": 0,
        "maximum": 9007199254740991
      },
      "mtime": {
        "type": "string",
        "format": "date-time",
        "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
        "nullable": true
      },
      "etag": {
        "type": "string",
        "nullable": true
      },
      "contentType": {
        "type": "string",
        "nullable": true
      }
    },
    "required": [
      "kind",
      "name",
      "path",
      "size"
    ],
    "additionalProperties": false
  }
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` stat `

Get metadata for a path; null when it does not exist.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4096
    }
  },
  "required": [
    "path"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "path": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "kind": {
      "type": "string",
      "enum": [
        "file",
        "directory"
      ]
    },
    "size": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "mtime": {
      "type": "string",
      "format": "date-time",
      "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
      "nullable": true
    },
    "etag": {
      "type": "string",
      "nullable": true
    },
    "contentType": {
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "kind",
    "name",
    "path",
    "size"
  ],
  "additionalProperties": false,
  "nullable": true
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` read `

Read a file as UTF-8 text or Base64, bounded by maxBytes.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4096
    },
    "encoding": {
      "default": "utf8",
      "type": "string",
      "enum": [
        "utf8",
        "base64"
      ]
    },
    "maxBytes": {
      "default": 1048576,
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 16777216
    }
  },
  "required": [
    "encoding",
    "maxBytes",
    "path"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "path": {
      "type": "string"
    },
    "encoding": {
      "type": "string",
      "enum": [
        "utf8",
        "base64"
      ]
    },
    "content": {
      "type": "string"
    },
    "size": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "truncated": {
      "type": "boolean"
    }
  },
  "required": [
    "content",
    "encoding",
    "path",
    "size",
    "truncated"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` write `

Write a file from UTF-8 text or Base64 content.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4096
    },
    "content": {
      "type": "string",
      "maxLength": 22369624
    },
    "encoding": {
      "default": "utf8",
      "type": "string",
      "enum": [
        "utf8",
        "base64"
      ]
    },
    "overwrite": {
      "default": false,
      "type": "boolean"
    }
  },
  "required": [
    "content",
    "encoding",
    "overwrite",
    "path"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "path": {
      "type": "string"
    },
    "size": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    }
  },
  "required": [
    "path",
    "size"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` mkdir `

Create a directory.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4096
    },
    "recursive": {
      "default": false,
      "type": "boolean"
    }
  },
  "required": [
    "path",
    "recursive"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "path": {
      "type": "string"
    }
  },
  "required": [
    "path"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": false
}
```

##### ` rm `

Remove a file or directory.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4096
    },
    "recursive": {
      "default": false,
      "type": "boolean"
    },
    "force": {
      "default": false,
      "type": "boolean"
    }
  },
  "required": [
    "force",
    "path",
    "recursive"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "path": {
      "type": "string"
    }
  },
  "required": [
    "path"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` mv `

Move or rename a file or directory.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "from": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4096
    },
    "to": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4096
    },
    "overwrite": {
      "default": false,
      "type": "boolean"
    }
  },
  "required": [
    "from",
    "overwrite",
    "to"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "from": {
      "type": "string"
    },
    "to": {
      "type": "string"
    }
  },
  "required": [
    "from",
    "to"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

##### ` cp `

Copy a file or directory.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "from": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4096
    },
    "to": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4096
    },
    "overwrite": {
      "default": false,
      "type": "boolean"
    }
  },
  "required": [
    "from",
    "overwrite",
    "to"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "from": {
      "type": "string"
    },
    "to": {
      "type": "string"
    }
  },
  "required": [
    "from",
    "to"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": false,
  "destructiveHint": true
}
```

### ` system ` — System

Offline runtime information and echo operations

Capabilities: ` system `

Provider options schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

#### Static tools

##### ` info `

Runtime environment information

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "default": {},
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "application": {
      "type": "string"
    },
    "version": {
      "type": "string"
    }
  },
  "required": [
    "application",
    "version"
  ],
  "additionalProperties": {}
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` echo `

Return the input text

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "text": {
      "type": "string"
    }
  },
  "required": [
    "text"
  ],
  "additionalProperties": false
}
```

outputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "text": {
      "type": "string"
    }
  },
  "required": [
    "text"
  ],
  "additionalProperties": false
}
```

annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false
}
```

### ` http ` — HTTP service runtime

Connect to a remote schema/call service; tools are discovered at runtime

Capabilities: ` http `

Provider options schema:

```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```
