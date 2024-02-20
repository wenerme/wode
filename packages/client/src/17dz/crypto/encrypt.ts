import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import ECB from 'crypto-js/mode-ecb';
import Pkcs7 from 'crypto-js/pad-pkcs7';
import { getCryptoKey } from './getCryptoKey';

export function encrypt(s: string): string;
export function encrypt(s: null): null;
export function encrypt(s?: string): undefined | string;
export function encrypt(s: string | null | undefined) {
  if (s === null || s === undefined) {
    return s;
  }
  return AES.encrypt(Utf8.parse(s), getCryptoKey(), {
    mode: ECB,
    padding: Pkcs7,
  }).toString();
}
