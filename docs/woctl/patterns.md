# 命令、输入与输出约定

以下区分当前已实现形式和扩展时应保持的一致性。每条命令的实际能力以其 `--help` 与服务页命令树为准。

## 命令结构

```text
woctl [全局选项] <领域名或短别名> [资源] <操作> [位置参数] [选项]
woctl service call <配置服务名> <工具名> --input <JSON|@文件|->
```

领域名不等于配置服务名。例如 `ddg search ... --service web-search` 中，`ddg` 是 `duckduckgo` 别名，`web-search` 是用户配置名称。

| 形式 | 当前实例 | 边界 |
| --- | --- | --- |
| 领域短别名 | `duckduckgo/ddg`、`openobserve/oo`、`prompt/p`、`context/ctx` | SQL、system 无领域短别名 |
| 资源 `list/ls` | `sql table list/ls`、`provider list/ls`、`model list/ls`、`prompt list/ls` | 不能推断每个 list 都有 ls |
| `show` | `context show`、`provider show`、`model show`、`prompt show` | SQL 表详情为 `table info/describe/desc` |
| `query` | `sql query/q`、`oo query/q/search` | DDG 是 `search`，MCP 是 `call/read` |
| 通用服务入口 | `service list/add/remove/schema/inspect/call/default/providers/verify` | `verify` 有 `check` 别名；其他别名须看 help |
| 同类服务枚举 | `sql/system/ddg/oo --list-services` | 仅根命令，不适用于 MCP/AI/fetch |

后续扩展宜沿用资源 `list`（需要时提供 `ls`）、详情 `show`、查询 `query` 的一致语义，但不能据此把尚未存在的命令写进脚本。

```sh
woctl -c dev sql --help
woctl -c dev sql table info --help
woctl -c dev sql --list-services --json
woctl -c dev sql query 'SELECT 1' --service db --json
```

`--context/-c` 是全局单个字符串选项；领域 `--service` 也是单个字符串；`--list-services` 是布尔值。服务选择、默认值和歧义规则见 [配置](configuration.md)。帮助和服务枚举不建立客户端连接，但仍读取所选配置。

## 参数类型与文件输入

选项没有声明为 boolean 时接受字符串；整数、JSON、URL 等由相应命令进一步校验。可重复参数只在显式声明时使用，例如 SQL `--var`、prompt `--var/--input/--prompt/--message`。不要把 `--limit` 当重复列表或把 `--params` 当对象。

| 入口 | 格式 | 上限和语义 |
| --- | --- | --- |
| `service call --input/-i` | JSON、`@input.json`、`-` | 默认 `{}`；共同文本读取上限 16 MiB，工具再校验字段 |
| `mcp call [input]` 或 `--input/-i` | JSON 对象、`@input.json`、`-` | 16 MiB；位置 input 优先，数组/null 不合法 |
| SQL statement | 内联 SQL、`@query.sql/json/yaml/yml`、`-` | 1 MiB；stdin 作为纯 SQL |
| SQL `--params` | JSON 数组、`@params.json` | 1 MiB；不是命名参数对象，裸 `-` 不读取 stdin |
| SQL `--var` | 可重复 `1=value` | 从 1 开始的位置绑定；值先尝试 JSON，失败保留字符串 |
| OpenObserve query | 内联 SQL、`@query.sql`、`-` | 65536 UTF-8 字节；单条只读查询 |
| OpenObserve ingest / settings | JSON、NDJSON、`@文件`、`-` | 1 MiB；ingest 最多 10000 条；专用写命令要求 writable 和 `--yes` |
| prompt 内容/变量/schema | 内联、`@文件`、适用入口的 `-` | 每次共同文本读取 16 MiB，非整个请求总上限 |

```sh
woctl service call search search --input @search.json --json
printf '{"query":"MCP"}' | woctl service call search search --input - --json
woctl sql query @query.sql --params @params.json --service db --json
```

输入 `@文件` 与 stdin 依赖宿主提供 `readText`。Node 提供实际文件/管道读取；浏览器和虚拟 shell 由宿主决定。SQL 文件流程和覆盖优先级见 [SQL](service/sql.md)。这些上限不表示 HTTP 响应或结果集已实现流式限流。

## 数据输出

普通数据命令使用以下解析规则：

