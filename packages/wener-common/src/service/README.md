# 服务能力与 Provider

`ISearchService` 定义搜索能力，DuckDuckGo 等搜索引擎实现同一个接口，返回统一的 `items`。`IFetchService` 定义页面内容获取能力，Jina 和基础 Web Fetch 实现返回统一的 `content`。供应商 HTTP API 客户端保留在 `@wener/client`。

```ts
import { ServiceRegistry } from '@wener/common/service';
import { registerBuiltinServices } from '@wener/common/service/builtin';
import { normalizeCliServices } from '@wener/common/service/config';

const registry = registerBuiltinServices(new ServiceRegistry({
  context: {
    services: normalizeCliServices([
      { name: 'web-search', type: 'duckduckgo' },
      { name: 'reader', type: 'jina' },
      { name: 'direct-page', type: 'base' },
    ]),
  },
  defaults: { search: 'web-search', fetch: 'reader' },
}));

try {
  const search = await registry.load('search');
  const results = await search.search({ query: 'TypeScript' });
  const reader = await registry.load('fetch');
  const page = await reader.fetch({ url: results.items[0].url });
} finally {
  await registry.close();
}
```

统一注册安装 provider factory，不会自动创建服务实例或发起网络请求。配置指定实例名称和 provider；`ddg` 是 DuckDuckGo 别名，`direct` 是 `base` 别名。多个同能力实例需要指定名称或配置默认值，歧义会报错。实例按配置懒创建、并发复用，由 registry 统一关闭。

新增 provider 使用 `registry.register({ name, provides, create })`。`provides: ['search']` 的 factory 返回 `{ search: ISearchService }`，同时提供两种能力时返回 `{ search, fetch }`。注册契约不依赖 CLI；`createBuiltinServiceProviders()` 将同一组 provider 适配成旧 schema/call transport。

基础 fetch 保留响应文本及 content-type，不承诺正文提取或 HTML 转 Markdown；Jina 通过 Reader API 返回处理后的页面内容。具体 provider 对不支持的输入选项报错，避免静默忽略查询条件。旧 `createDuckDuckGoProvider()` 保留原始返回格式供兼容调用，新的 registry 和 woctl 默认路径使用统一搜索响应。

SQL 使用同一套 typed registry：`type: sqlite`、`type: postgres` 等配置实例由 `sql` capability 选择，`ISqlService` 提供 `query`、`exec`、`ping`、`listObject` 和 `describeObject`。`woctl sql query` 始终只读，`woctl sql exec` 必须带 `--yes`；参数通过 `params` 或 `--var` 独立绑定，SQL 文本不会插值。表发现走对象 API，CLI 不拼接 `information_schema`。Native host 注入 SQLite/PostgreSQL driver，浏览器 host 可以使用远程 schema/call runtime。

OpenObserve 使用 `type: openobserve`（别名 `oo`）与 `openobserve` capability；先由独立 `@wener/client/openobserve` 实现协议，再由 typed provider 生成 schema/call 与 CLI。`IOpenObserveService` 提供 health/status、stream 目录/schema/设置/删除、SQL/trace/values/around 查询和 JSON/NDJSON 写入；service 与 adapter 都检查只读策略，CLI 写命令另要求 `--yes`。凭据的 `accessTokenEnv/usernameEnv/passwordEnv` 在懒创建时通过宿主 `getEnv` 解析，help/schema 不读取秘密。完整配置、流程及覆盖见仓库 `docs/woctl/service/openobserve.md`。
