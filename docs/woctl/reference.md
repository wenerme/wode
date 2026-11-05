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
- ` grafana ` — Check Grafana health and call the authenticated Grafana HTTP API
  - ` status ` — Check Grafana health
  - ` whoami ` — Read the current authenticated Grafana user
  - ` api ` — Call a Grafana API path; non-read methods require --yes and a writable service
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
- ` lark ` — Send Lark/Feishu messages and call the Feishu OpenAPI
  - ` send ` — Send a Lark/Feishu message via app credential; requires --yes and a writable service
  - ` webhook ` — Send a message to a Lark/Feishu group custom bot webhook configured on the service; requires --yes and a writable service
  - ` api ` — Call the Feishu OpenAPI; requires --yes and a writable service
- ` cls ` — Query Tencent Cloud Log Service (CLS) logs and list log topics
  - ` query ` — Search one or more CLS log topics
  - ` topics ` — List CLS log topics
- ` telegram ` — Check the configured Telegram bot and call the Telegram Bot API
  - ` status ` — Read the configured Telegram bot identity (getMe)
  - ` send ` — Send a Telegram message; requires --yes and a writable service
  - ` api ` — Call a Telegram Bot API method; non-read methods require --yes and a writable service
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

Check Grafana health and call the authenticated Grafana HTTP API

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

### ` lark `

Send Lark/Feishu messages and call the Feishu OpenAPI

Usage:

```text
woctl lark
```

Aliases: ` feishu `

Availability: configured service with provider ` lark `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --service ` | string | Select a service by name |  |
| ` --list-services ` | boolean | List available services of the same type in the current context |  |
| ` --output-file ` | string | Write the formatted result to a file; - writes to stdout |  |

Examples:

Send a message via app credential.

```sh
woctl lark send --to ou_xxx --text "hello" --yes
```

Send a message to the configured group webhook.

```sh
woctl lark webhook --text "hello" --yes
```

### ` lark send `

Send a Lark/Feishu message via app credential; requires --yes and a writable service

Usage:

```text
woctl lark send
```

Availability: configured service with provider ` lark `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --to ` | string | Target open_id / user_id / chat_id / email |  |
| ` --text ` | string | Message text, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm sending the message |  |

Examples:

```sh
woctl lark send --to ou_xxx --text "hello" --yes
```

### ` lark webhook `

Send a message to a Lark/Feishu group custom bot webhook configured on the service; requires --yes and a writable service

Usage:

```text
woctl lark webhook
```

Availability: configured service with provider ` lark `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --text ` | string | Plain text message, @file or - for stdin |  |
| ` --markdown ` | string | Markdown card message, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm sending the message |  |

Examples:

```sh
woctl lark webhook --text "hello" --yes
```

### ` lark api `

Call the Feishu OpenAPI; requires --yes and a writable service

Usage:

```text
woctl lark api <path>
```

Availability: configured service with provider ` lark `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --method `, ` -X ` | string | HTTP method; GET by default, POST with --body |  |
| ` --body ` | string | JSON body, @file or - for stdin |  |
| ` --yes ` | boolean | Confirm a write request |  |

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

Check the configured Telegram bot and call the Telegram Bot API

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

Examples:

Check the configured bot identity

```sh
woctl telegram status
```

Send a message

```sh
woctl telegram send --chat 123456789 --text "hello" --yes
```

### ` telegram status `

Read the configured Telegram bot identity (getMe)

Usage:

```text
woctl telegram status
```

Availability: configured service with provider ` telegram `.

### ` telegram send `

Send a Telegram message; requires --yes and a writable service

Usage:

```text
woctl telegram send
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --chat `, ` --chat-id ` | string | Target chat id |  |
| ` --text ` | string | Message text, @file or - for stdin |  |
| ` --parse-mode ` | string | Telegram parse mode (e.g. MarkdownV2, HTML) |  |
| ` --silent ` | boolean | Send without a notification sound |  |
| ` --reply-to ` | string | Message id to reply to |  |
| ` --yes ` | boolean | Confirm sending the message |  |

Examples:

```sh
woctl telegram send --chat 123456789 --text "hello" --yes
```

### ` telegram api `

Call a Telegram Bot API method; non-read methods require --yes and a writable service

Usage:

```text
woctl telegram api <method>
```

Availability: configured service with provider ` telegram `.

Options:

| Option | Type | Description | Default |
| --- | --- | --- | --- |
| ` --params ` | string, repeatable | Request parameter key=value; repeatable |  |
| ` --yes ` | boolean | Confirm a write request |  |

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
      "nullable": true
    },
    "to": {
      "anyOf": [
        {
          "type": "string"
        },
        {}
      ],
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
      "nullable": true
    },
    "to": {
      "anyOf": [
        {
          "type": "string"
        },
        {}
      ],
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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

inputType:

```typescript
Record<string, never>
```

outputType:

```typescript
{ ok: boolean; durationMs: number; version?: string }
```

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
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
      "type": "string"
    }
  },
  "required": [
    "ok",
    "durationMs"
  ],
  "additionalProperties": false
}
```

##### ` query `

Execute one read-only SQL statement with bound parameters and bounded pagination

inputType:

```typescript
{ statement: string; params?: readonly unknown[]; limit?: number; offset?: number }
```

outputType:

```typescript
{ columns: string[]; rows: Record<string, unknown>[]; durationMs: number; affectedRows?: number | string; lastInsertId?: string; warnings?: string[] }
```

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
      "type": "array",
      "items": {
        "$ref": "#/$defs/__schema0"
      }
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    }
  },
  "required": [
    "statement"
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
      "type": [
        "number",
        "string"
      ]
    },
    "lastInsertId": {
      "type": "string"
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "columns",
    "rows",
    "durationMs"
  ],
  "additionalProperties": false
}
```

