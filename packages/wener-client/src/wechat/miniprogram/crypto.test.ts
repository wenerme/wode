import { sha1 } from '@wener/utils';
import { polyfillCrypto } from '@wener/utils/server';
import { expect, test } from 'vitest';
import { verifySignature } from './crypto';
import { decryptData } from './decryptData';

test('verifySignature', async () => {
  // https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/signature.html

  const rawData = {
    nickName: 'Band',
    gender: 1,
    language: 'zh_CN',
    city: 'Guangzhou',
    province: 'Guangdong',
    country: 'CN',
    avatarUrl:
      'http://wx.qlogo.cn/mmopen/vi_32/1vZvI39NWFQ9XM4LtQpFrQJ1xlgZxx3w7bQxKARol6503Iuswjjn6nIGBiaycAjAtpujxyzYsrztuuICqIM5ibXQ/0',
  };
  const session_key = 'HyVFkGl5F5OQWJZZaNzBBg==';

  const signature = await sha1(JSON.stringify(rawData) + session_key, 'hex');
  expect(signature).toBe('75e81ceda165f4ffa64f4068af58c64b8f54b88c');
  expect(verifySignature({ sessionKey: session_key, signature, rawData })).toBeTruthy();
});

test('decryptData', async () => {
  await polyfillCrypto();

  let appId = 'wx4f4bc4dec97d474b';
  let sessionKey = 'tiihtNczf5v6AKRyjwEUhQ==';
  let encryptedData =
    'CiyLU1Aw2KjvrjMdj8YKliAjtP4gsMZM' +
    'QmRzooG2xrDcvSnxIMXFufNstNGTyaGS' +
    '9uT5geRa0W4oTOb1WT7fJlAC+oNPdbB+' +
    '3hVbJSRgv+4lGOETKUQz6OYStslQ142d' +
    'NCuabNPGBzlooOmB231qMM85d2/fV6Ch' +
    'evvXvQP8Hkue1poOFtnEtpyxVLW1zAo6' +
    '/1Xx1COxFvrc2d7UL/lmHInNlxuacJXw' +
    'u0fjpXfz/YqYzBIBzD6WUfTIF9GRHpOn' +
    '/Hz7saL8xz+W//FRAUid1OksQaQx4CMs' +
    '8LOddcQhULW4ucetDf96JcR3g0gfRK4P' +
    'C7E/r7Z6xNrXd2UIeorGj5Ef7b1pJAYB' +
    '6Y5anaHqZ9J6nKEBvB4DnNLIVWSgARns' +
    '/8wR2SiRS7MNACwTyrGvt9ts8p12PKFd' +
    'lqYTopNHR1Vf7XjfhQlVsAJdNiKdYmYV' +
    'oKlaRv85IfVunYzO0IKXsyl7JCUjCpoG' +
    '20f0a04COwfneQAGGwd5oa+T8yO5hzuy' +
    'Db/XcxxmK01EpqOyuxINew==';
  const iv = 'r7BXXKkLb8qrSNn05n0qiA==';
  const data = {
    nickName: 'Band',
    gender: 1,
    language: 'zh_CN',
    city: 'Guangzhou',
    province: 'Guangdong',
    country: 'CN',
    avatarUrl:
      'http://wx.qlogo.cn/mmopen/vi_32/aSKcBBPpibyKNicHNTMM0qJVh8Kjgiak2AHWr8MHM4WgMEm7GFhsf8OYrySdbvAMvTsw3mo8ibKicsnfN5pRjl1p8HQ/0',
    unionId: 'ocMvos6NjeKLIBqg5Mr9QjxrP1FA',
    watermark: {
      timestamp: 1477314187,
      appid: 'wx4f4bc4dec97d474b',
    },
    // demo 里没有
    openId: 'oGZUI0egBJY1zhBYw2KhdUfwVJJE',
  };
  const out = await decryptData({
    appId,
    sessionKey,
    encryptedData,
    iv,
  });
  expect(out).toEqual(data);
});
