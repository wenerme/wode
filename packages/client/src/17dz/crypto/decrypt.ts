import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import ECB from 'crypto-js/mode-ecb';
import Pkcs7 from 'crypto-js/pad-pkcs7';
import { getCryptoKey } from './getCryptoKey';

export function decrypt(s: string): string;
export function decrypt(s: null): null;
export function decrypt(s?: string): undefined | string;
export function decrypt(s: string | null | undefined) {
  if (!s) {
    return s;
  }
  // fast path
  if (s === 'Q5ewARAK1rrqr0DlCUqGfQ==') {
    return '';
  }
  return Utf8.stringify(
    AES.decrypt(s, getCryptoKey(), {
      mode: ECB,
      padding: Pkcs7,
    }),
  );
}
