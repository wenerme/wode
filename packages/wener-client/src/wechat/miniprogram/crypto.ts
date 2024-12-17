import { sha1 } from '@wener/utils';

/**
 * @see https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/signature.html
 */
export async function verifySignature({
  sessionKey,
  signature,
  rawData,
}: {
  signature: string;
  rawData: string | object;
  sessionKey: string;
}) {
  if (typeof rawData !== 'string') {
    rawData = JSON.stringify(rawData);
  }
  const signature2 = await sha1(rawData + sessionKey, 'hex');
  return signature === signature2;
}
