import { ArrayBuffers } from '../../io/ArrayBuffers';

export interface Block {
  type: string | 'RSA PRIVATE KEY'; // https://github.com/openssl/openssl/blob/master/include/openssl/pem.h#L35-L60
  header: Record<string, string>;
  bytes: BufferSource;
}

export class PEM {
  static decode(data: string): { block: Block; tail: string; head: string } {
    const match = data.match(
      /^-----BEGIN (?<type>[^\r\n-]+)-----$\r?\n(?<headers>(^[^:\r\n]+:[^\n\r]+\r?\n)+\r?\n)?(?<data>[a-zA-Z0-9/_=\n\r+]+?)^-----END \1-----$\r?\n?/ms,
    );
    if (!match?.groups) throw new Error('Invalid PEM data');
    const { type, headers = '', data: b64 } = match.groups;
    const header = headers
      .split('\n')
      .filter((v) => v.trim())
      .map((h) => {
        const [k, ...v] = h.split(':');
        return [k.trim(), v.join(':').trim()];
      })
      .reduce((a, [k, v]) => ({ ...a, [k]: v }), {});
    return {
      block: {
        type,
        header,
        bytes: ArrayBuffers.from(b64.replaceAll(/[\r\n]/g, ''), 'base64'),
      },
      head: data.slice(0, match.index || 0),
      tail: data.slice((match.index || 0) + match[0].length),
    };
  }
  static encode(block: { type: string; bytes: string | BufferSource; header?: Record<string, string> }): string {
    const { type, header, bytes } = block;
    const headers = Object.entries(header || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    return `-----BEGIN ${type}-----\n${headers}${headers.length ? '\n\n' : ''}${
      ArrayBuffers.toString(bytes, 'base64')
        .match(/.{1,64}/g)
        ?.join('\n') || ''
    }\n-----END ${type}-----\n`;
  }
}
