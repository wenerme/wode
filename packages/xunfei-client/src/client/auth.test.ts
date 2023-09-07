import { expect, test } from 'vitest';
import { buildAuthParams } from './buildAuthParams';

test('signature', async () => {
  // https://www.xfyun.cn/doc/spark/general_url_authentication.html
  const auth = buildAuthParams({
    apiSecret: 'MjlmNzkzNmZkMDQ2OTc0ZDdmNGE2ZTZi',
    apiKey: 'addd2272b6d8b7c8abdd79531420ca3b',
    date: new Date('Fri, 05 May 2023 10:43:39 GMT'),
    path: '/v1.1/chat',
  });
  expect(auth.authorization).toEqual(
    'YXBpX2tleT0iYWRkZDIyNzJiNmQ4YjdjOGFiZGQ3OTUzMTQyMGNhM2IiLCBhbGdvcml0aG09ImhtYWMtc2hhMjU2IiwgaGVhZGVycz0iaG9zdCBkYXRlIHJlcXVlc3QtbGluZSIsIHNpZ25hdHVyZT0iejVnSGR1M3B4VlY0QURNeWs0Njd3T1dEUTlxNkJRelIzbmZNVGpjL0RhUT0i',
  );
  let params = new URLSearchParams(auth);
  params.sort();
  expect(params.toString()).toEqual(
    'authorization=YXBpX2tleT0iYWRkZDIyNzJiNmQ4YjdjOGFiZGQ3OTUzMTQyMGNhM2IiLCBhbGdvcml0aG09ImhtYWMtc2hhMjU2IiwgaGVhZGVycz0iaG9zdCBkYXRlIHJlcXVlc3QtbGluZSIsIHNpZ25hdHVyZT0iejVnSGR1M3B4VlY0QURNeWs0Njd3T1dEUTlxNkJRelIzbmZNVGpjL0RhUT0i&date=Fri%2C+05+May+2023+10%3A43%3A39+GMT&host=spark-api.xf-yun.com',
  );
});
