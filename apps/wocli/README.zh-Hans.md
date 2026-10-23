# woctl

在终端搜索网页、调用 MCP 工具、使用 AI 模型，以及渲染 Markdown 和结构化数据。通过 context 管理不同环境的服务连接。

[English](README.md)

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

npm 包包含一个 CLI bundle。安装后的命令是 `woctl`，同时保留 `wocli` 兼容别名。

## 快速上手

无需配置服务，即可渲染 Markdown 或转换数据：

```sh
woctl md --text '# Hello'
printf '{"name":"Ada","active":true}' | woctl render - --input json --format yaml
```

添加一个免费的 DuckDuckGo 搜索连接：

```sh
woctl service add search --provider duckduckgo
woctl ddg search 'MCP protocol' --limit 5 --json
```

领域命令会在当前 context 配置并启用相应服务后出现。如果找不到命令，先用 `woctl service list` 和 `woctl context show` 检查配置。

## 配置

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
woctl ddg search 'TypeScript documentation' --limit 5
woctl duckduckgo search 'MCP examples' --offset 10 --json
```

DuckDuckGo 搜索无需 API key。优先使用 Instant Answer 结果，无结果时回退到 HTML 搜索；非零 offset 直接使用 HTML 搜索。

配置了多个搜索连接时，可以显式选择，或设置默认连接：

```sh
woctl ddg search 'TypeScript' --service search --json
woctl service default set duckduckgo search
```

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
woctl mcp tools local-tools --json
woctl mcp info local-tools tool-name --json
woctl mcp call local-tools tool-name '{"query":"example"}' --json
woctl mcp resources local-tools --json
woctl mcp read local-tools 'resource://example' --json
woctl mcp grep '*search*' --json
```

`mcp list` 是 `mcp servers` 的别名。列出已配置的服务器不会建立连接；发现和调用命令会建立连接，并在结束后关闭。HTTP 连接支持 Streamable HTTP 响应，包括 SSE。CLI 提供 MCP 客户端功能，不提供 MCP gateway。

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

`prompt render` 可离线使用。`--dump` 只展示脱敏后的请求，不发送网络请求。`--json` 输出完整响应，`--jsonschema` 用于结构化输出。`p` 是 `prompt` 的别名。

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
woctl ddg search --help
woctl prompt --help
```

[源码](https://github.com/wenerme/wode/tree/develop/apps/wocli) · [反馈问题](https://github.com/wenerme/wode/issues)
