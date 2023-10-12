import { createDecipheriv } from 'node:crypto';
import { ArrayBuffers } from '@wener/utils';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { PKCS7 } from './PKCS7';
import { WechatWebhookEncryptPayload, WechatWebhookPayload } from './types';

export class MessageCrypt {
  private constructor(readonly options: MessageCryptOptions) {}

  static async create(aesKey: string) {
    if (aesKey.length !== 43) {
      throw new Error('Invalid AESKey');
    }
    let raw = ArrayBuffers.asView(Uint8Array, ArrayBuffers.from(aesKey, 'base64'));
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
    return new MessageCrypt({ key, iv, parser: new XMLParser(), builder: new XMLBuilder({}) });
  }

  parse(xml: string | WechatWebhookEncryptPayload): WechatWebhookEncryptPayload {
    return typeof xml === 'string' ? (this.options.parser.parse(xml).xml as WechatWebhookEncryptPayload) : xml;
  }

  async decrypt(xml: string | WechatWebhookEncryptPayload): Promise<MessageDecryptResult> {
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
    return {
      nonce: ArrayBuffers.toString(dec.slice(0, 16)),
      message,
      appId: ArrayBuffers.toString(dec.slice(16 + 4 + len)),
      data: parsed,
    };
  }
}

export interface MessageDecryptResult {
  nonce: string;
  message: string;
  appId: string;
  data?: WechatWebhookPayload;
}

export interface MessageCryptOptions {
  key: CryptoKey;
  iv: Uint8Array;
  parser: XMLParser;
  builder: XMLBuilder;
}
