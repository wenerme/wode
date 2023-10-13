import { createDecipheriv } from 'node:crypto';
import { ArrayBuffers, hex, sha1 } from '@wener/utils';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { PKCS7 } from './PKCS7';
import { WechatWebhookEncryptPayload, WechatWebhookPayload } from './types';

export interface WechatWebhookHandlerCreateOptions {
  token?: string;
  appId?: string;
  encodingAesKey: string;
}

export async function createWechatWebhookHandler({ encodingAesKey, ...rest }: WechatWebhookHandlerCreateOptions) {
  if (encodingAesKey.length !== 43) {
    throw new Error('Invalid AESKey');
  }
  let raw = ArrayBuffers.asView(Uint8Array, ArrayBuffers.from(encodingAesKey, 'base64'));
  const key = await crypto.subtle.importKey(
    'raw',
    raw,
    {
      name: 'AES-CBC',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt'],
  );
  let iv = raw.slice(0, 16);
  return new WechatWebhookHandler({ key, iv, parser: new XMLParser(), builder: new XMLBuilder({}), ...rest });
}

/**
 * @see https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/2.0/api/Before_Develop/Message_encryption_and_decryption.html
 */
export class WechatWebhookHandler {
  constructor(readonly options: WechatWebhookHandlerOptions) {}

  parse(xml: string | WechatWebhookEncryptPayload): WechatWebhookEncryptPayload {
    return typeof xml === 'string' ? (this.options.parser.parse(xml).xml as WechatWebhookEncryptPayload) : xml;
  }

  async verify({
    timestamp,
    nonce,
    signature,
    message,
  }: {
    timestamp: string | number;
    nonce: string | number;
    signature: string;
    message?: string;
  }) {
    const { token } = this.options;
    if (!token) {
      throw new Error('token is required for verify');
    }
    const s = [token, timestamp, nonce, message].filter(Boolean).sort().join('');
    return signature === hex(await sha1(s));
  }

  async decrypt(xml: string | WechatWebhookEncryptPayload): Promise<WechatMessageDecryptResult> {
    const { iv, key, parser } = this.options;
    const data = this.parse(xml);
    // let enc = ArrayBuffers.from(data.xml.Encrypt, 'base64') as Uint8Array;
    let enc = Buffer.from(data.Encrypt, 'base64');

    const decipher = createDecipheriv('aes-256-cbc', key as any, iv);
    decipher.setAutoPadding(false);

    // The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received an instance of ArrayBuffer
    let buf = ArrayBuffers.concat([decipher.update(enc), decipher.final()]);
    let dec = ArrayBuffers.asView(Uint8Array, buf);

    // fixme subtle 有可能 decrypt 失败
    // let buf = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, enc);
    // let dec = ArrayBuffers.asView(Uint8Array, buf);

    dec = PKCS7.trim(dec);
    const len = new DataView(buf).getInt32(16, false);
    let message = ArrayBuffers.toString(dec.slice(16 + 4, 16 + 4 + len));
    let parsed: any;
    if (message.startsWith('<xml>')) {
      parsed = parser.parse(message).xml;
    }

    const out = {
      nonce: ArrayBuffers.toString(dec.slice(0, 16)),
      message,
      appId: ArrayBuffers.toString(dec.slice(16 + 4 + len)),
      data: parsed,
    };

    if (this.options.appId) {
      if (out.appId !== this.options.appId) {
        throw new Error(`Invalid appId: expected ${this.options.appId} got ${out.appId}`);
      }
    }

    return out;
  }
}

export interface WechatMessageDecryptResult<T = WechatWebhookPayload> {
  nonce: string;
  message: string;
  appId: string;
  data?: T;
}

export interface WechatWebhookHandlerOptions {
  key: CryptoKey;
  iv: Uint8Array;
  parser: XMLParser;
  builder: XMLBuilder;
  token?: string;
  appId?: string;
}
