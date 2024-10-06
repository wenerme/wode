import { hex, sha1 } from '@wener/utils';
import type { JsSdkSignature } from './server/types';

/**
 * object will build as Search Params
 */
async function signature(s: string | string[] | Record<string, any>) {
  let input: string;
  if (Array.isArray(s)) {
    input = s.sort((a, b) => a.localeCompare(b)).join('');
  } else if (typeof s === 'string') {
    input = s;
  } else if (Object.keys(s).length > 0) {
    input = Object.entries(s)
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('&');
  } else {
    throw new Error('Invalid signature input');
  }

  return sha1(input).then((v) => hex(v));
}

export async function createJsSdkSignature({
  ticket,
  url,
  timestamp = Math.round(Date.now() / 1000),
  nonce = String(Math.random()).slice(2),
}: {
  ticket: string; // https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=ACCESS_TOKEN&type=jsapi
  url: string;
  timestamp?: number;
  nonce?: string;
}): Promise<JsSdkSignature> {
  return {
    url,
    timestamp: String(timestamp),
    nonce: String(nonce),
    signature: await signature({
      jsapi_ticket: ticket,
      url,
      timestamp,
      noncestr: nonce,
    }),
    signType: 'SHA1',
  };
}
