import crypto from 'node:crypto';
import NodeRSA from 'node-rsa';

export function maybeBase64(v: string | Buffer) {
  return typeof v === 'string' ? Buffer.from(v, 'base64') : v;
}

let fallback = false;

export function decryptRandomKey({
  privateKey,
  randomKey,
  native,
}: {
  privateKey: string;
  randomKey: string | Buffer;
  // bun:1.1.27, node security revert
  native?: boolean;
}): Buffer {
  // RSA_PKCS1_PADDING is no longer supported for private decryption
  if (native && !fallback) {
    try {
      return crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        maybeBase64(randomKey),
      );
    } catch (e) {
      if (String(e).includes('RSA_PKCS1_PADDING')) {
        fallback = true;
        console.warn(`RSA_PKCS1_PADDING is no longer supported, fallback to js\n`, e);
      } else {
        throw e;
      }
    }
  }
  // if (false) {
  //   let key = forge.pki.privateKeyFromPem(privateKey);
  //   let input =
  //     typeof randomKey === 'string' ? forge.util.decode64(randomKey) : forge.util.binary.raw.encode(randomKey);
  //   let dec = key.decrypt(input, 'RSAES-PKCS1-V1_5');
  //   return Buffer.from(dec, 'binary');
  // }
  {
    const key = new NodeRSA(privateKey);
    key.setOptions({
      encryptionScheme: 'pkcs1',
      environment: 'browser',
    });
    return key.decrypt(maybeBase64(randomKey));
  }
}