##### ` exec `

Execute one SQL statement with bound parameters; requires a writable service

inputType:

```typescript
{ statement: string; params?: readonly unknown[] }
```

outputType:

```typescript
{ columns: string[]; rows: Record<string, unknown>[]; durationMs: number; affectedRows?: number | string; lastInsertId?: string; warnings?: string[] }
```

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
      "type": "array",
      "items": {
        "$ref": "#/$defs/__schema0"
      }
    }
  },
  "required": [
    "statement"
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
      "type": [
        "number",
        "string"
      ]
    },
    "lastInsertId": {
      "type": "string"
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "columns",
    "rows",
    "durationMs"
  ],
  "additionalProperties": false
}
```

##### ` listObject `

List database objects under an optional parent with search and bounded pagination

inputType:

```typescript
{ parent?: { catalog?: string; schema?: string; name?: string; type?: string }; search?: string; limit?: number; offset?: number }
```

outputType:

```typescript
{ catalog?: string; schema?: string; name: string; type: string; comment?: string; attributes?: Record<string, unknown> }[]
```

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "parent": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1
        },
        "schema": {
          "type": "string"
        },
        "catalog": {
          "type": "string"
        },
        "type": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "search": {
      "type": "string"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
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
        "type": "string"
      },
      "schema": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "type": {
        "type": "string"
      },
      "comment": {
        "type": "string"
      },
      "attributes": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {}
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

inputType:

```typescript
{ object: { catalog?: string; schema?: string; name?: string; type?: string } & { name: string } }
```

outputType:

```typescript
{ object: { catalog?: string; schema?: string; name: string; type: string; comment?: string; attributes?: Record<string, unknown> }; children?: { catalog?: string; schema?: string; name: string; type: string; comment?: string; attributes?: Record<string, unknown> }[]; attributes?: Record<string, unknown>; durationMs?: number }
```

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
          "type": "string"
        },
        "catalog": {
          "type": "string"
        },
        "type": {
          "type": "string"
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
          "type": "string"
        },
        "schema": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "type": {
          "type": "string"
        },
        "comment": {
          "type": "string"
        },
        "attributes": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {}
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
            "type": "string"
          },
          "schema": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "comment": {
            "type": "string"
          },
          "attributes": {
            "type": "object",
            "propertyNames": {
              "type": "string"
            },
            "additionalProperties": {}
          }
        },
        "required": [
          "name",
          "type"
        ],
        "additionalProperties": false
      }
    },
    "attributes": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {}
    },
    "durationMs": {
      "type": "number",
      "minimum": 0
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
      "type": "string"
    }
  },
  "required": [
    "ok",
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
      "type": "array",
      "items": {
        "$ref": "#/$defs/__schema0"
      }
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    }
  },
  "required": [
    "statement"
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
      "type": [
        "number",
        "string"
      ]
    },
    "lastInsertId": {
      "type": "string"
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "columns",
    "rows",
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
      "type": "array",
      "items": {
        "$ref": "#/$defs/__schema0"
      }
    }
  },
  "required": [
    "statement"
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
      "type": [
        "number",
        "string"
      ]
    },
    "lastInsertId": {
      "type": "string"
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "columns",
    "rows",
    "durationMs"
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
  "type": "object",
  "properties": {
    "parent": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1
        },
        "schema": {
          "type": "string"
        },
        "catalog": {
          "type": "string"
        },
        "type": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "search": {
      "type": "string"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
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
        "type": "string"
      },
      "schema": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "type": {
        "type": "string"
      },
      "comment": {
        "type": "string"
      },
      "attributes": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {}
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
          "type": "string"
        },
        "catalog": {
          "type": "string"
        },
        "type": {
          "type": "string"
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
          "type": "string"
        },
        "schema": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "type": {
          "type": "string"
        },
        "comment": {
          "type": "string"
        },
        "attributes": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {}
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
            "type": "string"
          },
          "schema": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "comment": {
            "type": "string"
          },
          "attributes": {
            "type": "object",
            "propertyNames": {
              "type": "string"
            },
            "additionalProperties": {}
          }
        },
        "required": [
          "name",
          "type"
        ],
        "additionalProperties": false
      }
    },
    "attributes": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {}
    },
    "durationMs": {
      "type": "number",
      "minimum": 0
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
  "type": "object",
  "properties": {},
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
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` status `

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
    }
  },
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
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listStreams `

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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "type": "object",
  "properties": {
    "namespace": {
      "type": "string",
      "minLength": 1,
      "nullable": true
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
      "format": "starts_with",
      "pattern": "^\\/.*"
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
        "$ref": "#/$defs/__schema0"
      },
      "nullable": true
    },
    "body": {
      "$ref": "#/$defs/__schema1",
      "nullable": true
    },
    "headers": {
      "x-sensitive": true,
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "type": "string"
      },
      "nullable": true
    }
  },
  "required": [
    "path",
    "role"
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

##### ` getStatus `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {},
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
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listPortalApp `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {},
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
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listPortalOrganization `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {},
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
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` listPortalEnv `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {},
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
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getPortalNavTree `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "orderBy": {
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
      "type": "string",
      "minLength": 1,
      "nullable": true
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
  "required": [
    "page",
    "size"
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
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getPortalConfig `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
      "type": "string",
      "minLength": 1,
      "nullable": true
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
  "required": [
    "active",
    "page",
    "size"
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
      "minLength": 1,
      "nullable": true
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
      "minLength": 1,
      "nullable": true
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "type": "object",
  "properties": {
    "appIds": {
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "type": "object",
  "properties": {
    "appId": {
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "required": [
    "page",
    "size"
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
      "minLength": 1,
      "nullable": true
    },
    "name": {
      "type": "string",
      "nullable": true
    },
    "orgId": {
      "type": "string",
      "nullable": true
    },
    "orgName": {
      "type": "string",
      "nullable": true
    },
    "ownerName": {
      "type": "string",
      "nullable": true
    },
    "ownerEmail": {
      "type": "string",
      "nullable": true
    },
    "body": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "$ref": "#/$defs/__schema0"
      },
      "nullable": true
    },
    "assignRoleToSelf": {
      "default": false,
      "type": "boolean"
    }
  },
  "required": [
    "appId",
    "assignRoleToSelf"
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
      "minLength": 1,
      "nullable": true
    },
    "operator": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "name": {
      "type": "string",
      "nullable": true
    },
    "orgId": {
      "type": "string",
      "nullable": true
    },
    "orgName": {
      "type": "string",
      "nullable": true
    },
    "ownerName": {
      "type": "string",
      "nullable": true
    },
    "ownerEmail": {
      "type": "string",
      "nullable": true
    },
    "body": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "$ref": "#/$defs/__schema0"
      },
      "nullable": true
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
      "minLength": 1,
      "nullable": true
    },
    "name": {
      "type": "string",
      "nullable": true
    },
    "orgId": {
      "type": "string",
      "nullable": true
    },
    "orgName": {
      "type": "string",
      "nullable": true
    },
    "ownerName": {
      "type": "string",
      "nullable": true
    },
    "ownerEmail": {
      "type": "string",
      "nullable": true
    },
    "body": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "$ref": "#/$defs/__schema0"
      },
      "nullable": true
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
      "minLength": 1,
      "nullable": true
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

