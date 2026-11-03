# 页面内容获取（fetch）

当前提供 `IFetchService` typed SDK 和通用 `service call`，**没有顶级 `woctl fetch` 命令**。可选 provider 为 `base`（别名 `direct`）和 `jina`。

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
  services: {}
```

base 直接获取目标 URL，只支持配置 headers，不接受 baseUrl，也不接受 options 中额外键。jina 支持 baseUrl、headers 以及 `options.apiKey/timeout`；apiKey 是显式值，不是 envref，示例不需要提供。baseUrl 若设置为 `https://reader.example.test/`，需要是实现兼容协议的 reader 服务。

```sh
woctl --config ./woctl.yaml service --help
woctl --config ./woctl.yaml service call --help
woctl --config ./woctl.yaml service list --json
woctl --config ./woctl.yaml service inspect reader --json
woctl --config ./woctl.yaml service schema extracted-reader --json
```

fetch 不支持领域 `--list-services` 或 `--service`；generic 入口直接以位置参数选择 reader，不存在多服务自动选择歧义。`-c dev` 仍会切换所选服务目录；native 使用规范数组及 defaults.services，见 [配置](../configuration.md)。

## 调用、文件与结果

```text
service call <reader服务名> fetch --input <JSON|@文件|->
```

```sh
woctl service call reader fetch --input '{"url":"https://example.com/","maxCharacters":2000}' --json
woctl service call extracted-reader fetch --input @fetch.json --output yaml
printf '{"url":"https://example.com/","maxCharacters":2000}' | woctl service call reader fetch --input - --json > page.json
```

`fetch.json`：

```json
{"url":"https://example.com/","maxCharacters":2000}
```

只接受 url/maxCharacters。URL 必须是 HTTP(S)，不能带用户名密码；maxCharacters 为正安全整数。输入文件上限 16 MiB。返回 url、content，及可选 contentType/title/metadata；base 与 jina 不保证所有可选字段都出现。

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

两种 provider 均只读，不需 `--yes`。generic 调用仍检查禁用状态、工具存在性与 readOnlyHint。HTTP 失败通常退出 1，文件/JSON 解析错误通常退出 2；provider 输入校验也可能走 1，native 取消异常退出 130。

Native 与 Web 可使用注入的 fetch；浏览器受 CORS 限制，无隐式本机文件访问。远程 runtime 可以提供同名 fetch 工具，但认证与最终权限由服务端负责。headers 不自动插值环境变量。

实现与证据：`packages/wener-common/src/service/fetch/index.ts`、`providers/base.ts`、`providers/jina.ts`、`runtime/createServiceProviderAdapter.ts`；离线用例在 `providers/fetch.test.ts` 和 `packages/wener-client/src/jina/JinaReaderClient.test.ts`。Provider 测试通过，Jina client 本轮未重跑，也未连接真实 reader；最终运行状态统一见 [覆盖表](../coverage.md)。
