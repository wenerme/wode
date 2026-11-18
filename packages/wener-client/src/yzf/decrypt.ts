import { ecb } from '@noble/ciphers/aes.js';
import { ArrayBuffers } from '@wener/utils';

const key = new TextEncoder().encode('fintaxfintaxfint');

export function decrypt(s: string): string;
export function decrypt(s: string | undefined): string | undefined;

export function decrypt(s: string | undefined) {
	if (!s) {
		return s;
	}

	return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
		ecb(key).decrypt(ArrayBuffers.fromBase64(s)),
	);
}