| 选项 | 类型与作用 |
| --- | --- |
| `--json` | boolean；选择 JSON，未指定字段时输出完整数据 |
| `--output/-o json` | string；选择 renderer：table、wide、describe/desc、json、jsonl、yaml/yml、csv、md/markdown、name、value |
| `--format/-f name,provider` | string；唯一、逗号分隔的字段投影，不是文件路径 |
| `--format 'json(name,provider)'` | string；renderer 与投影组合，不能和冲突的 output 合用 |

```sh
woctl service list --output yaml
woctl service list --output csv --format name,provider
woctl service list --format 'json(name,provider)'
```

`--json` 与 `--output yaml` 等不兼容形式会报错；与字段投影合用后不再是完整对象。SQL 表格模式使用列名/行或对象列表的专用投影，JSON 保留原始结果结构。

有明确的命令例外：

- `prompt` 生成时 `--json` 要求模型返回 JSON object，完整响应用 `--output json`；支持的生成输出为 text/json/jsonl/md/markdown。
- `prompt render --json` 输出渲染结果对象；目录类子命令沿用普通数据输出。
- `mcp call/read` 仅 `--json` 进入结构化结果输出，默认提取文本；不要靠 `--output yaml` 改变该默认分支。
- `render -o/--output` 是输出文件，`-f/--format` 是渲染格式，`--input` 是输入类型。

重定向普通数据输出使用 shell，例如 `woctl sql query 'SELECT 1' --json > result.json`。

## 只读与确认

服务默认 `readOnly: true`。通用 runtime 仅允许 schema 明确声明 `readOnlyHint: true` 的工具；未知操作、禁用服务、未知服务会被拒绝。`inspect --writable` 只是显示更多工具，不授予执行权限。

SQL `query` 永远走只读路径，`exec` 要求配置 `readOnly: false` **并且**传入 `--yes`。没有交互式确认提示。SQL 的解析器检查与数据库只读措施共同限制操作，不应把单层 SQL 字符串检查当作数据库权限替代品。

OpenObserve query 也只接受单条只读查询；`stream update/delete` 与 `ingest json/multi` 要求 `readOnly: false` 及 `--yes`，先检查策略和确认再读取输入、解析凭据或发送请求。

`--yes` 不是全局选项。通用 `service call` 先检查 schema；未明确声明 `readOnlyHint: true` 的工具要求服务 `readOnly: false` 及 `--yes`，再读取文件或 stdin。OpenObserve 的通用调用输出也经过同一脱敏边界。直接调用 typed SDK 或 runtime 不包含 CLI 确认，宿主应自行授权；远程 runtime 的 schema 查询可能需要 HTTP，服务端仍须实施权限。MCP `call` 没有统一只读/确认策略，tool 是否修改数据取决于服务器。AI 生成可能产生费用，并不受 service readOnly 管理。配置 add/remove/use 是本地配置写入，按其命令直接保存，不要求 `--yes`。

## 错误与退出码

Native CLI 的成功退出码通常为 0。错误文本写到 stderr，前缀为 `woctl:`；不要要求 stdout 在失败时一定包含 JSON 错误对象。

| 退出码 | 条件 |
| --- | --- |
| 0 | 正常执行；仍需检查服务结果中的业务状态，例如 MCP tool result |
| 2 | `CliUsageError` / `CliConfigError`，包括大多数参数、选择、配置错误 |
| 1 | 其他异常，包括部分 provider 校验、连接/上游错误 |
| 130 | native 收到取消信号并导致执行异常 |

诊断命令可主动返回非零状态，参见对应帮助。不是所有输入错误都会被转换为 2；JSON schema 库或 provider 的普通异常可能走 1。Web/shell 嵌入宿主接收返回值或异常，不能假定有进程退出码。

## 流与宿主

Node prompt 在 `--stream --output text` 且宿主提供 `write` 时逐块输出；其他输出通常等待完整结果。CliIO 已有基础 WebStream adapter，但当前不能承诺完善的 drain、背压、取消和 abort 传播保障。fetch 先读取响应文本再截取内容，SQL 返回分页结果，不属于终端流式结果协议。

远程 runtime 可注入应用宿主；内置 `http` 服务使用 `GET /service/{id}/schema` 和 `POST /service/{id}/call`，与 MCP HTTP transport 独立。客户端的本地只读检查不能替代服务端授权。浏览器还受 CORS、网络可达性和宿主注入能力约束。
