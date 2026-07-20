# @wener/mcp-cli

[English](./README.md) | 中文

一个轻量级的 CLI 工具，用于与 [MCP (模型上下文协议)](https://modelcontextprotocol.io/) 服务器交互。

## 特性

- **多源配置发现** - 自动发现来自 Claude、Cursor、Gemini、Codex 等的 MCP 配置
- **来源追踪** - 显示每个服务器配置的来源
- **去重处理** - 处理跨配置的重复服务器名称并发出警告
- **Agent 优化** - 专为 AI 编码代理设计
- **通用性** - 支持 stdio 和 HTTP MCP 服务器
- **可操作的错误信息** - 结构化的错误消息和恢复建议

## 安装

```bash
# 无需安装直接运行
npx -y @wener/mcp-cli
bunx @wener/mcp-cli
pnpx @wener/mcp-cli

# 或者全局安装
npm install -g @wener/mcp-cli
pnpm add -g @wener/mcp-cli
```

## 配置

CLI 按优先级顺序从多个来源发现 MCP 配置：

1. **项目级配置**（优先检查）：
   - `./.mcp-cli.local.json`（本地覆盖，最高优先级，gitignore）
   - `./.mcp-cli.json`（mcp-cli 专用，支持向上查找）
   - `./.mcp.json`（Claude 标准）
   - `./.cursor/mcp.json`
   - `./.gemini/mcp_config.json`
   - `./.codex/config.toml`（Codex TOML 格式）
   - `./mcp_servers.json`

2. **用户级配置**：
   - `~/.mcp-cli.local.json`
   - `~/.mcp-cli.json`
   - `~/.claude.json`（带 `mcpServers` 键）
   - `~/.cursor/mcp.json`
   - `~/.gemini/antigravity/mcp_config.json`
   - `~/.codex/config.toml`
   - `~/.mcp_servers.json`
   - `~/.config/mcp/mcp_servers.json`

> **提示**：使用 `.mcp-cli.local.json` 存储本地环境变量和密钥。将其添加到 `.gitignore` 以防止提交敏感数据。

### 配置格式

所有配置文件使用相同的基本结构：

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"]
    },
    "remote-server": {
      "url": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

**注意**：Gemini 配置使用 `serverUrl` 而非 `url` - 两者都支持。

### MCP-CLI 专用配置选项

`.mcp-cli.json` 和 `.mcp-cli.local.json` 文件支持额外选项：

```json
{
  "mcpServers": { ... },
  "extends": ["../shared-mcp.json", "~/.mcp-servers.json"],
  "discoveryConfig": false,
  "include": ["dev-*", "prod-*"],
  "exclude": ["*-test", "*-debug"]
}
```

| 选项 | 描述 |
|--------|-------------|
| `extends` | 要继承服务器的配置文件路径数组 |
| `discoveryConfig` | 设为 `false` 禁用自动发现；或设为数组如 `["gemini", "codex"]` 进行选择性发现 |
| `include` | 用于过滤服务器的 glob 模式（白名单）。只加载匹配的服务器 |
| `exclude` | 用于排除服务器的 glob 模式（黑名单）。优先于 include |

**Glob 模式语法**：
- `*` - 匹配任意字符（除 `/`）
- `**` - 匹配任意字符包括 `/`
- `?` - 匹配单个字符
- 不区分大小写匹配

**示例**：
```json
{
  "include": ["dev-*"],           // 只有 dev-* 服务器
  "exclude": ["*-mysql", "*-pg"]  // 排除数据库服务器
}
```

```json
{
  "discoveryConfig": ["codex", "gemini"]  // 只发现 codex 和 gemini 配置
}
```

### 通过环境变量的内联配置

可以通过 `MCP_CLI_CONFIG_INLINE` 环境变量直接传递配置：

```bash
MCP_CLI_CONFIG_INLINE='{"mcpServers":{"test":{"command":"echo"}}}' mcp-cli servers
```

这具有最高优先级，支持所有选项包括 `extends` 和 `discoveryConfig`。

### 环境变量替换

在配置中任意位置使用 `${VAR_NAME}` 语法。值在加载时被替换。

CLI 还会从 Claude 设置文件读取环境变量：
- `~/.claude/settings.json`
- `.claude/settings.local.json`

缺失的环境变量会产生警告（而非错误），原始的 `${VAR}` 会保留在配置值中。

## 使用方法

```bash
mcp-cli [options] [command]
```

### 全局选项

| 选项 | 描述 |
|--------|-------------|
| `-c, --config <path>` | 指定配置文件路径 |
| `-j, --json` | 以 JSON 格式输出（用于脚本） |
| `-d, --with-descriptions` | 包含工具描述 |
| `-h, --help` | 显示帮助 |
| `-V, --version` | 显示版本 |

### 命令

#### `servers` - 列出所有服务器和工具

```bash
# 列出所有服务器
mcp-cli servers

# 包含描述
mcp-cli servers -d

# 显示配置来源
mcp-cli servers --show-sources

# JSON 输出
mcp-cli servers --json
```

#### `tools [server]` - 列出可用工具

```bash
# 列出所有服务器
mcp-cli tools

# 列出特定服务器的工具
mcp-cli tools filesystem
```

#### `grep <pattern>` - 按 glob 模式搜索工具

```bash
# 查找文件相关工具
mcp-cli grep "*file*"

# 带描述搜索
mcp-cli grep "*search*" -d
```

#### `info <target>` - 显示服务器或工具详情

```bash
# 显示服务器详情
mcp-cli info filesystem

# 显示工具 schema
mcp-cli info filesystem/read_file
```

#### `call <target> [args]` - 执行工具

```bash
# 使用 JSON 参数调用工具
mcp-cli call filesystem/read_file '{"path": "./README.md"}'

# 从 stdin 读取 JSON（使用 "-" 明确从 stdin 读取）
echo '{"path": "./file"}' | mcp-cli call server/tool -

# 使用 heredoc 处理复杂 JSON（使用 <<'EOF' 防止变量展开）
mcp-cli call server/tool - <<'EOF'
{"content": "Text with 'quotes' and $variables"}
EOF

# 多行 SQL 查询示例
mcp-cli call mysql/exec_query - <<'EOF'
{
  "query": "SELECT * FROM users WHERE status = 'active' LIMIT 10"
}
EOF
```

#### `resources [server]` - 列出 MCP 资源

```bash
# 列出所有服务器的资源
mcp-cli resources

# 列出特定服务器的资源
mcp-cli resources filesystem
```

#### `read <target>` - 读取 MCP 资源

```bash
mcp-cli read filesystem/file:///path/to/file
```

#### `add` - 添加 MCP 服务器配置

将服务器配置添加到 `.mcp-cli.json`。遵循 Claude 的语法。

```bash
# 添加 HTTP 服务器
mcp-cli add --transport http notion https://mcp.notion.com/mcp

# 添加 SSE 服务器
mcp-cli add --transport sse asana https://mcp.asana.com/sse

# 添加 stdio 服务器（默认传输方式）
mcp-cli add airtable npx -y airtable-mcp-server

# 添加带环境变量的 stdio 服务器
mcp-cli add --env AIRTABLE_API_KEY=YOUR_KEY airtable npx -y airtable-mcp-server

# 添加多个环境变量
mcp-cli add -e API_KEY=key1 -e SECRET=secret2 myserver npx my-server
```

#### `rm <names...>` - 移除 MCP 服务器配置

从 `.mcp-cli.json` 移除服务器配置。

```bash
# 移除单个服务器
mcp-cli rm notion

# 移除多个服务器
mcp-cli rm notion asana airtable
```

#### `dump <format>` - 导出工具为各种格式

```bash
# 导出为 chat-completions 格式（使用 server__tool 命名）
mcp-cli dump request-tools

# JSON 输出（包含错误信息）
mcp-cli dump request-tools --json
```

## 环境变量

| 变量 | 描述 | 默认值 |
|----------|-------------|---------|
| `MCP_CLI_CONFIG_INLINE` | 内联 JSON 配置（最高优先级） | (无) |
| `MCP_CONFIG_PATH` | 配置文件路径 | (无) |
| `MCP_DEBUG` | 启用调试输出 | `false` |
| `MCP_TIMEOUT` | 请求超时（秒） | `1800`（30 分钟） |
| `MCP_CONCURRENCY` | 并行服务器连接数 | `5` |
| `MCP_MAX_RETRIES` | 瞬态错误重试次数 | `3` |
| `MCP_RETRY_DELAY` | 基础重试延迟（毫秒） | `1000` |
| - | 缺失环境变量现在只是警告（不再报错） | - |

## 与 AI Agent 配合使用

将以下内容添加到你的 AI agent 系统提示中：

```
MCP CLI 命令
你可以使用 `mcp-cli` CLI 命令与 MCP 服务器交互。

**强制前置条件**
在任何 'mcp-cli call <server>/<tool>' 之前，你必须先调用 'mcp-cli info <server>/<tool>'。

可用命令：
# 步骤 1：始终先检查 schema（强制）
mcp-cli info <server>/<tool>             # 任何调用前必需
# 步骤 2：检查 schema 后才能调用
mcp-cli call <server>/<tool> '<json>'    # 仅在 mcp-cli info 之后运行
mcp-cli call <server>/<tool> -           # 从 stdin 读取 JSON 调用

# 发现命令
mcp-cli servers                          # 列出所有连接的 MCP 服务器
mcp-cli tools [server]                   # 列出可用工具
mcp-cli grep <pattern>                   # 搜索工具名称和描述
mcp-cli resources [server]               # 列出 MCP 资源
mcp-cli read <server>/<resource>         # 读取 MCP 资源
mcp-cli dump request-tools               # 导出 chat-completions 格式的工具
```

## 开发

```bash
# 运行测试
pnpm test

# 开发模式运行
npx tsx src/index.ts --help

# 构建
pnpm build
```

## 参考

- [philschmid/mcp-cli](https://github.com/philschmid/mcp-cli) - 一个基于 Bun 的轻量级 MCP CLI，启发了本实现
- Claude Code 的实验性 MCP CLI（`ENABLE_EXPERIMENTAL_MCP_CLI=true mcp-cli`）
- [system-prompt-mcp-cli.md](./system-prompt-mcp-cli.md)
  - https://github.com/Piebald-AI/claude-code-system-prompts/blob/main/system-prompts/system-prompt-mcp-cli.md

## 许可证

MIT
