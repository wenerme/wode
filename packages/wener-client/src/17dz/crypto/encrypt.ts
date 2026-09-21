import { ecb } from '@noble/ciphers/aes.js';
import { ArrayBuffers } from '@wener/utils';
import { getCryptoKey } from './getCryptoKey';

export function encrypt(s: string): string;
export function encrypt(s: undefined): undefined;
export function encrypt(s?: string): undefined | string;
export function encrypt(s: string | undefined) {
	if (s === null || s === undefined) {
		return s;
	}

	return ArrayBuffers.toString(ecb(getCryptoKey()).encrypt(ArrayBuffers.from(s, 'utf8', Uint8Array)), 'base64');
}
