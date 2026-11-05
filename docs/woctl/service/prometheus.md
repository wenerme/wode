# Prometheus service

`woctl prometheus`（别名 `woctl prom`）提供 Prometheus HTTP API 的只读查询，也适用于 VictoriaMetrics 的 Prometheus 兼容接口。它和 `woctl oo metric` 分开：前者返回 Prometheus 的 vector/matrix/scalar/string 结果，后者执行 OpenObserve metrics stream 的 SQL。

## 配置与发现

可以先添加服务并设置默认：

```sh
woctl service add metrics --type prometheus --base-url https://metrics.example.test
woctl service default set prometheus metrics
woctl service type info prometheus --json
woctl prometheus --help
```

命令随所选 context 的服务配置显示；没有启用的 Prometheus 服务时不显示 `prometheus` / `prom`。它是内置 provider，不需要额外安装 CLI 插件。多实例可用 `--service metrics` 显式选择。

等价的 YAML 配置示例：

```yaml
services:
  - name: metrics
    type: prometheus
    baseUrl: https://metrics.example.test
    readOnly: true
    options:
      accessTokenEnv: PROMETHEUS_TOKEN
      apiPrefix: /api/v1
      timeoutMs: 30000
      maxResponseBytes: 8388608
defaults:
  services:
    prometheus: metrics
```

`apiPrefix` 默认是 `/api/v1`，可用于兼容带部署前缀的 Prometheus 或 VictoriaMetrics。认证支持 Bearer、Basic 或普通 headers；凭据可以使用 `accessTokenEnv`、`usernameEnv`、`passwordEnv`，运行时才解析。帮助、配置检查、service list 和 schema 不读取环境变量，也不发网络请求。

```sh
woctl prom --help
woctl prom --list-services --json
woctl service schema metrics --json
woctl service verify --json
```

Prometheus service 固定为只读。配置 `readOnly: false` 会在创建 provider 时拒绝；当前没有 remote write、delete series 或管理 API。

## 查询命令

```sh
woctl prom query 'up' --json
woctl prometheus query --query 'up' --json
woctl prometheus query --query @query.promql --json
printf 'up' | woctl prometheus query --query - --json
woctl prom query 'rate(http_requests_total[5m])' --time now-5m --json
woctl prom range 'rate(http_requests_total[5m])' \
  --start now-1h --end now --step 60 --json
woctl prom series --match '{job="api"}' --json
woctl prometheus series --match '{job="api"}' --match '{job="worker"}' --json
woctl prom labels --json
woctl prom label-values job --match '{__name__="up"}' --json
woctl prom metadata --metric http_requests_total --json
```

`query` 是 instant query；`range` 是 `query_range`，省略 `--start`、`--end` 和 `--step` 时使用最近一小时和 60 秒步长。`series` 至少需要一个 `--match`。CLI 会把数字时间戳、ISO 时间和 `now`/`now-15m` 等相对表达式转换成 Prometheus 使用的 Unix 秒；client 保留 Prometheus 的秒时间语义，不转换为 OpenObserve 的微秒。

query/range 同时支持位置表达式与 `--query`，每次只能选择一种输入方式。`--query @file` 读取 PromQL 文件，`--query -` 从 stdin 读取，上限 16 MiB；输入准备完成后才解析凭据并创建客户端。`--match` 可重复传入，HTTP 使用重复的 `match[]` 参数。

`--output json` 保留协议 envelope。query 结果的 `data.resultType` 会标识 `vector`、`matrix`、`scalar` 或 `string`；`warnings` 也会保留。table 输出适合 labels、series 和 metadata，matrix 结果建议使用 JSON 保存，以免丢失 labels 和 samples。

## 与 wcli 的关系

wcli 的 `prom query` 使用通用 datasource runtime，可能把结果规整为 columns/rows。woctl 使用独立 typed client，保留 Prometheus 原始结果类型，并把 `query`、`query_range`、`series`、`labels`、`label values`、`metadata` 分成明确操作。wcli context 中的 datasource 配置不能直接当作 woctl native service；需要把 endpoint、组织/路径和认证按上面的 `services` 配置迁移。

真实验证时先使用 `prom --list-services` 和 `service verify`，再执行一个小的 `query up` 或 labels 查询。不要把空 datasource 列表解释为 Prometheus 服务不可用，它只说明当前 context 尚未配置 native Prometheus service。

## SDK 与安全边界

```ts
import { PrometheusClient } from '@wener/client/prometheus';

const client = new PrometheusClient({
  baseUrl: 'https://metrics.example.test',
  accessToken: 'EXAMPLE_TOKEN',
});
try {
  const result = await client.query({ query: 'up' });
  console.log(result.data.resultType);
} finally {
  await client.close();
}
```

client 只处理协议、DTO、认证、超时、取消、响应大小限制和关闭，不读取环境变量或 woctl 配置。服务端原始错误不会透传到 CLI；输出会递归脱敏 token、password、secret、authorization 等字段。查询表达式、认证值和完整服务端错误不进入诊断日志。

离线测试覆盖 URL 参数编码、认证、四种结果类型、warnings、协议错误、响应大小限制、取消/超时/close，以及 provider 的 schema 和只读策略。真实 Prometheus/VictoriaMetrics 端点需要在配置 native service 后单独验证。
