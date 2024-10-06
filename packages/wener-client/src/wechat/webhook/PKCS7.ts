import { ArrayBuffers } from '@wener/utils';

export const PKCS7 = {
  trim(buf: Uint8Array) {
    let pad = buf.at(-1) ?? 0;
    if (pad < 1 || pad > 32) {
      pad = 0;
    }

    return buf.slice(0, buf.length - pad);
  },

  pad(buf: Uint8Array, blockSize = 32) {
    const textLength = buf.length;
    const amountToPad = blockSize - (textLength % blockSize);
    return ArrayBuffers.concat([buf, new Uint8Array(amountToPad).fill(amountToPad)]);
  },
};
