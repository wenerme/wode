import { ArrayBuffers, hex, sha1 } from '@wener/utils';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { decrypt } from './crypt';
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

  async decrypt(s: BufferSource) {
    return decrypt({
      key: this.options.key,
      iv: this.options.iv,
      data: s,
    });
  }

  async decryptPayload(xml: string | WechatWebhookEncryptPayload): Promise<WechatMessageDecryptResult> {
    const { iv, key, parser } = this.options;
    const data = this.parse(xml);
    let enc = Buffer.from(data.Encrypt, 'base64');

    const { nonce, receiverId, data: content } = await this.decrypt(enc);

    let parsed: any;
    if (content.startsWith('<xml>')) {
      parsed = parser.parse(content).xml;
    }

    const out = {
      nonce,
      content,
      receiverId: receiverId,
      payload: parsed,
    };

    if (this.options.receiverId) {
      if (out.receiverId !== this.options.receiverId) {
        throw new Error(`Invalid appId: expected ${this.options.receiverId} got ${out.receiverId}`);
      }
    }

    return out;
  }
}

export interface WechatMessageDecryptResult<T = WechatWebhookPayload> {
  nonce: string;
  content: string;
  receiverId: string;
  payload?: T;
}

export interface WechatWebhookHandlerOptions {
  key: CryptoKey;
  iv: Uint8Array;
  parser: XMLParser;
  builder: XMLBuilder;
  token?: string;
  receiverId?: string;
}
