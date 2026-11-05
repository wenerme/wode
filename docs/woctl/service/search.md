# 统一网页搜索

`woctl search <query>` 按 `search` 能力选择服务，支持 DuckDuckGo 和 Exa。`woctl ddg search` 保留为 DuckDuckGo 专用入口。

```sh
woctl service add web-search --type duckduckgo
woctl service default set search web-search
woctl search 'TypeScript documentation' --limit 5
woctl search 'TypeScript documentation' --service web-search --json
woctl search --list-services --json
```

服务必须在当前 context 中配置并启用。选择顺序为显式 `--service`、search 能力默认、匹配的 provider 默认、唯一候选；有多个未消除歧义的候选时要求显式选择。帮助与服务列举仅检查本地描述，不解析凭据或联网。

Exa 可以同时提供搜索和页面抓取：

```sh
woctl service add research --type exa --option apiKey=env://EXA_API_KEY
woctl service default set search research
woctl service default set fetch research
woctl search 'Web Standards JavaScript' --service research --limit 5 --json
woctl fetch https://example.com/ --service research --json
```

调用前在环境中设置自己的 `EXA_API_KEY`；配置只保存引用。`woctl service type info exa` 可检查配置类型。

搜索支持 limit/offset、域名筛选、日期范围和可选正文、摘要、高亮等内容参数，具体选项见 `woctl search --help`。Exa 支持 search type/category 和 from/to，暂不支持 cursor 或 DuckDuckGo 的 range，limit + offset 不得超过 100。DuckDuckGo 仅处理其支持的 query/limit/offset/range，不提供 Exa 特定能力。

默认输出便于浏览的结果，根命令的 `--json` 返回 service/provider/query、带 rank 的 results、metadata 与可选 fetched；通用 `service call` 和 typed SDK 继续返回 items/metadata。`--raw --json` 显式请求已脱敏的供应商原始响应。`--fetch` 抓取首条结果，`--fetch-rank` 选择展示的绝对名次，`--fetch-limit`/`--fetch-offset` 选择抓取区间，`--fetch-service` 独立选择 fetch 服务。也可将结果中的 URL 传给 [fetch](fetch.md)。网络可达性、供应商额度和浏览器 CORS 由实际运行环境决定。
