# woctl

在终端搜索和抓取网页、处理 PDF 和 Excel 文件、调用 MCP 工具、使用 AI 模型，以及渲染 Markdown 和结构化数据。通过 context 管理不同环境的服务连接。

[English](https://github.com/wenerme/wode/blob/develop/apps/woctl/README.md) | [简体中文](https://github.com/wenerme/wode/blob/develop/apps/woctl/README.zh-Hans.md)

[完整使用文档、服务指南与覆盖情况](https://github.com/wenerme/wode/blob/develop/docs/woctl/README.md)

## 安装

需要 **Node.js 24.11 或更高版本**。

```sh
npm install -g woctl
woctl --help
```

也可以直接运行：

```sh
npx woctl --help
```

npm 包包含一个 CLI bundle，安装时会自动安装 PDF、Excel 所需的运行依赖和 WASM 资源，安装后的命令是 `woctl`。

## 快速上手

无需配置服务，即可渲染 Markdown 或转换数据：

```sh
woctl md --text '# Hello'
printf '{"name":"Ada","active":true}' | woctl render - --input json --format yaml
```

添加一个免费的 DuckDuckGo 搜索连接：

```sh
woctl service add search --type duckduckgo
woctl search 'MCP protocol' --limit 5 --json
```

领域命令会在当前 context 配置并启用相应服务后出现。如果找不到命令，先用 `woctl service list` 和 `woctl context show` 检查配置。

## 配置

无需加载配置即可查看全部已注册命令和服务类型：

```sh
woctl catalog --output md
woctl catalog --service-type sql --output typescript
woctl catalog --output jsonschema
```

也支持 JSON 与 `--output-file`。JSON Schema 描述 catalog 文档本身。参见[生成的完整命令参考](https://github.com/wenerme/wode/blob/develop/docs/woctl/reference.md)和[注册与文档维护指南](https://github.com/wenerme/wode/blob/develop/docs/woctl/development.md)。

默认配置文件是 `~/.wode/woctl.yaml`：

```yaml
version: 1
currentContext: local
services:
  - name: search
    type: duckduckgo
```

每个服务使用唯一的 `name`，`type` 指定服务适配器。设置 `disabled: true` 可以保留连接配置并禁止调用。

通过 `--config` 或 `WOCTL_CONFIG` 选择其他文件：

```sh
woctl --config ./woctl.yaml service list
```

### 切换环境

context 用于组织一个环境的连接和设置。共享配置放在 `woctl.yaml`，环境配置放在同目录的 `woctl.<context>.yaml`，例如 `woctl.dev.yaml`。

```sh
woctl context create dev
woctl context use dev
woctl context show --json
woctl service list --context local --json
```

`context use` 修改持久化的默认环境，`--context` 只影响本次调用。选择顺序为 `--context` → `WOCTL_CONTEXT` → `currentContext` → `local`。

context 会继承共享服务。同名服务会整条替换共享配置。删除 context 自有条目后，继承的条目可能重新出现。服务和 AI 配置编辑命令写入当前 context 文件；保存会保留扩展字段，但会重新排版 YAML，原有注释不会保留。

| 环境变量 | 用途 |
| --- | --- |
| `WOCTL_CONFIG` | 配置文件路径 |
| `WOCTL_CONTEXT` | 本次调用使用的 context |
| `WOCTL_LOG_LEVEL` | 日志级别，也可通过 `--log-level` 设置 |

旧的 `WOCLI_*` 环境变量仍可作为读取回退，`WOCTL_*` 优先。已有配置文件可以通过 `--config` 显式指定。

## 网页搜索

```sh
woctl search 'TypeScript documentation' --limit 5
woctl search 'MCP examples' --offset 10 --service search --json
```

`search` 按搜索能力选择已配置的 DuckDuckGo 或 Exa 服务，可以用 `woctl service default set search <name>` 设置默认。

DuckDuckGo 搜索无需 API key。优先使用 Instant Answer 结果，无结果时回退到 HTML 搜索；非零 offset 直接使用 HTML 搜索。

配置了多个搜索连接时，可以显式选择，或设置默认连接：

```sh
woctl search 'TypeScript' --service search --json
woctl service default set duckduckgo search
```

## 页面抓取

```sh
woctl service add reader --type direct
woctl fetch https://example.com/ --service reader
woctl fetch https://example.com/ --service reader --no-main --json
```

抓取支持 direct HTTP、Jina 和 Exa。HTML 会转换为 Markdown，默认提取正文，`--no-main` 保留完整页面。多个连接时可用 `woctl service default set fetch <name>` 设置默认。`search`、`fetch` 均支持 `--list-services` 和显式 `--service` 选择。

`woctl search 'query' --fetch` 可以抓取首条搜索结果，`--fetch-limit 3` 抓取多条；通过 `--fetch-service <name>` 独立选择抓取连接。`--raw --json` 可以查看已移除或遮盖认证数据的供应商响应。

## PDF 与 Excel

这些本地命令无需服务配置：

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

PDF 工具提供元数据、内部结构检查、文本提取、模板解析和 PNG 渲染；XLSX 工具提供工作表、属性、区域读取、单元格与样式编辑、清理和 CSV 导出。覆盖输入工作簿须明确 `--in-place`；`tidy` 会重建工作簿并丢弃绘图等复杂结构。具体选项见 [文档工具指南](https://github.com/wenerme/wode/blob/develop/docs/woctl/documents.md)。

## SQL

SQL 使用统一 service 注册，原生支持 SQLite 和 PostgreSQL：

```sh
woctl service add scratch --type sqlite --option filename=:memory:
woctl sql query 'SELECT 42 AS answer' --service scratch --json
woctl sql query @query.sql --service scratch --json
woctl sql --list-services --json
woctl service type sql --typescript
```

还提供 `ping`、`explain`、`table list`、`table info` 和 `exec`。查询使用参数绑定并强制只读；写入须同时启用 writable 和提供 `--yes`，缺少条件时在读取输入文件和建立连接前拒绝。`service inspect` 和 TypeScript 发现展示服务方法及结果类型。详见 [SQL 指南](https://github.com/wenerme/wode/blob/develop/docs/woctl/service/sql.md)。

## Redis 与 Valkey

Redis 使用相同的服务注册与选择流程：

```sh
woctl service add cache --type redis --base-url redis://localhost:6379/0
woctl redis ping --service cache --json
woctl redis get example --service cache --json
woctl redis scan --all --match 'app:*' --service cache --json
woctl redis hgetall user:example --service cache --json
woctl redis xrange events --count 20 --service cache --json
woctl service type redis --typescript
```

`valkey` 是别名。服务保留源实现的只读操作、key 前缀隔离、TLS、超时、重试、响应限制和连接释放。凭据可在 options 中通过 `env://NAME` 延迟引用。Node 注入原生 driver，浏览器 bundle 不包含该驱动。详见 [Redis 指南](https://github.com/wenerme/wode/blob/develop/docs/woctl/service/redis.md)。

## 文字转语音

默认使用无需配置 API key 的 Edge provider 生成 MP3：

```sh
woctl tts 'Hello' --output-file hello.mp3
woctl tts voices --locale zh-CN
woctl tts --input @speech.txt --output-file speech.mp3
```

默认音色为 `zh-CN-XiaoxiaoNeural`。Edge 使用内部在线协议，可用性可能变化。模型服务可配置为 `openai-tts`，通过 `--service` 选择并用 `--model`、`--voice` 覆盖。详见 [TTS 指南](https://github.com/wenerme/wode/blob/develop/docs/woctl/service/tts.md)。

## Linear

配置 `linear` 服务，使用 `options.apiKeyEnv` 或 `options.accessTokenEnv` 提供认证，再调用完整 issue 与评论命令：

```sh
woctl linear status
woctl linear team ls
woctl linear issue ls --team TEAM_ID --limit 25 --json
woctl linear issue get EX-123 --json --output-file issue.json
woctl linear issue create 'Fix regression' --team TEAM_ID --description @body.md --yes
woctl linear comment create EX-123 @comment.md --yes
```

写操作须同时满足 `readOnly: false` 与 `--yes`，再读取文件和解析认证。也包括团队、状态、用户、项目、issue 更新、筛选和游标分页。参见 [Linear 指南](https://github.com/wenerme/wode/blob/develop/docs/woctl/service/linear.md)及[链接私有 Node 宿主](https://github.com/wenerme/wode/blob/develop/docs/woctl/development.md#link-a-private-node-host)。

## Prometheus 与 VictoriaMetrics

Prometheus 提供独立的 service 和 CLI，短别名为 `prom`：

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

将示例 URL 替换为自己的端点。服务还支持 series 发现、指标 metadata、重复 `--match` 过滤、Bearer/Basic/headers 认证和自定义 API 前缀。通过 `--option accessTokenEnv=PROMETHEUS_TOKEN` 配置后，只在实际调用时读取环境变量中的 Bearer token。所选 context 配置并启用 Prometheus 服务后，对应命令才会出现；多个连接时使用 `--service metrics` 显式选择。详见 [Prometheus 指南](https://github.com/wenerme/wode/blob/develop/docs/woctl/service/prometheus.md)。

## MCP

在共享配置或 context 配置的 `mcpServers` 中添加服务器：

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

使用前替换示例路径、URL 和 token。headers 使用显式值，不支持 `${VARIABLE}` 插值。stdio 连接还支持 `env` 和 `cwd`。设置 `enabled: false` 可以禁用服务器。

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

`mcp list` 是 `mcp servers` 的别名。列出已配置的服务器不会建立连接；发现和调用命令会建立连接，并在结束后关闭。HTTP 连接支持 Streamable HTTP 响应，包括 SSE。CLI 提供 MCP 客户端功能，不提供 MCP gateway。

`mcp tools` 默认每行只输出一个工具名。指定工具名可以查看说明与 schema，`--json` 保留完整元数据。`mcp info <server> [tool] --typescript` 将工具合同显示为按 server name 命名的 TypeScript 接口。省略工具名时显示该服务器的所有工具。

也可以直接连接 HTTP MCP server，无需保存配置：

```sh
woctl mcp --url https://wener.me/api/mcp --name wener-site tools wener-site
woctl mcp --url https://wener.me/api/mcp --name wener-site info wener-site search --typescript
```

第二条命令输出 `WenerSiteTools` 接口。

## AI 模型与提示词

添加 provider 和模型，再选择默认模型：

```sh
export OPENAI_API_KEY='your-api-key'
woctl provider add openai --api openai --url https://api.openai.com/v1 --api-key-env OPENAI_API_KEY
woctl model add chat --provider openai --id gpt-4.1
woctl model use openai/chat
woctl prompt 'Explain this error' --stream
```

支持 OpenAI Chat Completions、OpenAI Responses、Anthropic 和 Gemini 协议。模型 ID 使用 provider 实际提供的名称。添加 Anthropic 模型时需要设置 `--max-output-tokens`。

可以保存常用模板：

```sh
woctl prompt import summarize --text 'Summarize {{text}}'
woctl prompt render summarize --var text='An article to summarize'
woctl prompt @summarize --var text='An article to summarize'
```

`prompt render` 可离线使用。`--dump` 只展示脱敏后的请求，不发送网络请求。`--json` 要求模型返回 JSON object；`--output json` 输出完整响应，`--jsonschema` 用于结构化输出。`p` 是 `prompt` 的别名。

## 服务与输出

查看连接和可用操作：

```sh
woctl service providers
woctl service list --json
woctl service inspect search
woctl service call search search --input '{"query":"MCP protocol"}' --json
```

`service call` 的 `--input` 支持 JSON、`@file.json`，也可使用 `-` 从 stdin 读取。服务调用默认只允许只读操作，需要写操作时显式设置 `readOnly: false`，或在添加服务时使用 `--writable`。

HTTP 服务适配器对接兼容的服务接口：`GET /service/{id}/schema` 和 `POST /service/{id}/call`，与 MCP 的 HTTP transport 分开配置。

脚本中建议使用 `--json`。支持表格输出的命令也提供 `--output` 和 `--format` 字段选择，具体选项见各命令的帮助。

### 渲染文件

```sh
woctl render README.md --no-color
woctl render input.json --format table
woctl render article.md --format text -o article.txt
```

渲染器按文件名识别 Markdown、JSON、JSONL、YAML 和代码。读取 stdin 时可通过 `--input` 指定类型。在 `render` 命令中，`-o/--output` 指定输出文件，`-f/--format` 指定渲染格式。

## 排查问题

```sh
woctl info --json
woctl context check --json
woctl service verify --strict --json
woctl --verbose service list
```

`info` 显示运行环境和配置摘要，包括当前使用的配置文件。配置检查在离线状态下进行，不验证远端连通性或凭据。`--strict` 将不支持的服务类型等 warning 视为失败。日志写入 stderr，便于在管道中使用 JSON 输出。

查询具体命令的选项：

```sh
woctl mcp call --help
woctl search --help
woctl prompt --help
```

[源码](https://github.com/wenerme/wode/tree/develop/apps/woctl) · [反馈问题](https://github.com/wenerme/wode/issues)
