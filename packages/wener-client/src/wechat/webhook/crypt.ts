import { createDecipheriv } from 'node:crypto';
import { ArrayBuffers } from '@wener/utils';
import { PKCS7 } from './PKCS7';

export async function parseAesKey({ key, iv }: { key: CryptoKey | string; iv?: Uint8Array }): Promise<{
  key: CryptoKey;
  iv: Uint8Array;
}> {
  if (typeof key === 'string') {
    if (key.length !== 43) {
      throw new Error('Invalid EncodingAESKey length');
    }

    const raw = ArrayBuffers.asView(Uint8Array, ArrayBuffers.from(key, 'base64'));
    key = await crypto.subtle.importKey('raw', raw, 'AES-CBC', false, ['decrypt']);
    iv = raw.slice(0, 16);
  } else if (!iv) {
    throw new Error('iv is required');
  }

  return { key, iv };
}

export async function decrypt({ key, iv, data }: { key: CryptoKey | string; iv?: Uint8Array; data: BufferSource }) {
  ({ key, iv } = await parseAesKey({ key, iv }));
  // typeof data === 'string' && (data = ArrayBuffers.from(data, 'base64'));

  // The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received an instance of ArrayBuffer
  const decipher = createDecipheriv('aes-256-cbc', key as any, iv);
  decipher.setAutoPadding(false);
  const buf = ArrayBuffers.concat([decipher.update(data as any), decipher.final()]);
  let dec = ArrayBuffers.asView(Uint8Array, buf);

  // 有时候会失败 The operation failed for an operation-specific reason
  // let buf = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, data);
  // let dec = ArrayBuffers.asView(Uint8Array, buf);

  dec = PKCS7.trim(dec);
  ArrayBuffers.toString(dec.slice(0, 16));

  const len = new DataView(buf).getInt32(16, false);
  return {
    nonce: ArrayBuffers.toString(dec.slice(0, 16)),
    receiverId: ArrayBuffers.toString(dec.slice(16 + 4 + len)),
    data: ArrayBuffers.toString(dec.slice(16 + 4, 16 + 4 + len)),
  };
}
