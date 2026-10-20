import { expect, test } from 'vitest';
import { decrypt } from './decrypt';
import { encrypt } from './index';

// Fixed fixtures generated with CryptoJS 4.2.0 AES-128-ECB/PKCS7.
test.each([
	['', 'Q5ewARAK1rrqr0DlCUqGfQ=='],
	['hello', 'la4T87fdFDuluNeMXiVeBQ=='],
	['你好🌍', '+JGNhSkhcP4eCncfUvyPXg=='],
	['0123456789abcdef', 'If+QgZkgQc8ypTEXctQBt0OXsAEQCta66q9A5QlKhn0='],
	['\ufeffhello\u0000世界', 'TvL7FNHyfsHJFZ7OBTqVuw=='],
	[
		'a'.repeat(64),
		'3bq+1FWbdgh6urqCiz7v7t26vtRVm3YIerq6gos+7+7dur7UVZt2CHq6uoKLPu/u3bq+1FWbdgh6urqCiz7v7kOXsAEQCta66q9A5QlKhn0=',
	],
])('matches the existing 17dz wire format: %j', (plaintext, ciphertext) => {
	expect(encrypt(plaintext)).toBe(ciphertext);
	expect(decrypt(ciphertext)).toBe(plaintext);
});

test('preserves absent values and plaintext passthrough', () => {
	expect(encrypt(undefined)).toBeUndefined();
	expect(decrypt(undefined)).toBeUndefined();
	expect(decrypt('')).toBe('');
	expect(decrypt('明文 / not encrypted')).toBe('明文 / not encrypted');
});

test('rejects truncated ciphertext and invalid padding', () => {
	expect(() => decrypt('YWJj')).toThrow();
	expect(() => decrypt('AAAAAAAAAAAAAAAAAAAAAA==')).toThrow();
});
