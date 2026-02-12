# @wener/mcps

MCPs as a Service - 统一 MCP 服务代理。

一个进程托管多个 MCP 服务器，无需分别启动，支持预配置和动态配置。

## 快速开始

```bash
npx -y @wener/mcps@latest
```

在当前目录创建 `.mcps.yaml`：

```yaml
servers:
  my-db:
    type: sql
    dbUrl: postgresql://user:pass@localhost/mydb

  metrics:
    type: prometheus
    url: http://prometheus:9090

  logs:
    type: tencent-cls
    clientId: ${CLS_CLIENT_ID}
    clientSecret: ${CLS_CLIENT_SECRET}
    region: ap-shanghai

  upstream:
    type: relay
    url: http://other-mcp:8000
```

服务启动后：

- 预配置的 server 通过 `/mcp/{name}` 暴露
- 每个类型还暴露 `/mcp/{type}` 动态端点，通过请求头传入配置

## 内置 MCP 服务器

| 类型 | 端点 | 说明 | 动态 Header |
|------|------|------|-------------|
| `sql` | `/mcp/sql` | SQL 查询（MySQL、PostgreSQL、SQLite、MSSQL） | `X-DB-URL`, `X-DB-READ-URL`, `X-DB-WRITE-URL` |
| `prometheus` | `/mcp/prometheus` | Prometheus 监控查询 | `X-SERVICE-URL` |
| `tencent-cls` | `/mcp/tencent-cls` | 腾讯云日志服务 | `X-CLS-SECRET-ID`\*, `X-CLS-SECRET-KEY`\*, `X-CLS-REGION`, `X-CLS-ENDPOINT` |
| `relay` | `/mcp/relay` | 代理转发到其他 MCP 服务器 | `X-MCP-URL`\*, `X-MCP-TYPE` |

`*` 为必填项

### sql

```yaml
servers:
  my-db:
    type: sql
    dbUrl: postgresql://user:pass@localhost/mydb
    # 支持读写分离
    # dbReadUrl: postgresql://reader@localhost/mydb
    # dbWriteUrl: postgresql://writer@localhost/mydb
```

### prometheus

```yaml
servers:
  metrics:
    type: prometheus
    url: http://prometheus:9090
```

### tencent-cls

```yaml
servers:
  logs:
    type: tencent-cls
    clientId: ${CLS_SECRET_ID}
    clientSecret: ${CLS_SECRET_KEY}
    region: ap-shanghai        # 默认 ap-shanghai
    # endpoint: cls.tencentcloudapi.com
```

### relay

```yaml
servers:
  upstream:
    type: relay
    url: http://other-mcp:8000
    transport: http  # http | sse
```

## 动态配置

通过请求头传入配置，无需重启即可连接新的数据源：

```bash
curl http://localhost:8036/mcp/sql \
  -H "X-DB-URL: postgresql://user:pass@host/db" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## 通用 Header

所有 MCP 端点支持以下请求头：

| Header | 说明 |
|--------|------|
| `X-MCP-Readonly` | 设为 `true` 仅返回只读工具 |
| `X-MCP-Include` | 包含匹配的工具（glob，如 `query_*`） |
| `X-MCP-Exclude` | 排除匹配的工具（glob，如 `execute_*`） |

## 配置文件

按优先级从高到低（后者被前者覆盖）：

1. `.mcps.local.yaml` - 本地覆盖（建议 gitignore）
2. `.mcps.yaml` - 基础配置

支持 `.yaml`、`.yml`、`.json` 格式。配置值支持 `${VAR_NAME}` 引用环境变量，自动加载 `.env` 和 `.env.local`。

```yaml
servers:
  name:
    type: sql | prometheus | tencent-cls | relay
    disabled: false  # 可选，禁用该服务器
    # ... 各类型特定配置

audit:
  enabled: true       # 审计日志，默认开启
  db:
    path: .mcps.db    # SQLite 审计库路径
```

## CLI

```bash
npx -y @wener/mcps@latest [options]

-p, --port <port>      端口号（默认 8036）
-c, --cwd <path>       配置文件目录
```
