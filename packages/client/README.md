# @wener/client

## 企业微信

### 企业微信 服务端

```ts
import { createFileExpiryValue } from '@wener/client/server';
import { WecomCorpClient } from '@wener/client/wecom/server';

let client: WecomCorpClient;
client = new WecomCorpClient({
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
