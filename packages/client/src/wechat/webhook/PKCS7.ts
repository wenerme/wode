import { ArrayBuffers } from '@wener/utils';

export class PKCS7 {
  static trim(buf: Uint8Array) {
    let pad = buf[buf.length - 1];
    if (pad < 1 || pad > 32) {
      pad = 0;
    }
    return buf.slice(0, buf.length - pad);
  }

  static pad(buf: Uint8Array, blockSize = 32) {
    const textLength = buf.length;
    const amountToPad = blockSize - (textLength % blockSize);
    return ArrayBuffers.concat([buf, new Uint8Array(amountToPad).fill(amountToPad)]);
  }
}
