# 页面内容获取（fetch）

通过 `woctl fetch <url>` 获取页面，也可使用 `IFetchService` typed SDK 或通用 `service call`。可选 provider 为 `base`（别名 `direct`）、`jina` 和 `exa`，与搜索共用服务注册、context 和默认服务选择机制。

## 配置与发现

`woctl.yaml`：

```yaml
services:
  - name: reader
    type: base
  - name: extracted-reader
    type: jina
    options:
      timeout: 10000
defaults:
  services:
    fetch: reader
```

base 直接获取目标 URL，只支持配置 headers，不接受 baseUrl，也不接受 options 中额外键。jina 和 exa 支持 baseUrl、headers 以及 `options.apiKey/timeout`；凭据可使用 `env://NAME` 延迟引用，由宿主在实际调用时解析。baseUrl 若设置为 `https://reader.example.test/`，需要是实现兼容协议的 reader 服务。

```sh
woctl --config ./woctl.yaml service --help
woctl --config ./woctl.yaml service call --help
woctl --config ./woctl.yaml service list --json
woctl --config ./woctl.yaml service inspect reader --json
woctl --config ./woctl.yaml service schema extracted-reader --json
woctl --config ./woctl.yaml fetch --help
woctl --config ./woctl.yaml fetch --list-services --json
```

顶级 fetch 使用 `--service <name>` 显式选择，也可通过 `service default set fetch <name>` 设置默认。没有默认且候选不唯一时会失败。`--list-services` 列出当前可用的 fetch 服务，帮助和列举不会建立连接。generic 入口直接以位置参数选择 reader。`-c dev` 切换所选服务目录；native 使用规范数组及 defaults.services，见 [配置](../configuration.md)。

## 调用、文件与结果

```text
service call <reader服务名> fetch --input <JSON|@文件|->
```

```sh
woctl fetch https://example.com/ --service reader
woctl fetch https://example.com/ --service reader --no-main --json
woctl fetch https://example.com/ --service extracted-reader --max-characters 2000 --metadata
woctl service call reader fetch --input '{"url":"https://example.com/","maxCharacters":2000}' --json
woctl service call extracted-reader fetch --input @fetch.json --output yaml
printf '{"url":"https://example.com/","maxCharacters":2000}' | woctl service call reader fetch --input - --json > page.json
```

`fetch.json`：

```json
{"url":"https://example.com/","maxCharacters":2000}
```

请求支持 url、maxCharacters、text、summary、highlights、live、main、metadata 和 raw，各 provider 的支持程度不同。URL 必须是 HTTP(S)，不能带用户名密码；maxCharacters 为正安全整数。输入文件上限 16 MiB。返回 url、content，及可选 contentType/title/summary/highlights/description/publishedDate/author/metadata。

普通输出显示正文；base 会将 HTML 转为 Markdown，默认提取正文，`--no-main` 保留完整转换内容。`--json`/`--output yaml` 返回规范化结构。`--raw` 显式请求供应商原始响应，认证字段和已知凭据会被移除或遮盖，默认不会附带 raw。`--live` 请求尽量跳过缓存，最终行为取决于 provider。

maxCharacters 对最终内容执行字符串截取，**不限制下载字节或响应读取内存**。base 先执行 response.text() 再截取；这不是大文件下载或流式传输接口。输出选择和重定向见 [命令约定](../patterns.md)。

## Typed SDK

```ts
import { ServiceRegistry } from '@wener/common/service/registry';
import { registerBuiltinServices } from '@wener/common/service/builtin';

const registry = registerBuiltinServices(new ServiceRegistry({
  context: { services: { reader: { provider: 'base', readOnly: true } } },
  defaults: { fetch: 'reader' },
}));
try {
  const reader = await registry.load('fetch', 'reader');
  const page = await reader.fetch({ url: 'https://example.com/', maxCharacters: 2000 });
  console.log(page.content);
} finally {
  await registry.close();
}
```

这是显式构造的内部 SDK context，不是 native YAML。registry 按能力 load，可显式选名；未显式选择时按构造时注入的 capability defaults 或唯一候选决定，多个候选会失败。包入口与迁移状态以当前 [exports](../../../packages/wener-common/package.json) 为准。

## 只读、宿主与证据

三种 provider 均只读，不需 `--yes`。generic 调用仍检查禁用状态、工具存在性与 readOnlyHint。HTTP 失败通常退出 1，文件/JSON 解析错误通常退出 2；provider 输入校验也可能走 1，native 取消异常退出 130。

Native 与 Web 可使用注入的 fetch；浏览器受 CORS 限制，无隐式本机文件访问。远程 runtime 可以提供同名 fetch 工具，但认证与最终权限由服务端负责。headers 不自动插值环境变量。

实现与离线用例：`apps/woctl/src/services/fetch.ts`、`fetch.integration.test.ts`、`packages/wener-common/src/service/fetch`、`providers/base.ts`、`providers/jina.ts`、`providers/exa.ts` 和 `runtime/createServiceProviderAdapter.ts`。实际服务与测试边界见 [覆盖表](../coverage.md)。
