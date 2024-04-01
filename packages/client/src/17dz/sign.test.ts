import { ArrayBuffers } from '@wener/utils';
import { assert, test } from 'vitest';
import { sign } from './sign';

test('sign', async () => {
  if (!globalThis.crypto) {
    (globalThis as any).crypto = await import('node:crypto').then((v) => v.webcrypto);
  }

  const params = {
    appKey: 'NURDNkVCMDY3MzJBNDM3RjlGNDFFRjM2NjNCMUE0RTY=',
    appSecret: '9sbAv4xfdcN7lzVr3PugRg==',
    timestamp: 1_544_252_223_384,
    version: '1.0.0',
    xReqNonce: '97972162d1b14076b19ff75a9ba431d9',
  };
  const encoded = encodeURIComponent(
    Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map((a) => a[1])
      .join(''),
  );
  assert.equal(
    encoded,
    'NURDNkVCMDY3MzJBNDM3RjlGNDFFRjM2NjNCMUE0RTY%3D9sbAv4xfdcN7lzVr3PugRg%3D%3D15442522233841.0.097972162d1b14076b19ff75a9ba431d9',
  );

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(params.appSecret),
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );
  const encrypted = ArrayBuffers.toString(await crypto.subtle.sign('hmac', key, ArrayBuffers.from(encoded)), 'base64');
  assert.equal(encrypted, 'e65KGcYgpAwC+h4ckWsk/mPATUi1fz1QbRjYylvhRFY=');
  assert.equal((await sign(params)).signature, 'e65KGcYgpAwC+h4ckWsk/mPATUi1fz1QbRjYylvhRFY=');
});
