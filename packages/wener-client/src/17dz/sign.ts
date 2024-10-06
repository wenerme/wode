import { ArrayBuffers, randomUUID } from '@wener/utils';

export async function sign(headers: Record<string, any>, ctx?: Record<string, string>) {
  const o = {
    appKey: '',
    appSecret: '',
    timestamp: Date.now().toString(),
    version: '1.0.0',
    xReqNonce: randomUUID().replaceAll('-', ''),
    ...ctx,
    ...headers,
  };
  const encoded = encodeURIComponent(
    Object.entries(o)
      .sort(([a], [b]) => a.localeCompare(b))
      .map((a) => a[1])
      .join(''),
  );
  if (!o.appSecret) {
    throw new Error('appSecret is required to sign');
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(o.appSecret),
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );
  const signature = ArrayBuffers.toString(await crypto.subtle.sign('hmac', key, ArrayBuffers.from(encoded)), 'base64');

  return { ...o, signature };
}
