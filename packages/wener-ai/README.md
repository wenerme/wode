# @wener/ai

AI utilities, provider-agnostic schemas, and MCP (Model Context Protocol) server definitions.

## Install

```bash
pnpm add @wener/ai
```

## Modules

### AI Provider Schemas

Zod-based schema definitions for major AI providers, covering Chat Completions, Responses API, streaming, and tool calling.

Each provider offers two schema flavors:

- **Strict schemas** and **Generic/loose schemas** are both exported from `@wener/ai/schema`

```ts
// Generic (loose) — good for proxies and protocol conversion
import {
  CreateChatCompletionRequestSchema,
  CreateChatCompletionResponseSchema,
  CreateChatCompletionStreamChunkSchema,
  CreateResponseRequestSchema,
  UsageSchema,
} from '@wener/ai/schema';

// Strict — good for direct API interaction
import {
  ChatCompletionRequestSchema,
  ChatCompletionResponseSchema,
  ChatCompletionChunkSchema,
} from '@wener/ai/schema';
```

**Supported providers:**

| Import path | Provider | Notes |
| --- | --- | --- |
| `@wener/ai/schema` | OpenAI / Anthropic / Gemini | Generic + strict protocol schemas |

### MCP Server Definitions

Reusable, factory-based MCP server definitions that follow a standard `McpServerDef` pattern. Each server provides tools and resources accessible via the [Model Context Protocol](https://modelcontextprotocol.io/).

```ts
import { defineMcpServer, type McpServerDef, type McpServerInstance } from '@wener/ai/mcp';
```

#### Prometheus

PromQL-based metrics querying with instant and range query support.

```ts
import { createPrometheusMcpServer } from '@wener/ai/mcp/prometheus';

const { server, close } = createPrometheusMcpServer({
  url: 'http://prometheus:9090',
  username: 'admin', // optional
  password: 'secret', // optional
});
```

**Tools:** `query` (instant & range PromQL queries), `list_metrics`, `metric_metadata`, `label_values`

**Resources:** `promql-guide` — PromQL syntax reference

#### Tencent CLS

Tencent Cloud Log Service for log search, analysis, and pattern clustering.

```ts
import { createTencentClsMcpServer } from '@wener/ai/mcp/tencent-cls';

const { server, close } = createTencentClsMcpServer({
  clientId: 'AKID...',
  clientSecret: '...',
  region: 'ap-shanghai', // optional, defaults to ap-shanghai
});
```

**Tools:** `search` (CQL log search), `cluster_logs` (Drain3-based pattern clustering), `log_context` (surrounding context), `list_topics`, `describe_topic`, `get_histograms`

**Resources:** `search-guide` — CQL search syntax reference

#### SQL Database

Multi-dialect SQL database access via [Kysely](https://kysely.dev/).

```ts
import { createSqlMcpServer } from '@wener/ai/mcp/sql';

const { server, close } = createSqlMcpServer({
  url: 'mysql://user:pass@localhost:3306/mydb',
});
```

**Tools:** `query` (execute SQL), `list_tables`, `describe_table`

**Supported dialects:** MySQL, PostgreSQL, SQLite, MSSQL

**Peer dependencies:** `kysely`, and the dialect driver (`mysql2`, `tedious`, etc.)

#### Feishu / Lark

Messaging and document operations for Feishu (飞书) / Lark.

```ts
import { createFeishuMcpServer } from '@wener/ai/mcp/feishu';

const { server, close } = createFeishuMcpServer({
  appId: 'cli_...',
  appSecret: '...',
  domain: 'feishu', // 'feishu' | 'lark' | custom domain
});
```

**Tools:** IM (messaging), document operations

**Peer dependency:** `@larksuiteoapi/node-sdk`

#### Apollo Config

Read application configurations from [Apollo Config](https://www.apolloconfig.com/) configuration center.

```ts
import { createApolloConfigMcpServer } from '@wener/ai/mcp/apolloconfig';

const { server, close } = createApolloConfigMcpServer({
  url: 'http://apollo-config:8080',
  appId: 'my-app',
  cluster: 'default', // optional
});
```

**Tools:** Configuration reading and namespace listing

#### MCP Relay

Proxy requests to another MCP server, supporting both Streamable HTTP and SSE transports.

```ts
import { createRelayMcpServer } from '@wener/ai/mcp/relay';

const { server, close } = createRelayMcpServer({
  url: 'http://other-mcp-server:3000/mcp',
  transport: 'http', // 'http' | 'sse'
  headers: { Authorization: 'Bearer ...' }, // optional
});
```

**Tools:** `relay_list_tools`, `relay_call_tool`, `relay_list_resources`, `relay_read_resource`

### Custom MCP Server Definition

Use `defineMcpServer` to create your own server definition that integrates with [@wener/mcps](https://www.npmjs.com/package/@wener/mcps) infrastructure:

```ts
import { defineMcpServer, type McpServerInstance } from '@wener/ai/mcp';

interface MyOptions {
  apiKey: string;
}

export const MyMcpServerDef = defineMcpServer<MyOptions>({
  name: 'my-service',
  title: 'My Service',
  description: 'My custom MCP server',
  version: '1.0.0',
  tags: ['custom'],
  validateOptions(options) {
    if (!options.apiKey) return { valid: false, error: 'Missing apiKey' };
    return { valid: true };
  },
  getCacheKey(options) {
    return `my::${options.apiKey}`;
  },
  create(options): McpServerInstance {
    const server = new McpServer({ name: 'my-service', version: '1.0.0' });
    // register tools, resources...
    return { server, async close() { await server.close(); } };
  },
});
```

## Peer Dependencies

Heavy or optional dependencies are declared as optional peer dependencies to avoid eager loading:

| Dependency | Required by |
| --- | --- |
| `kysely` | `@wener/ai/mcp/sql` |
| `mysql2` | SQL MCP with MySQL dialect |
| `tedious` | SQL MCP with MSSQL dialect |
| `tarn` | Connection pooling for SQL |
| `@larksuiteoapi/node-sdk` | `@wener/ai/mcp/feishu` |

## License

ISC
