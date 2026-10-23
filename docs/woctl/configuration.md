# 配置与服务选择

## Native 文件格式

默认入口是 `~/.wode/woctl.yaml`。`--config ./woctl.yaml` 优先于 `WOCTL_CONFIG`，后者优先于默认路径。只接受 `.yaml` / `.yml`；同目录、同扩展名的 `woctl.<context>.yaml` 是 context 文件。自定义 `team.yml` 对应 `team.dev.yml`。

基础文件 `woctl.yaml`：

```yaml
version: 1
currentContext: local
services:
  - name: search
    type: duckduckgo
  - name: db
    type: sqlite
    readOnly: true
    options:
      filename: ':memory:'
  - name: local-system
    type: system
defaults:
  services:
    duckduckgo: search
    sql: db
    system: local-system
```

context 文件 `woctl.dev.yaml`：

```yaml
title: 开发环境
services:
  - name: search
    type: duckduckgo
    options:
      timeout: 10000
  - name: reader
    type: base
defaults:
  services:
    duckduckgo: search
```

Native parser 要求 `services` 是数组，每项有唯一 `name`，并且有 `type` 或 `api`。两者同时提供时优先使用 `type`；建议仅填一个以避免误解。只写 `provider` 的数组项不合法。`defaults` 必须是 `{ services: { ... } }`，不能直接写 `defaults: { sql: db }`。内部内存索引的 services map 和 flat defaults 不属于 native 文件格式。

不支持在文件内写 `contexts`、`removeServices`。context 文件不能写 `version` 或 `currentContext`。名称匹配 `[a-zA-Z0-9][a-zA-Z0-9_.-]*`。同一文件内服务重名会报配置错误。

## Context 与覆盖

选择顺序：`--context/-c` → `WOCTL_CONTEXT` → 基础文件 `currentContext` → `local`。`context show/use/remove <name>` 的目标名称也参与本次目标选择。

```sh
woctl --config ./woctl.yaml context create dev
woctl --config ./woctl.yaml context list --json
woctl --config ./woctl.yaml -c dev context show --json
woctl --config ./woctl.yaml context use dev
woctl --config ./woctl.yaml -c local service list --json
```

非 `local` context 必须有对应物理文件。缺失基础文件或 `local` 文件可使用空配置；其他缺失 context 不会自动创建。`context use` 修改基础文件的默认选择；`-c` 只影响本次调用。

基础与 context 的服务按名称合并，**同名条目整条替换**，不是逐字段合并。defaults 按键覆盖。AI providers、prompts、MCP servers 也按名称覆盖；`defaultModel` 优先采用 context 值。

用同名 `disabled: true` 条目可以在 context 中禁止继承服务。也支持 `enabled: false`，两种标志不能矛盾。删除 context 自有条目后，继承项可能重新出现。没有删除继承服务的 tombstone 语法。

## 服务选择与默认值

SQL、DuckDuckGo、system 和 OpenObserve 的领域命令支持：

```sh
woctl -c local sql --list-services --json
woctl -c local sql query 'SELECT 1 AS value' --service db --json
woctl service default set sql db
woctl service default show --json
woctl service default unset sql
```

领域命令先取已启用且 provider 类型相符的候选项，依次使用显式 `--service`、该 provider 默认值、唯一候选服务。多个候选且没有默认值时会失败，必须显式选择；默认值无效也不会静默换连接。provider 别名会归一化；若同时给别名和正式名称设置不同默认值，会产生冲突。默认键推荐 `sql`、`duckduckgo`、`system`、`openobserve`。

`--list-services` 只用于领域根命令，例如 `sql --list-services`；不能与 `query` 等子命令合用，列出已启用项及默认标记，不连接服务。领域命令本身仍受 context 可见性过滤。

`service call <service> <tool>` 和 `service inspect <service>` 直接以位置参数指定服务，无需 `--service`，也不按 defaults 选择。MCP 以 server 位置参数选择；AI 以 `--model` / `--provider` 和 `defaultModel` 选择。它们没有该领域根命令的 `--list-services` 合同。typed registry 的默认值按能力注入，例如 `defaults: { fetch: 'reader' }`，不要把它当 native `defaults.services` 的完整 CLI 选择规则。

## 编辑与认证

```sh
woctl service add search --provider duckduckgo
woctl service add local-system --provider system
woctl service remove search
```

`service add` 的 `--provider` 是 CLI 选项名，保存时会转为规范数组条目。它只提供 `--url`、`--id`、`--writable` 等基本字段，SQL driver options 等复杂配置应直接编辑 YAML。默认 `readOnly: true`，`--writable` 保存为 `readOnly: false`。

配置编辑命令保存到所选 context 文件；基础服务条目由基础文件维护。`service remove` / `default unset` 只删除 context 自有项，不直接删除继承项。保存会重排 YAML、丢失注释，但保留允许的扩展字段。Native store 检查读取版本并使用锁及临时文件；出现 busy 或 changed 错误时重新加载，不要把它当作跨任意外部编辑器的事务保证。

| 环境变量 | 用途 |
| --- | --- |
| `WOCTL_CONFIG` | Native 配置入口 |
| `WOCTL_CONTEXT` | 本次 context |
| `WOCTL_LOG_LEVEL` | 日志级别 |
| `DOCS_AI_KEY` | 示例 AI `apiKeyEnv` 引用，需由使用者自行提供 |
| `OPENOBSERVE_TOKEN` | 示例 OpenObserve `accessTokenEnv` 引用，需由使用者自行提供 |

旧 `WOCLI_CONFIG/CONTEXT/LOG_LEVEL` 仍作为读取回退，`WOCTL_*` 优先。普通 `headers`、MCP `headers/env`、SQL URL 不执行 `${VAR}` 字符串插值；不要把假的环境变量占位符当成自动认证。AI 有明确的 `apiKeyEnv`，其用法见 [AI](service/ai.md)；OpenObserve 使用 `accessTokenEnv`、`usernameEnv`、`passwordEnv`，见 [OpenObserve](service/openobserve.md)。

## 宿主边界与核验

Native 使用文件 store、Node 环境变量和显式 SQL/MCP 适配器。Web 默认使用内存 store，可注入 browser storage、fetch、远程 runtime、文件 I/O；不会自动读取 native YAML、进程环境或本机文件。浏览器 storage 使用自己的序列化视图，不应直接复制内部 map 到 native 文件。

配置错误在 native CLI 通常退出 2；配置不可读时 `--help` 可展示核心命令，`info` 可用于恢复诊断。完整错误分类见 [命令约定](patterns.md#错误与退出码)。解析与保存证据对应 `packages/common/src/context/CliConfigLayer.test.ts`、`apps/woctl/src/native/config.test.ts`、`config-ownership.test.ts`、`native-config.integration.test.ts`；本轮仅核对源码，运行状态见 [覆盖表](coverage.md)。