##### ` listMissingAppEnv `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "type": "object",
  "properties": {
    "appId": {
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1,
      "nullable": true
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

##### ` deleteCluster `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1
    },
    "operator": {
      "type": "string",
      "minLength": 1,
      "nullable": true
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

##### ` listNamespace `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "fillItemDetail": {
      "default": true,
      "type": "boolean"
    },
    "extendInfo": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "fillItemDetail"
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
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getNamespace `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "fillItemDetail": {
      "default": true,
      "type": "boolean"
    },
    "extendInfo": {
      "type": "boolean",
      "nullable": true
    }
  },
  "required": [
    "fillItemDetail"
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
  "readOnlyHint": true,
  "destructiveHint": false
}
```

##### ` getNamespaceLock `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
      "minLength": 1,
      "nullable": true
    },
    "operator": {
      "type": "string",
      "minLength": 1,
      "nullable": true
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
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "format",
    "isPublic",
    "namespace"
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

##### ` deleteNamespace `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "operator": {
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

##### ` listNamespaceUsage `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "operator": {
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

##### ` listItem `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
      "type": "string",
      "minLength": 1,
      "nullable": true
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
  "required": [
    "page",
    "size"
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
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
      "type": "string",
      "minLength": 1,
      "nullable": true
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "operator": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "key": {
      "type": "string",
      "minLength": 1
    },
    "value": {
      "type": "string"
    },
    "comment": {
      "type": "string",
      "nullable": true
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
      "type": "string",
      "nullable": true
    },
    "releaseComment": {
      "type": "string",
      "nullable": true
    }
  },
  "required": [
    "createIfNotExists",
    "key",
    "release",
    "value"
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

##### ` deleteItem `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "operator": {
      "type": "string",
      "minLength": 1,
      "nullable": true
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

##### ` getLatestRelease `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "operator": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "title": {
      "type": "string",
      "nullable": true
    },
    "comment": {
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

##### ` rollbackRelease `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "operator": {
      "type": "string",
      "minLength": 1,
      "nullable": true
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

##### ` patchNamespaceItem `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "operator": {
      "type": "string",
      "minLength": 1,
      "nullable": true
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
        ],
        "additionalProperties": false
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
      "type": "string",
      "nullable": true
    },
    "publish": {
      "default": false,
      "type": "boolean"
    },
    "releaseTitle": {
      "type": "string",
      "nullable": true
    },
    "releaseComment": {
      "type": "string",
      "nullable": true
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
  "required": [
    "allowUnpublishedDraft",
    "createIfNotExists",
    "delete",
    "dryRun",
    "publish",
    "set"
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

##### ` writeNamespaceText `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
      "type": "string",
      "minLength": 1,
      "nullable": true
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
      ],
      "nullable": true
    },
    "publish": {
      "default": false,
      "type": "boolean"
    },
    "releaseTitle": {
      "type": "string",
      "nullable": true
    },
    "releaseComment": {
      "type": "string",
      "nullable": true
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
    "configText",
    "dryRun",
    "publish",
    "validate"
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

##### ` patchNamespaceDocument `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
      "type": "string",
      "minLength": 1,
      "nullable": true
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
        ],
        "additionalProperties": false
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
      "type": "string",
      "nullable": true
    },
    "releaseComment": {
      "type": "string",
      "nullable": true
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
  "required": [
    "allowUnpublishedDraft",
    "delete",
    "dryRun",
    "merge",
    "publish",
    "set"
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

##### ` diffNamespaceRelease `

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "type": "object",
  "properties": {
    "appId": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "env": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "cluster": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "namespace": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    },
    "title": {
      "type": "string",
      "nullable": true
    },
    "comment": {
      "type": "string",
      "nullable": true
    },
    "dryRun": {
      "default": false,
      "type": "boolean"
    },
    "ifMatch": {
      "type": "string",
      "minLength": 1,
      "nullable": true
    }
  },
  "required": [
    "dryRun"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "$schema": "https://json-schema.org/draft/2020-12/schema"
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
  "type": "object",
  "properties": {}
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
      "type": [
        "string",
        "null"
      ]
    },
    "email": {
      "type": [
        "string",
        "null"
      ]
    },
    "active": {
      "type": [
        "boolean",
        "null"
      ]
    }
  },
  "required": [
    "id",
    "name"
  ],
  "additionalProperties": false
}
```

##### ` listTeam `

List teams with cursor pagination and optional archived teams.

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
    "includeArchived": {
      "default": false,
      "type": "boolean"
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
            "type": [
              "string",
              "null"
            ]
          }
        },
        "required": [
          "id",
          "key",
          "name"
        ],
        "additionalProperties": false
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": false
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
  ]
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
            "type": [
              "string",
              "null"
            ]
          },
          "position": {
            "type": [
              "number",
              "null"
            ]
          }
        },
        "required": [
          "id",
          "name",
          "type"
        ],
        "additionalProperties": false
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": false
}
```

