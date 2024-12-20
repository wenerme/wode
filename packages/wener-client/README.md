# @wener/client

- 尽量减少依赖
  - 主要就一个依赖 @wener/utils
- 尽量区分 client 和 server
  - client 部分确保浏览器可执行
- 尽量使用 web 标准 - 例如 crypto、fetch
- 尽量遵循一定的 pattern

**支持客户端**

- 阿里云客户端
- 微信客户端
- 企业微信
  - 服务端客户端
  - JS SDK
  - WebHook
  - 会话内容存档
- OpenAI 客户端
- 讯飞火星 大模型 客户端
- 百度 CE 客户端
- 阿里云 大模型 客户端
- 17dz
- funasr
- browserless

```bash
# for dev version
npm install 'https://gitpkg.now.sh/wenerme/wode/packages/client?main'
```

<!--
pnpm add https://github.com/indexzero/forever/tarball/v0.5.6
github:user/repo

https://pnpm.io/cli/add#install-from-git-repository
wenerme/wode/packages/client#main
-->

**基础**

- 所有客户端都支持

```ts
import { createFetchWithLogging } from '@wener/utils';
import { createFetchWithProxy } from '@wener/utils/server';

// debug - dump 所有请求和返回
{
  const fetch = createFetchWithLogging();
  const aliCloudClient = new AliCloudClient({
    fetch,
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  });
}
// 配置代理 - 例如 http://127.0.0.1:7890
{
  const fetch = createFetchWithProxy({
    // 例如：企业微信如果配置白名单，可以考虑走代理
    proxy: process.env.WECOM_PROXY,
  });
}
```

## OpenAI

```ts
import { createFetchWithProxy } from '@wener/utils/server';
import { OpenAiClient } from '@wener/client/openai';

const fetch = createFetchWithProxy({
  proxy: process.env.OPENAI_PROXY,//e.g. 'http://127.0.0.1:7890',
});
const client = new OpenAiClient({
  fetch,
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
});
// list models
console.log(await client.getModels());
```

## AliCloud

- 简单易用的 阿里云 客户端
- 可在浏览器端使用 - 需要自行处理 cors
  - 测试、工具为主
  - 表明不需要什么依赖
- 接口定义基于代码生成
  - 默认以 Proxy+Interface 为主 - size 非常小
  - 可以考虑 stub method 方式 - 增加 size，保留 schema，可以做类型校验，可以生成服务端 API
    - 例如：二次暴露 API，提供兼容 API，基于元信息做权限校验

<details>
<summary><b>动机/Why？</b></summary>

1. 阿里云的客户端质量非常的差

- @alicloud/openapi-client 一个文件、一个包
  - **19** 个依赖
  - 最基础的依赖，可能要做非常多的兼容，所有都揉在一起，导致包很大 - 180kB/ gzip 42kB
  - 代码质量非常差，非常多 Utils.xyz 调用
    - https://www.unpkg.com/browse/@alicloud/openapi-client@0.4.6/src/client.ts 有 242 处 `Util.`
- @alicloud/openapi-utils 一个文件、一个包
- 每个服务单独的包
  - 但每个包内极少的内容 https://github.com/aliyun/alibabacloud-typescript-sdk/
  - 大多都是校验/模型定义相关 - 非常冗长
  - 例如 https://github.com/aliyun/alibabacloud-typescript-sdk/blob/master/ocr-api-20210707/src/client.ts
    - 11404 行代码, 无文档, 编译后 288KB, minify 后 140KB, **21** 个依赖
    -
    对应 [src/alicloud/OcrV20210707.ts](https://github.com/wenerme/wode/blob/main/packages/client/src/alicloud/OcrV20210707.ts)
    - 4419 行代码，主要是 markdown 文档，编译后 0KB （纯类型定义）
- tea 校验我觉得很差 @alicloud/tea-util

2. 阿里云的 API 文档质量非常的差

- 例如 https://help.aliyun.com/zh/sdk/product-overview/v3-request-structure-and-signature
  - 签名文档里的 Demo 都对不上，最终产出的的 SignedHeaders 和 Signature 不一致
  - 导致怀疑是自己的问题
- API explorer 质量差 - 我就只想要看到 curl 怎么执行的，但实际看不到请求目标、URL、头 等信息
- 返回的 DEBUG 链接当前用户 也打不开

3. 我只想要发起一些简单的请求，按需封装结构，请求简单透明，客户端易用

</details>

### 使用 request

- 支持任意请求
- 极少的代码量，最小的 bundle size

```ts
import { request } from '@wener/client/alicloud';

console.log(
  await request({
    endpoint: 'dytnsapi.aliyuncs.com',
    action: 'QueryTagInfoBySelection',
    version: '2020-02-17',
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  }),
);
```

### 使用客户端

- 基于 Proxy 的客户端
- 支持类型推导

```ts
import { AliCloudClient } from '@wener/client/alicloud';

const aliCloudClient = new AliCloudClient({
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
});

const api = aliCloudClient.getServiceClient({
  // 输入 product 和 version 会有补全
  // 更多的接口待生成
  product: 'Dytnsapi',
  version: '2020-02-17',
});
console.log(await api.QueryTagListPage({}));
```

## 企业微信

### 企业微信 服务端

```ts
import { createFileExpiryValue } from '@wener/client/server';
import { WecomCorpClient } from '@wener/client/wecom/server';

const fetch = createFetchWithProxy({
  // 如果配置白名单，可以考虑走代理
  proxy: process.env.WECOM_PROXY,
});

let client: WecomCorpClient;
client = new WecomCorpClient({
  fetch,
  corpId: process.env.WECOM_CORP_ID!,
  corpSecret: process.env.WECOM_CORP_SECRET!,
  // 缓存 token 到文件或别的地方
  accessToken: createFileExpiryValue<string>({
    path: 'wechat.token.json',
    loader: async () => {
      const { access_token, expires_at } = await client.getAccessToken();
      return {
        value: access_token,
        expiresAt: expires_at,
      };
    },
  }),
});

// 复用
console.log(`AccessToken`, await client.options.accessToken.get());
console.log(`AccessToken`, await client.options.accessToken.get());
```

## xunfei/spark

## wechat

## wechat/archive/bun

- 企业微信会话存档
- 使用 bun:ffi 调用
- 需要 glibc, amd64, linux 环境
  - 未测试过 Windows

```bash
make run-bun
# 执行测试，会输出 10 条消息
WWF_CORP_ID=ID WWF_CORP_SECRET=SECRET bun test ./src/wecom/archive/bun/WeWorkFinanceClient.bun.test.ts  
```

```ts
if (process.env.WWF_PRIVATE_KEY_FILE) {
  privateKey = await fs.readFile(process.env.WWF_PRIVATE_KEY_FILE, 'utf-8');
}

const client = createWeWorkFinanceClientFromEnv({
  corpId: process.env.WWF_CORP_ID,
  corpSecret: process.env.WWF_CORP_SECRET,
  privateKey,
});
// the original data
const data = client.getChatData({ limit: 10 });
console.log(data);

// the decrypted data
if (privateKey) {
  console.log(client.getMessage({ limit: 10 }));
}

// get file
client.getMediaData({ fileId: '' });
```

## funasr

- AI, ASR, 语音识别
- https://github.com/modelscope/FunASR/blob/main/runtime/docs/websocket_protocol_zh.md

## 参考

- https://developer.work.weixin.qq.com/
