import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import ECB from 'crypto-js/mode-ecb';
import Pkcs7 from 'crypto-js/pad-pkcs7';

const key = Utf8.parse('fintaxfintaxfint');

export function decrypt(s: string): string;
export function decrypt(s: string | undefined): string | undefined;

export function decrypt(s: string | undefined) {
  if (!s) {
    return s;
  }

  return Utf8.stringify(
    AES.decrypt(s, key, {
      mode: ECB,
      padding: Pkcs7,
    }),
  );
}