##### ` listUser `

List users, optionally filtered by name or email.

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
    "includeArchived": {
      "default": false,
      "type": "boolean"
    },
    "query": {
      "type": "string",
      "minLength": 1
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
            "type": [
              "string",
              "null"
            ]
          },
          "email": {
            "type": [
              "string",
              "null"
            ]
          },
          "active": {
            "type": [
              "boolean",
              "null"
            ]
          }
        },
        "required": [
          "id",
          "name"
        ],
        "additionalProperties": false
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": false
}
```

##### ` listProject `

List projects, optionally filtered by team and name.

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
  }
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
            "type": [
              "string",
              "null"
            ]
          },
          "status": {
            "anyOf": [
              {
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
                    "type": [
                      "string",
                      "null"
                    ]
                  }
                },
                "required": [
                  "id",
                  "name",
                  "type"
                ],
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
          },
          "priority": {
            "type": [
              "number",
              "null"
            ]
          },
          "health": {
            "type": [
              "string",
              "null"
            ]
          },
          "startDate": {
            "type": [
              "string",
              "null"
            ]
          },
          "targetDate": {
            "type": [
              "string",
              "null"
            ]
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
                      "type": [
                        "string",
                        "null"
                      ]
                    }
                  },
                  "required": [
                    "id",
                    "key",
                    "name"
                  ],
                  "additionalProperties": false
                }
              }
            },
            "required": [
              "nodes"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "id",
          "name",
          "createdAt",
          "updatedAt",
          "url",
          "teams"
        ],
        "additionalProperties": false
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": false
}
```

##### ` listIssue `

