import { test } from 'vitest';
import { createFileExpiryValue } from '../../server';
import { WecomCorpClient } from './WecomCorpClient';

test('WecomCorpClient demo', async () => {
  if (!process.env.WECOM_CORP_ID) {
    return;
  }

  let client: WecomCorpClient;
  client = new WecomCorpClient({
    corpId: process.env.WECOM_CORP_ID,
    corpSecret: process.env.WECOM_CORP_SECRET!,
    // 缓存 token 到文件或别的地方
    accessToken: createFileExpiryValue<string>({
      path: 'wechat.token.json',
      async loader() {
        const { access_token, expires_at } = await client.getAccessToken();
        return {
          value: access_token,
          expiresAt: expires_at,
        };
      },
    }),
  });

  // 复用
  console.log('AccessToken', await client.options.accessToken.get());
  console.log('AccessToken', await client.options.accessToken.get());
});
