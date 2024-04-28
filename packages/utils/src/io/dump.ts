import { ArrayBuffers } from './ArrayBuffers';

export function toHexDump(data: BufferSource) {
  return Array.from(ArrayBuffers.toHex(data).match(/.{1,32}/g) ?? [])
    .map((v, i) => {
      let idxPrefix = `${i.toString(16).padStart(8, '0')}:`;
      let content = Array.from(v.match(/.{4}/g) ?? []).join(' ');
      let chars = Array.from(new Uint8Array(ArrayBuffers.fromHex(v).buffer)).map((v) => {
        let c = String.fromCharCode(v);
        if (v < 32 || v > 126) {
          c = '.';
        }
        return c;
      });
      return [idxPrefix, content.padEnd(40, ' '), chars.join('')].join(' ');
    })
    .join('\n');
}

/**
 * Chrome Websocket Binary format
 * ```
 * 00000000: 0000 0000 0000 0000 0000 0000 0000 0000  ................
 * ```
 */
export function fromHexDump(dump: string) {
  return ArrayBuffers.fromHex(
    dump
      .split('\n')
      .map((v) => {
        return v.substring(10, 10 + 41).replaceAll(' ', '');
      })
      .join(''),
  );
}
