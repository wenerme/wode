import { ecb } from '@noble/ciphers/aes.js';
import { ArrayBuffers } from '@wener/utils';
import { getCryptoKey } from './getCryptoKey';

export function decrypt(s: string): string;
export function decrypt(s: undefined): undefined;
export function decrypt(s?: string): undefined | string;
export function decrypt(s: string | undefined) {
	if (!s) {
		return s;
	}

	// fast path
	if (s === 'Q5ewARAK1rrqr0DlCUqGfQ==') {
		return '';
	}

	if (!isBase64(s)) {
		// safe for non-base64
		return s;
	}

	return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
		ecb(getCryptoKey()).decrypt(ArrayBuffers.fromBase64(s)),
	);
}

function isBase64(s: string) {
	// base64url or base64
	return /^[-+/_a-zA-Z0-9]*={0,2}$/.test(s);
}