List issues with cursor pagination, field filters, text search and nested GraphQL filters.

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
  }
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
            "type": [
              "string",
              "null"
            ]
          },
          "url": {
            "type": "string"
          },
          "branchName": {
            "type": [
              "string",
              "null"
            ]
          },
          "priority": {
            "type": "integer",
            "minimum": -9007199254740991,
            "maximum": 9007199254740991
          },
          "estimate": {
            "type": [
              "number",
              "null"
            ]
          },
          "dueDate": {
            "type": [
              "string",
              "null"
            ]
          },
          "createdAt": {
            "type": "string"
          },
          "updatedAt": {
            "type": "string"
          },
          "archivedAt": {
            "type": [
              "string",
              "null"
            ]
          },
          "completedAt": {
            "type": [
              "string",
              "null"
            ]
          },
          "canceledAt": {
            "type": [
              "string",
              "null"
            ]
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
                "type": [
                  "string",
                  "null"
                ]
              }
            },
            "required": [
              "id",
              "key",
              "name"
            ],
            "additionalProperties": false
          },
          "state": {
            "anyOf": [
              {
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
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "position": {
                    "type": [
                      "number",
                      "null"
                    ]
                  }
                },
                "required": [
                  "id",
                  "name",
                  "type"
                ],
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
          },
          "assignee": {
            "anyOf": [
              {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "displayName": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "email": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "active": {
                    "type": [
                      "boolean",
                      "null"
                    ]
                  }
                },
                "required": [
                  "id",
                  "name"
                ],
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
          },
          "creator": {
            "anyOf": [
              {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "displayName": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "email": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "active": {
                    "type": [
                      "boolean",
                      "null"
                    ]
                  }
                },
                "required": [
                  "id",
                  "name"
                ],
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
          },
          "project": {
            "anyOf": [
              {
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
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
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
                      "type": [
                        "string",
                        "null"
                      ]
                    }
                  },
                  "required": [
                    "id",
                    "name"
                  ],
                  "additionalProperties": false
                }
              }
            },
            "required": [
              "nodes"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "id",
          "identifier",
          "title",
          "url",
          "priority",
          "createdAt",
          "updatedAt",
          "team",
          "labels"
        ],
        "additionalProperties": false
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": false
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
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": "string"
    },
    "branchName": {
      "type": [
        "string",
        "null"
      ]
    },
    "priority": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991
    },
    "estimate": {
      "type": [
        "number",
        "null"
      ]
    },
    "dueDate": {
      "type": [
        "string",
        "null"
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "archivedAt": {
      "type": [
        "string",
        "null"
      ]
    },
    "completedAt": {
      "type": [
        "string",
        "null"
      ]
    },
    "canceledAt": {
      "type": [
        "string",
        "null"
      ]
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
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "id",
        "key",
        "name"
      ],
      "additionalProperties": false
    },
    "state": {
      "anyOf": [
        {
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
              "type": [
                "string",
                "null"
              ]
            },
            "position": {
              "type": [
                "number",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name",
            "type"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "assignee": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "displayName": {
              "type": [
                "string",
                "null"
              ]
            },
            "email": {
              "type": [
                "string",
                "null"
              ]
            },
            "active": {
              "type": [
                "boolean",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "creator": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "displayName": {
              "type": [
                "string",
                "null"
              ]
            },
            "email": {
              "type": [
                "string",
                "null"
              ]
            },
            "active": {
              "type": [
                "boolean",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "project": {
      "anyOf": [
        {
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
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
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
                "type": [
                  "string",
                  "null"
                ]
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "nodes"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "id",
    "identifier",
    "title",
    "url",
    "priority",
    "createdAt",
    "updatedAt",
    "team",
    "labels"
  ],
  "additionalProperties": false
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
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": "string"
    },
    "branchName": {
      "type": [
        "string",
        "null"
      ]
    },
    "priority": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991
    },
    "estimate": {
      "type": [
        "number",
        "null"
      ]
    },
    "dueDate": {
      "type": [
        "string",
        "null"
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "archivedAt": {
      "type": [
        "string",
        "null"
      ]
    },
    "completedAt": {
      "type": [
        "string",
        "null"
      ]
    },
    "canceledAt": {
      "type": [
        "string",
        "null"
      ]
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
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "id",
        "key",
        "name"
      ],
      "additionalProperties": false
    },
    "state": {
      "anyOf": [
        {
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
              "type": [
                "string",
                "null"
              ]
            },
            "position": {
              "type": [
                "number",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name",
            "type"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "assignee": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "displayName": {
              "type": [
                "string",
                "null"
              ]
            },
            "email": {
              "type": [
                "string",
                "null"
              ]
            },
            "active": {
              "type": [
                "boolean",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "creator": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "displayName": {
              "type": [
                "string",
                "null"
              ]
            },
            "email": {
              "type": [
                "string",
                "null"
              ]
            },
            "active": {
              "type": [
                "boolean",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "project": {
      "anyOf": [
        {
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
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
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
                "type": [
                  "string",
                  "null"
                ]
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "nodes"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "id",
    "identifier",
    "title",
    "url",
    "priority",
    "createdAt",
    "updatedAt",
    "team",
    "labels"
  ],
  "additionalProperties": false
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
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": "string"
    },
    "branchName": {
      "type": [
        "string",
        "null"
      ]
    },
    "priority": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991
    },
    "estimate": {
      "type": [
        "number",
        "null"
      ]
    },
    "dueDate": {
      "type": [
        "string",
        "null"
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "archivedAt": {
      "type": [
        "string",
        "null"
      ]
    },
    "completedAt": {
      "type": [
        "string",
        "null"
      ]
    },
    "canceledAt": {
      "type": [
        "string",
        "null"
      ]
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
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "id",
        "key",
        "name"
      ],
      "additionalProperties": false
    },
    "state": {
      "anyOf": [
        {
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
              "type": [
                "string",
                "null"
              ]
            },
            "position": {
              "type": [
                "number",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name",
            "type"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "assignee": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "displayName": {
              "type": [
                "string",
                "null"
              ]
            },
            "email": {
              "type": [
                "string",
                "null"
              ]
            },
            "active": {
              "type": [
                "boolean",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "creator": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "displayName": {
              "type": [
                "string",
                "null"
              ]
            },
            "email": {
              "type": [
                "string",
                "null"
              ]
            },
            "active": {
              "type": [
                "boolean",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "project": {
      "anyOf": [
        {
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
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
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
                "type": [
                  "string",
                  "null"
                ]
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "nodes"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "id",
    "identifier",
    "title",
    "url",
    "priority",
    "createdAt",
    "updatedAt",
    "team",
    "labels"
  ],
  "additionalProperties": false
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
  ]
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
            "anyOf": [
              {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "displayName": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "email": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "active": {
                    "type": [
                      "boolean",
                      "null"
                    ]
                  }
                },
                "required": [
                  "id",
                  "name"
                ],
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
          }
        },
        "required": [
          "id",
          "body",
          "createdAt",
          "updatedAt"
        ],
        "additionalProperties": false
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "nodes",
    "pageInfo"
  ],
  "additionalProperties": false
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
    "issueId",
    "body"
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
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "displayName": {
              "type": [
                "string",
                "null"
              ]
            },
            "email": {
              "type": [
                "string",
                "null"
              ]
            },
            "active": {
              "type": [
                "boolean",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "required": [
    "id",
    "body",
    "createdAt",
    "updatedAt"
  ],
  "additionalProperties": false
}
```

#### Static tools

##### ` getViewer `

Get the authenticated Linear user.

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {}
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
      "type": [
        "string",
        "null"
      ]
    },
    "email": {
      "type": [
        "string",
        "null"
      ]
    },
    "active": {
      "type": [
        "boolean",
        "null"
      ]
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

##### ` listTeam `

List teams with cursor pagination and optional archived teams.

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
    "includeArchived": {
      "default": false,
      "type": "boolean"
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
            "type": [
              "string",
              "null"
            ]
          }
        },
        "required": [
          "id",
          "key",
          "name"
        ],
        "additionalProperties": false
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "nodes",
    "pageInfo"
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
  ]
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
            "type": [
              "string",
              "null"
            ]
          },
          "position": {
            "type": [
              "number",
              "null"
            ]
          }
        },
        "required": [
          "id",
          "name",
          "type"
        ],
        "additionalProperties": false
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "nodes",
    "pageInfo"
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

##### ` listUser `

List users, optionally filtered by name or email.

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
    "includeArchived": {
      "default": false,
      "type": "boolean"
    },
    "query": {
      "type": "string",
      "minLength": 1
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
            "type": [
              "string",
              "null"
            ]
          },
          "email": {
            "type": [
              "string",
              "null"
            ]
          },
          "active": {
            "type": [
              "boolean",
              "null"
            ]
          }
        },
        "required": [
          "id",
          "name"
        ],
        "additionalProperties": false
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "nodes",
    "pageInfo"
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

##### ` listProject `

List projects, optionally filtered by team and name.

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
  }
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
            "type": [
              "string",
              "null"
            ]
          },
          "status": {
            "anyOf": [
              {
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
                    "type": [
                      "string",
                      "null"
                    ]
                  }
                },
                "required": [
                  "id",
                  "name",
                  "type"
                ],
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
          },
          "priority": {
            "type": [
              "number",
              "null"
            ]
          },
          "health": {
            "type": [
              "string",
              "null"
            ]
          },
          "startDate": {
            "type": [
              "string",
              "null"
            ]
          },
          "targetDate": {
            "type": [
              "string",
              "null"
            ]
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
                      "type": [
                        "string",
                        "null"
                      ]
                    }
                  },
                  "required": [
                    "id",
                    "key",
                    "name"
                  ],
                  "additionalProperties": false
                }
              }
            },
            "required": [
              "nodes"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "id",
          "name",
          "createdAt",
          "updatedAt",
          "url",
          "teams"
        ],
        "additionalProperties": false
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "nodes",
    "pageInfo"
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

##### ` listIssue `

List issues with cursor pagination, field filters, text search and nested GraphQL filters.

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
  }
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
            "type": [
              "string",
              "null"
            ]
          },
          "url": {
            "type": "string"
          },
          "branchName": {
            "type": [
              "string",
              "null"
            ]
          },
          "priority": {
            "type": "integer",
            "minimum": -9007199254740991,
            "maximum": 9007199254740991
          },
          "estimate": {
            "type": [
              "number",
              "null"
            ]
          },
          "dueDate": {
            "type": [
              "string",
              "null"
            ]
          },
          "createdAt": {
            "type": "string"
          },
          "updatedAt": {
            "type": "string"
          },
          "archivedAt": {
            "type": [
              "string",
              "null"
            ]
          },
          "completedAt": {
            "type": [
              "string",
              "null"
            ]
          },
          "canceledAt": {
            "type": [
              "string",
              "null"
            ]
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
                "type": [
                  "string",
                  "null"
                ]
              }
            },
            "required": [
              "id",
              "key",
              "name"
            ],
            "additionalProperties": false
          },
          "state": {
            "anyOf": [
              {
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
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "position": {
                    "type": [
                      "number",
                      "null"
                    ]
                  }
                },
                "required": [
                  "id",
                  "name",
                  "type"
                ],
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
          },
          "assignee": {
            "anyOf": [
              {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "displayName": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "email": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "active": {
                    "type": [
                      "boolean",
                      "null"
                    ]
                  }
                },
                "required": [
                  "id",
                  "name"
                ],
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
          },
          "creator": {
            "anyOf": [
              {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "displayName": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "email": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "active": {
                    "type": [
                      "boolean",
                      "null"
                    ]
                  }
                },
                "required": [
                  "id",
                  "name"
                ],
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
          },
          "project": {
            "anyOf": [
              {
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
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
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
                      "type": [
                        "string",
                        "null"
                      ]
                    }
                  },
                  "required": [
                    "id",
                    "name"
                  ],
                  "additionalProperties": false
                }
              }
            },
            "required": [
              "nodes"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "id",
          "identifier",
          "title",
          "url",
          "priority",
          "createdAt",
          "updatedAt",
          "team",
          "labels"
        ],
        "additionalProperties": false
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "nodes",
    "pageInfo"
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
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": "string"
    },
    "branchName": {
      "type": [
        "string",
        "null"
      ]
    },
    "priority": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991
    },
    "estimate": {
      "type": [
        "number",
        "null"
      ]
    },
    "dueDate": {
      "type": [
        "string",
        "null"
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "archivedAt": {
      "type": [
        "string",
        "null"
      ]
    },
    "completedAt": {
      "type": [
        "string",
        "null"
      ]
    },
    "canceledAt": {
      "type": [
        "string",
        "null"
      ]
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
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "id",
        "key",
        "name"
      ],
      "additionalProperties": false
    },
    "state": {
      "anyOf": [
        {
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
              "type": [
                "string",
                "null"
              ]
            },
            "position": {
              "type": [
                "number",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name",
            "type"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "assignee": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "displayName": {
              "type": [
                "string",
                "null"
              ]
            },
            "email": {
              "type": [
                "string",
                "null"
              ]
            },
            "active": {
              "type": [
                "boolean",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "creator": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "displayName": {
              "type": [
                "string",
                "null"
              ]
            },
            "email": {
              "type": [
                "string",
                "null"
              ]
            },
            "active": {
              "type": [
                "boolean",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "project": {
      "anyOf": [
        {
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
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
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
                "type": [
                  "string",
                  "null"
                ]
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "nodes"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "id",
    "identifier",
    "title",
    "url",
    "priority",
    "createdAt",
    "updatedAt",
    "team",
    "labels"
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
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": "string"
    },
    "branchName": {
      "type": [
        "string",
        "null"
      ]
    },
    "priority": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991
    },
    "estimate": {
      "type": [
        "number",
        "null"
      ]
    },
    "dueDate": {
      "type": [
        "string",
        "null"
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "archivedAt": {
      "type": [
        "string",
        "null"
      ]
    },
    "completedAt": {
      "type": [
        "string",
        "null"
      ]
    },
    "canceledAt": {
      "type": [
        "string",
        "null"
      ]
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
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "id",
        "key",
        "name"
      ],
      "additionalProperties": false
    },
    "state": {
      "anyOf": [
        {
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
              "type": [
                "string",
                "null"
              ]
            },
            "position": {
              "type": [
                "number",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name",
            "type"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "assignee": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "displayName": {
              "type": [
                "string",
                "null"
              ]
            },
            "email": {
              "type": [
                "string",
                "null"
              ]
            },
            "active": {
              "type": [
                "boolean",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "creator": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "displayName": {
              "type": [
                "string",
                "null"
              ]
            },
            "email": {
              "type": [
                "string",
                "null"
              ]
            },
            "active": {
              "type": [
                "boolean",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "project": {
      "anyOf": [
        {
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
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
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
                "type": [
                  "string",
                  "null"
                ]
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "nodes"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "id",
    "identifier",
    "title",
    "url",
    "priority",
    "createdAt",
    "updatedAt",
    "team",
    "labels"
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
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": "string"
    },
    "branchName": {
      "type": [
        "string",
        "null"
      ]
    },
    "priority": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991
    },
    "estimate": {
      "type": [
        "number",
        "null"
      ]
    },
    "dueDate": {
      "type": [
        "string",
        "null"
      ]
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    },
    "archivedAt": {
      "type": [
        "string",
        "null"
      ]
    },
    "completedAt": {
      "type": [
        "string",
        "null"
      ]
    },
    "canceledAt": {
      "type": [
        "string",
        "null"
      ]
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
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "id",
        "key",
        "name"
      ],
      "additionalProperties": false
    },
    "state": {
      "anyOf": [
        {
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
              "type": [
                "string",
                "null"
              ]
            },
            "position": {
              "type": [
                "number",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name",
            "type"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "assignee": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "displayName": {
              "type": [
                "string",
                "null"
              ]
            },
            "email": {
              "type": [
                "string",
                "null"
              ]
            },
            "active": {
              "type": [
                "boolean",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "creator": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "displayName": {
              "type": [
                "string",
                "null"
              ]
            },
            "email": {
              "type": [
                "string",
                "null"
              ]
            },
            "active": {
              "type": [
                "boolean",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "project": {
      "anyOf": [
        {
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
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
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
                "type": [
                  "string",
                  "null"
                ]
              }
            },
            "required": [
              "id",
              "name"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "nodes"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "id",
    "identifier",
    "title",
    "url",
    "priority",
    "createdAt",
    "updatedAt",
    "team",
    "labels"
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
  ]
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
            "anyOf": [
              {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "displayName": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "email": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "active": {
                    "type": [
                      "boolean",
                      "null"
                    ]
                  }
                },
                "required": [
                  "id",
                  "name"
                ],
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
          }
        },
        "required": [
          "id",
          "body",
          "createdAt",
          "updatedAt"
        ],
        "additionalProperties": false
      }
    },
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {
          "type": "boolean"
        },
        "endCursor": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "hasNextPage"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "nodes",
    "pageInfo"
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
    "issueId",
    "body"
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
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "displayName": {
              "type": [
                "string",
                "null"
              ]
            },
            "email": {
              "type": [
                "string",
                "null"
              ]
            },
            "active": {
              "type": [
                "boolean",
                "null"
              ]
            }
          },
          "required": [
            "id",
            "name"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "required": [
    "id",
    "body",
    "createdAt",
    "updatedAt"
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

Synthesize text into bounded audio encoded as Base64.

inputType:

```typescript
{ text: string; voice?: string; format?: "mp3" | "wav" | "opus" | "aac" | "flac" | "pcm"; model?: string; speed?: number; rate?: string; pitch?: string; volume?: string; instructions?: string }
```

outputType:

```typescript
{ audioBase64: string; format: "mp3" | "wav" | "opus" | "aac" | "flac" | "pcm"; mediaType: string; voice?: string; model?: string; byteLength: number }
```

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
      "maxLength": 256
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
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
    "speed": {
      "type": "number",
      "minimum": 0.25,
      "maximum": 4
    },
    "rate": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}%$"
    },
    "pitch": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}Hz$"
    },
    "volume": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}%$"
    },
    "instructions": {
      "type": "string",
      "maxLength": 100000
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
      "maxLength": 256
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "byteLength": {
      "type": "integer",
      "minimum": 1,
      "maximum": 16777216
    }
  },
  "required": [
    "audioBase64",
    "format",
    "mediaType",
    "byteLength"
  ],
  "additionalProperties": false
}
```

##### ` listVoices `

List available voices when supported by the provider.

inputType:

```typescript
{ locale?: string; query?: string }
```

outputType:

```typescript
{ supported: boolean; voices: Array<{ id: string; name?: string; locale?: string; gender?: string }> }
```

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "locale": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "query": {
      "type": "string",
      "maxLength": 256
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
            "maxLength": 512
          },
          "locale": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          },
          "gender": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
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

Synthesize text into bounded audio encoded as Base64.

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
      "maxLength": 256
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
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
    "speed": {
      "type": "number",
      "minimum": 0.25,
      "maximum": 4
    },
    "rate": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}%$"
    },
    "pitch": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}Hz$"
    },
    "volume": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}%$"
    },
    "instructions": {
      "type": "string",
      "maxLength": 100000
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
      "maxLength": 256
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "byteLength": {
      "type": "integer",
      "minimum": 1,
      "maximum": 16777216
    }
  },
  "required": [
    "audioBase64",
    "format",
    "mediaType",
    "byteLength"
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
  "type": "object",
  "properties": {
    "locale": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "query": {
      "type": "string",
      "maxLength": 256
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
            "maxLength": 512
          },
          "locale": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          },
          "gender": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
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

Synthesize text into bounded audio encoded as Base64.

inputType:

```typescript
{ text: string; voice?: string; format?: "mp3" | "wav" | "opus" | "aac" | "flac" | "pcm"; model?: string; speed?: number; rate?: string; pitch?: string; volume?: string; instructions?: string }
```

outputType:

```typescript
{ audioBase64: string; format: "mp3" | "wav" | "opus" | "aac" | "flac" | "pcm"; mediaType: string; voice?: string; model?: string; byteLength: number }
```

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
      "maxLength": 256
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
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
    "speed": {
      "type": "number",
      "minimum": 0.25,
      "maximum": 4
    },
    "rate": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}%$"
    },
    "pitch": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}Hz$"
    },
    "volume": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}%$"
    },
    "instructions": {
      "type": "string",
      "maxLength": 100000
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
      "maxLength": 256
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "byteLength": {
      "type": "integer",
      "minimum": 1,
      "maximum": 16777216
    }
  },
  "required": [
    "audioBase64",
    "format",
    "mediaType",
    "byteLength"
  ],
  "additionalProperties": false
}
```

##### ` listVoices `

List available voices when supported by the provider.

inputType:

```typescript
{ locale?: string; query?: string }
```

outputType:

```typescript
{ supported: boolean; voices: Array<{ id: string; name?: string; locale?: string; gender?: string }> }
```

inputSchema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "locale": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "query": {
      "type": "string",
      "maxLength": 256
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
            "maxLength": 512
          },
          "locale": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          },
          "gender": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
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

Synthesize text into bounded audio encoded as Base64.

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
      "maxLength": 256
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
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
    "speed": {
      "type": "number",
      "minimum": 0.25,
      "maximum": 4
    },
    "rate": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}%$"
    },
    "pitch": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}Hz$"
    },
    "volume": {
      "type": "string",
      "pattern": "^[+-]\\d{1,3}%$"
    },
    "instructions": {
      "type": "string",
      "maxLength": 100000
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
      "maxLength": 256
    },
    "model": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "byteLength": {
      "type": "integer",
      "minimum": 1,
      "maximum": 16777216
    }
  },
  "required": [
    "audioBase64",
    "format",
    "mediaType",
    "byteLength"
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
  "type": "object",
  "properties": {
    "locale": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "query": {
      "type": "string",
      "maxLength": 256
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
            "maxLength": 512
          },
          "locale": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          },
          "gender": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
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

### ` system ` — System

Offline runtime information and echo operations

Capabilities: ` system `

Provider options schema:

```json
{
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
  "type": "object"
}
```

annotations:

```json
{
  "readOnlyHint": true
}
```

##### ` echo `

Return the input text

inputSchema:

```json
{
  "type": "object",
  "properties": {
    "text": {
      "type": "string"
    }
  },
  "required": [
    "text"
  ]
}
```

annotations:

```json
{
  "readOnlyHint": true
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
