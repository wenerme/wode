import fs from 'node:fs/promises';
import { describe } from 'bun:test';
import { createWeWorkFinanceClientFromEnv } from './WeWorkFinanceClient';

const __dirname = new URL('.', import.meta.url).pathname;
describe('WeWorkFinanceClient', async () => {
  if (!process.env.WWF_CORP_ID || !process.env.WWF_CORP_SECRET) {
    console.log(`Skip test, missing env`);
    return;
  }
  let privateKey;

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
  // client.getMediaData({fileId:""})
});
