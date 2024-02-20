import Utf8 from 'crypto-js/enc-utf8';

// https://17dz.com/iit-yqdz-web-pc/router.bundle.js enc.Utf8.parse
const key = Utf8.parse('RGZwrjvQmQl2A4Hk');

export function getCryptoKey() {
  return key;
}
