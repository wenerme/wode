import { ecb } from '@noble/ciphers/aes.js';
import { ArrayBuffers } from '@wener/utils';

const key = ArrayBuffers.from('fintaxfintaxfint', 'utf8', Uint8Array);
const decoder = new TextDecoder('utf-8', { fatal: true });

export function decrypt(s: string): string;
export function decrypt(s: string | undefined): string | undefined;

export function decrypt(s: string | undefined) {
	if (!s) {
		return s;
	}

	return decoder.decode(ecb(key).decrypt(ArrayBuffers.from(s, 'base64', Uint8Array)));
}
