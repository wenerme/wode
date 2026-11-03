# OpenObserve service

`woctl openobserve`（别名 `woctl oo`）提供日志、指标、trace 查询，以及需要显式授权的 stream 设置、删除和日志写入。实现按协议 client → typed service/provider → CLI 分层；命令共用 [配置选择](../configuration.md) 和 [输入输出约定](../patterns.md)。

## 配置与发现

在当前 context 的服务配置中增加：

```yaml
services:
  - name: observe
    type: openobserve
    baseUrl: https://observe.example.test
    readOnly: true
    options:
      organization: default
      accessTokenEnv: OPENOBSERVE_TOKEN
      timeoutMs: 30000
      maxResponseBytes: 8388608
defaults:
  services:
    openobserve: observe
```

启动 CLI 前设置 `OPENOBSERVE_TOKEN`。`accessTokenEnv` 是环境变量名，运行时才由宿主读取；配置不会把 `${NAME}` 当作环境变量插值。也支持直接配置 `accessToken`。Basic auth 使用 `username`/`password`，或 `usernameEnv`/`passwordEnv`；Bearer 与 Basic 只能选择一种。直接值和对应的 `*Env` 不应同时配置。

```sh
woctl oo --help
woctl oo --list-services --json
woctl service schema observe --json
woctl oo health --service observe --json
woctl oo status --service observe --json
```

`type: oo` 是 provider 别名；配置服务名仍是 `observe`。`--service observe` 显式选择实例，没有该参数时按 defaults 或唯一候选选择；有多个候选且无默认值时拒绝猜测。help、服务列表和 schema 查询不解析凭据、不建立 HTTP 连接。

`health` 只调用 `/healthz`；`status` 还读取所选组织的 stream 目录，用于检查认证和组织访问。`status` 的 `reachable: false` 是结果字段，脚本应检查它，不能仅依赖进程退出码。URL 支持部署前缀，但不能含 userinfo、query 或 fragment。

## 命令树

```text
woctl oo health
woctl oo status
woctl oo stream list|ls
woctl oo stream schema [stream]
woctl oo stream settings [stream]
woctl oo stream update [stream] --input <JSON|@file|-> --yes
woctl oo stream delete|rm [stream] --yes [--delete-all]
woctl oo query|q|search [sql...]
woctl oo log query|q|search [sql...]
woctl oo metric query|q|sql [sql...]
woctl oo trace list|ls
woctl oo trace query|q|sql [sql...]
woctl oo values <field...>
woctl oo around <microseconds>
woctl oo ingest json [JSON|@file|-] --yes
woctl oo ingest multi [NDJSON|@file|-] --yes
```

公共选项为 `--org`、`--stream`、`--stream-type`（别名 `--type`）、`--service` 和输出选项。stream 参数可用位置参数或 `--stream` 提供。ingest 仅写入 logs。

## 浏览 stream 与设置

```sh
woctl oo stream list --type logs --limit 20 --offset 0 --json
woctl oo stream list --search app --fetch-schema --json
woctl oo stream schema app --keyword message --limit 20 --json
woctl oo stream settings app --json
```

stream 目录使用 `--search` 过滤名称，schema 使用 `--keyword` 过滤字段。列表和 schema 的 `--limit` 为 1–1000；`--offset` 为非负整数。settings 读取与 schema 共用服务端 schema endpoint。

## SQL、时间窗口与 trace

```sh
woctl oo query 'SELECT * FROM app ORDER BY _timestamp DESC' --type logs --from now-15m --size 50 --json
woctl oo query --stream app --text error --from now-1h --limit 100
woctl oo query --stream app --where "service = 'api'" --output table
woctl oo query @query.sql --from now-15m --json
woctl oo trace list --stream app_traces --from now-15m --size 20 --sort-by duration --sort-order desc --json
```

