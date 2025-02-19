import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import ECB from 'crypto-js/mode-ecb';
import Pkcs7 from 'crypto-js/pad-pkcs7';
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

	return Utf8.stringify(AES.decrypt(s, getCryptoKey(), { mode: ECB, padding: Pkcs7 }));
}

function isBase64(s: string) {
	// base64url or base64
	return /^[-+/_a-zA-Z0-9]*={0,2}$/.test(s);
}
