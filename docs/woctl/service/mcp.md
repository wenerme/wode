# MCP 客户端

woctl 通过 native MCP 宿主连接 stdio 或 HTTP server，发现并调用 tools、读取 resources。当前 CLI 是客户端，不提供 MCP gateway。MCP 使用 `mcpServers`，不属于 services 数组的 provider 选择流程。

## 配置

在基础文件或 context 文件中加入：

```yaml
services: []
defaults:
  services: {}
mcpServers:
  local-tools:
    transport: stdio
    command: node
    args: [./fixtures/mcp-server.mjs]
    enabled: true
  remote-tools:
    transport: http
    url: https://mcp.example.test/mcp
    timeout: 30000
```

本地脚本须是自己提供的真实 MCP server，示例不会生成它。stdio 还支持 env/cwd，HTTP 支持 headers，值均为显式字符串；没有 `${DOCS_MCP_TOKEN}` 插值。timeout 是毫秒正整数，配置 schema 上限 300000。`enabled: false` 禁止使用该 server。context 同名 server 整条替换基础项，见 [配置](../configuration.md)。

## 实际命令树

```text
mcp
  servers / list
  tools [server]
  resources [server]
  info <server> [tool]
  call <server> <tool> [input]   --input / -i
  read <server> <uri>
  grep <pattern>
```

```sh
woctl -c dev mcp --help
woctl -c dev mcp call --help
woctl -c dev mcp servers --json
woctl -c dev mcp tools local-tools --json
woctl -c dev mcp info local-tools search --json
```

servers/list 只列配置，不连接；tools/resources 不指定 server 时顺序访问全部启用项。call/read/info 明确使用 server 位置参数，不支持 `--service` 或 `--list-services`；也不使用 `defaults.services` 消除歧义。只有宿主提供 MCP 且 context 配置了 server 时，mcp 命令才可见。

## 输入、资源与输出流程

先发现工具 schema，再按必填字段构造输入（以下 search 为假设的服务器工具名）：

```sh
woctl mcp call local-tools search '{"query":"example"}' --json
woctl mcp call local-tools search --input @tool-input.json --json
printf '{"query":"example"}' | woctl mcp call local-tools search --input - --json
woctl mcp resources local-tools --json
woctl mcp read local-tools 'resource://example' --json > resource.json
woctl mcp grep '*search*' --json
```

call 输入默认 `{}`；JSON 必须为对象，不能为数组或 null。位置 input 优先于 `--input`。文件和 stdin 共用 16 MiB 文本上限。grep 使用不区分大小写的 glob 风格匹配，支持 `*` 和 `?`，匹配 server/tool 名及 description，不是完整正则。

call/read 默认提取 text 内容，无法提取时显示 JSON 文本；`--json` 输出完整结果。单独设置 `--output yaml` 不会让这两个命令切到结构化分支。servers/tools/resources/info/grep 使用普通数据 renderer，可按 [命令约定](../patterns.md) 设置 output/format。连接在命令结束的 finally 中关闭，工具/资源发现也会建立连接。

## 权限、错误与宿主

MCP call 没有通用 service readOnly 或 `--yes` 确认门槛。调用前先核对 tool 的作用、schema 与服务器授权，不应把 tools annotations 当作 CLI 已强制执行的权限策略。工具返回业务错误结果时未必抛异常，需要检查完整 JSON；进程退出 0 不代表所有远端业务成功。

未知/禁用 server、未知 tool、输入错误通常退出 2；连接、协议、网络异常通常退出 1；native 取消异常退出 130。HTTP 支持 Streamable HTTP/SSE，不等同于通用 `http` service transport。Web 默认没有 MCP host，不能启动 stdio；自定义宿主即使注入 MCP，也须自行处理浏览器网络及 CORS 限制。

实现：`apps/woctl/src/commands/mcp.ts`、`native/mcp.ts` 和 `packages/wener-client/src/mcp/connectMcpServer.ts`。离线证据在 `commands/mcp.test.ts` 与 `connectMcpServer.test.ts`。CLI 测试通过，client 本轮未重跑，未连接真实服务器；最终运行状态统一见 [覆盖表](../coverage.md)。