查询默认使用最近一小时。`--from`、`--to` 接受 ISO 时间、epoch microseconds、`now`、`now-15m`、`now-1h`、`now-1d` 等表达式；结束必须晚于开始，窗口最多 24 小时。分页用 `--offset` 与 `--size`（别名 `--limit`），size 为 1–1000。`--timeout` 是查询超时秒数，1–60；HTTP 仍受服务 `timeoutMs` 和调用方 AbortSignal 限制。

省略 SQL 时，`--stream` 生成倒序日志查询；`--text` 使用 `match_all()`，`--where` 追加 SQL 条件。直接 SQL 与生成 SQL 都经过单条只读查询校验。协议 client 的校验器独立于 SQLite/PostgreSQL 方言，不应把 OpenObserve 查询交给 SQL service driver。

SQL 读取支持内联、`@file` 与 `-`（stdin），最多 65536 UTF-8 字节。原始 SQL、filter、token、password 和 DSN 不进入 usage log；错误与服务端 function error 使用脱敏摘要。JSON 结果仍包含业务日志数据，保存或转发结果时应按数据本身的权限处理。

```sh
woctl oo values service level --stream app --from now-15m --size 20 --no-count --json
woctl oo around 1700000000000000 --stream app --size 20 --json
```

`values` 返回各字段的 distinct values，可用 `--keyword` 过滤值，`--no-count` 跳过计数。它采用相同时间窗口，但不使用 SQL offset 或 query timeout 选项。`around` 的位置参数是非负、安全整数的微秒时间戳，读取该时间附近的记录。

按数据类型的入口会强制查询对应的 stream type，避免把日志、指标和 trace 查询到错误的数据流：

```sh
woctl oo log query --stream app --text error --limit 20 --json
woctl oo metric sql --stream system_cpu_load_average_1m --limit 20 --json
woctl oo trace query --stream default --text request --limit 20 --json
```

这三个入口仍使用 OpenObserve 的只读 SQL 搜索协议；`metric` 不会把 SQL 结果伪装成 Prometheus matrix。PromQL 查询使用独立的 [Prometheus service](prometheus.md)，这样 VictoriaMetrics 和 OpenObserve SQL 的结果类型、时间单位和错误边界保持清晰。

## 写入、设置更新与删除

首先把目标服务配置改为 `readOnly: false`。下列专用命令还要求 `--yes`；缺少授权或确认时，在读取文件、解析凭据、建立连接之前拒绝。

```sh
woctl oo ingest json '[{"message":"example","service":"api"}]' --stream app --yes --json
woctl oo ingest json @events.json --stream app --yes --json
woctl oo ingest multi @events.ndjson --stream app --yes --json
printf '%s\n' '{"message":"example"}' | woctl oo ingest multi - --stream app --yes --json
woctl oo stream update app --input '{"data_retention":7}' --yes --json
woctl oo stream update app --input @settings.json --yes --json
woctl oo stream delete app --yes --json
```

`ingest json` 接受非空 JSON 对象数组；`ingest multi` 接受每行一个对象的 NDJSON；省略输入时读 stdin。单次最多 10000 条、请求体最多 1 MiB，不会自动分批。检查返回的 `status[].successful/failed`，HTTP 成功不表示每条记录都写入成功。

`stream update` 更新设置，不是重命名 stream。支持 retention、索引和全文检索字段等 client 已建模设置；数组设置用 `add/remove` 包装，例如 `{"index_fields":{"add":["service"]}}`。partition 使用对象，例如 `{"partition_keys":{"add":[{"field":"cluster","types":"value","disabled":false}]}}`，hash 类型为 `{"hash":16}`。本实现按已核对的官方源码协议处理；虽然部分官方文档展示 `set`，该源码版本仅处理 add/remove，因此 client 在发送前拒绝 set，避免无实际更新的成功响应。未知设置及非法取值在凭据解析前拒绝。删除默认 `delete_all=false`，只有显式 `--delete-all` 才请求删除关联资源。

