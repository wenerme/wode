# @wener/client

- 微信客户端
- 企业微信
  - 服务端客户端
  - JS SDK
  - WebHook
  - 消息归档
- OpenAI 客户端
- 讯飞火星 大模型 客户端
- 百度 CE 客户端
- 阿里云 大模型 客户端

```bash
# for dev version
npm install 'https://gitpkg.now.sh/wenerme/wode/packages/client?main'
```

## OpenAI

```ts
import { createFetchWithProxy } from '@wener/utils/server';
import { OpenAiClient } from '@wener/cleint/openai';

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

## 参考

- https://developer.work.weixin.qq.com/
