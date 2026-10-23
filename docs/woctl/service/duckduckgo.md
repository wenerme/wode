# DuckDuckGo 搜索

领域名为 `duckduckgo`，短别名 `ddg`，无需 API key。搜索先尝试 Instant Answer，无可用结果时回退 HTML；offset 大于零时直接使用 HTML。

## 配置与发现

`woctl.yaml`：

```yaml
services:
  - name: web-search
    type: duckduckgo
    options:
      timeout: 10000
defaults:
  services:
    duckduckgo: web-search
```

```sh
woctl --config ./woctl.yaml ddg --help
woctl --config ./woctl.yaml ddg --list-services --json
woctl --config ./woctl.yaml ddg search --help
woctl --config ./woctl.yaml service inspect web-search --json
```

同类多个服务时用 `--service web-search` 或 `service default set duckduckgo web-search`；没有默认值且候选不唯一会失败。`-c dev` 选择相应 context 文件及合并配置，格式见 [配置](../configuration.md)。根 `--list-services` 只列启用服务，不与 search 合用。

可选 `baseUrl` 指 Instant Answer 端点；`options.instantAnswerBaseUrl` 优先于 baseUrl。HTML 回退必须另用 `options.htmlBaseUrl`；不要以为 baseUrl 会改两个端点。options 另支持 `userAgent` 和毫秒 `timeout`，不接受未知键。自定义端点应是自己的测试代理，例如 `https://search.example.test/instant` 与 `https://search.example.test/html`；端点需实现对应上游协议，不是任意网页。

## 命令与查询流程

```text
duckduckgo / ddg
  search <query>   --limit <整数> --offset <整数>
```

```sh
woctl ddg search 'TypeScript documentation' --service web-search --limit 5 --json
woctl duckduckgo search 'MCP protocol' --service web-search --offset 10 --limit 5 --output yaml
woctl service call web-search search --input '{"query":"MCP protocol","limit":5,"offset":0}' --json
woctl service call web-search search --input @search.json --json
printf '{"query":"MCP protocol","limit":5}' | woctl service call web-search search --input - --json
```

`search.json` 与内联 JSON 相同。领域 search 只接收一个非空 query 位置参数，含空格时需引号；没有 `--query-file`。limit 默认 10，要求正安全整数；offset 默认 0，要求非负安全整数。generic tool 只接受 query/limit/offset，不接受其他字段；typed search 能力的扩展字段不自动成为 CLI 参数。

当前 builtin typed adapter 的结果是 `items` 列表（url/title/summary）与 `metadata`（query/source），不要依赖旧客户端的 `results/snippet` 结构。脚本用 `--json` 保存原始结构：

```sh
woctl ddg search 'MCP protocol' --service web-search --json > search-results.json
```

普通 renderer 和字段投影规则见 [命令约定](../patterns.md)，嵌套 items 不应假设已自动展开为行。通用文件输入共同上限为 16 MiB；响应不是 CLI 的逐条流式输出。

## 只读、限制与证据

搜索工具声明 readOnly；不需要 `--yes`，无需将服务改成 writable。query/limit/offset 的领域参数错误通常退出 2，网络/上游失败通常退出 1，native 取消异常退出 130；generic provider 校验异常可能是 1。

Node 使用网络 fetch；Web 需要 fetch 可用且端点允许 CORS；远程 runtime 可承接通用 schema/call，但必须自行保证服务端权限与 DuckDuckGo 网络可达性。公网返回格式、限速及可用性不由本地 fixture 保证。

源码：`apps/woctl/src/services/duckduckgo.ts`、`packages/wener-common/src/service/providers/duckduckgo.ts`。测试源码：对应 `duckduckgo.test.ts`、`providers/search.service.test.ts`、`apps/woctl/src/search.integration.test.ts`。离线 provider 与应用测试通过，未调用公网；最终运行状态统一见 [覆盖表](../coverage.md)。