typed service、typed tool client 和 schema/call adapter 都检查 `readOnly`。通用 `service call` 的写工具也要求 writable 与 `--yes`，参见 [通用确认边界](../patterns.md#只读与确认)。

## Client、service 与宿主边界

```ts
import { OpenObserveClient } from '@wener/client/openobserve';

const client = new OpenObserveClient({
  baseUrl: 'https://observe.example.test',
  organization: 'default',
  accessToken: 'EXAMPLE_TOKEN',
});
try {
  const result = await client.search({
    sql: 'SELECT * FROM app ORDER BY _timestamp DESC',
    startTimeMicros: 1700000000000000,
    endTimeMicros: 1700003600000000,
    size: 20,
  });
  console.log(result.hits);
} finally {
  await client.close();
}
```

client 只处理协议、DTO、认证、HTTP、增量响应大小检查、超时、取消和关闭。它使用 Web 标准，可注入 fetch；不读取环境变量或 woctl 配置。`close()` 会终止正在进行的请求和响应读取；底层自定义 stream 的 cancel 不完成时，也不会阻塞公开调用结束。统计 DTO 的 scanBytes/storageBytes 统一为 bytes，服务端 MiB 字段会转换。SDK 的兼容元信息 `readOnly: true` 不限制其写方法；直接使用 SDK 的宿主必须自行授权写入。

`@wener/common/service/openobserve` 提供 `IOpenObserveService` 与 provider；CLI definition 的入口是 `@wener/common/service/openobserve/cli`，也从 `@wener/common/service` 聚合导出。`registerBuiltinServices()` 注册工厂，按选择结果懒创建实例。服务策略由这一层实施。CLI 的 schema/call client 关闭自身调用作用域；共享 runtime 的生命周期由宿主负责。

输出遵循公共 renderer：`--json` 保留 typed result，table 对基础目录、schema、查询和 trace 使用字段投影；新增操作默认用公共对象 renderer。除脱敏外，字段投影会改变输出形状，见 [输出选项](../patterns.md#数据输出)。

## 覆盖矩阵与证据

| 能力 | Client 方法 | Typed service / runtime | CLI |
| --- | --- | --- | --- |
| health | `health` | ✓ | `health` |
| 认证和组织可达性 | `status` | ✓ | `status` |
| stream 目录 | `listStreams` | ✓ | `stream list` |
| schema | `getStreamSchema` | ✓ | `stream schema` |
| 设置读取/更新 | `getStreamSettings` / `updateStreamSettings` | ✓，更新检查 readOnly | `stream settings/update` |
| 删除 | `deleteStream` | ✓，检查 readOnly | `stream delete --yes` |
| 只读 SQL | `search` | ✓ | `query`、`log query`、`metric query`、`trace query` |
| trace 摘要 | `listTraces` | ✓ | `trace list` |
| distinct values | `getValues` | ✓ | `values` |
| 时间戳附近记录 | `searchAround` | ✓ | `around` |
| JSON / NDJSON 写入 | `ingestJson` / `ingestMulti` | ✓，检查 readOnly | `ingest json/multi --yes` |
| 认证、响应限制、取消、超时、关闭 | client lifecycle | 共享 signal / close | 宿主 signal |

当前离线证据：client 四个测试文件 252 项通过；service/provider/CLI 三个测试文件 27 项通过；woctl OpenObserve integration 覆盖类型入口。测试使用本地 fixture fetch，覆盖 URL/认证/DTO、错误脱敏、响应边界、取消、只读策略、JSON/NDJSON 序列化和确认先于文件/凭据/HTTP。三个相关包的 TypeScript 检查、CLI/web/shell bundle，以及消费 publish exports 的 unbundled client/service/CLI 导出检查通过；完整结果见 [覆盖页](../coverage.md)。

真实 OpenObserve 已通过 wcli context 做过只读验证：logs、metrics、traces stream、日志 SQL、指标 SQL 和 trace list 均可用；woctl 的真实端点回归仍需使用对应 native 配置执行。组织管理、用户/权限、告警、dashboard、pipeline、OpenObserve PromQL、OTLP ingestion 和 trace span 详情等 API 尚未实现；这里的覆盖指已列明的操作，不表示覆盖 OpenObserve 全部服务端 API。
