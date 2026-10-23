# woctl 中文使用文档

woctl 在终端中提供服务发现、SQL 查询、网页搜索、MCP 客户端、AI 文本生成和本地内容渲染。本文档按当前工作区源码描述行为；安装包与源码版本可能不同，以安装版本的 `--help` 为准。需要 Node.js 24.11 或更高版本。

```sh
npm install -g woctl
woctl --help
woctl version
```

## 从离线命令开始

```sh
woctl md --text '# Hello'
printf '{"name":"Ada","active":true}' | woctl render - --input json --format yaml
woctl info --json
```

渲染无需连接服务。配置文件可显式指定，所有后续示例都可加 `--config ./woctl.yaml`，避免使用现有个人配置。

创建以下 `woctl.yaml`：

```yaml
version: 1
currentContext: local
services:
  - name: search
    type: duckduckgo
  - name: local-system
    type: system
defaults:
  services:
    duckduckgo: search
    system: local-system
```

```sh
woctl --config ./woctl.yaml service list --json
woctl --config ./woctl.yaml ddg --list-services --json
woctl --config ./woctl.yaml system echo 'Hello' --service local-system --json
woctl --config ./woctl.yaml ddg search 'TypeScript documentation' --limit 5 --json
```

最后一条需要联网。领域命令只在所选 context 有相应已启用服务时显示；MCP 还需要宿主提供 MCP 连接能力。帮助、命令描述和执行使用同一次配置快照。缺少配置时先检查 `service list`、`context show`，不要据此推断安装包缺失功能。

## 阅读顺序

| 文档 | 内容 |
| --- | --- |
| [配置](configuration.md) | native 文件格式、context 合并、默认服务、环境变量和编辑流程 |
| [命令约定](patterns.md) | 真实命令形式、参数类型、文件输入、输出、只读和退出码 |
| [覆盖与证据](coverage.md) | 实现、离线测试源码、实际服务验证及未覆盖项 |
| [SQL](service/sql.md) | SQLite/PostgreSQL、绑定参数、SQL 文件、查询和确认写入 |
| [DuckDuckGo](service/duckduckgo.md) | `duckduckgo` / `ddg` 搜索 |
| [fetch](service/fetch.md) | 通用 service 调用及 typed SDK，当前没有顶级 fetch 命令 |
| [OpenObserve](service/openobserve.md) | 日志、stream、trace、字段查询、JSON/NDJSON 写入和设置管理 |
| [MCP](service/mcp.md) | stdio/HTTP 服务器、tools、resources、调用 |
| [AI](service/ai.md) | provider、model、prompt、模板、结构化和流式输出 |
| [system](service/system.md) | 离线服务调用链验证 |

## 通用发现与排错

```sh
woctl service providers
woctl service list --json
woctl context show --json
woctl service inspect search --json
woctl service schema search --json
woctl context check --json
woctl service verify --strict --json
```

`context check` 与 `service verify` 做配置诊断，不验证远端连通性、凭据或 SQL 数据库权限。`service verify` 的别名为 `check`。诊断日志通过 `--verbose` 或 `--log-level debug` 启用并写到 stderr；结构化结果写到 stdout。

公开示例仅使用占位域名、虚构环境变量名及自有临时文件。需联网的示例必须替换为自己控制且已授权的服务；它们不是实际连通性验证记录。
