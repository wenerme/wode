import { assert, test } from 'vitest';
import { signv3 } from './signv3';

test('signv3', async () => {
  // https://help.aliyun.com/zh/sdk/product-overview/v3-request-structure-and-signature
  const { authorization, signature } = await signv3(
    {
      method: 'POST',
      url: 'https://ecs.cn-shanghai.aliyuncs.com/?ImageId=win2019_1809_x64_dtc_zh-cn_40G_alibase_20230811.vhd&RegionId=cn-shanghai',
      headers: {
        'x-acs-action': 'RunInstances',
        'x-acs-version': '2014-05-26',
        'x-acs-date': '2023-10-26T10:22:32Z',
        'x-acs-signature-nonce': '3156853299f313e23d1673dc12e1703d',
        'x-acs-content-sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        // host: 'ecs.cn-shanghai.aliyuncs.com',
      },
    },
    {
      accessKeyId: 'YourAccessKeyId',
      accessKeySecret: 'YourAccessKeySecret',
    },
  );

  assert.equal(signature, '06563a9e1b43f5dfe96b81484da74bceab24a1d853912eee15083a6f0f3283c0');
  // fixme wtf ?
  // assert.equal(
  //   authorization,
  //   'ACS3-HMAC-SHA256 Credential=YourAccessKeyId,SignedHeaders=content-type;host;x-acs-timestamp,Signature=6b595d672d79c15b18edb4ccfba6789a24a6f2b82c400e03162d9279b08555d7',
  // );
});
