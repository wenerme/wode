import { ArrayBuffers } from '@wener/utils';

// https://17dz.com/iit-yqdz-web-pc/router.bundle.js enc.Utf8.parse
const key = ArrayBuffers.from('RGZwrjvQmQl2A4Hk', 'utf8', Uint8Array);

export function getCryptoKey() {
	return key;
}
