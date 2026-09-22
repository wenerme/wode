import { expect, test } from 'vitest';
import { decrypt } from './decrypt';

// Captured from the previous AES-ECB/PKCS#7 implementation.
test.each([
	['', '9OsFojwkX3ZsEh1bFvOdlw=='],
	['neutral text', 'NcOl9+Qwk/zFz1voE8uZdw=='],
	['hello', 'Jfs2J/fgSCN3q2PI/jFP8Q=='],
	['你好', '1EZJEKkIuv6TjZXBVVEgGA=='],
])('decrypts legacy YZF ciphertext for %j', (plaintext, ciphertext) => {
	expect(decrypt(ciphertext)).toBe(plaintext);
});

test('preserves empty and missing values', () => {
	expect(decrypt('')).toBe('');
	expect(decrypt(undefined)).toBeUndefined();
});

test('rejects malformed ciphertext', () => {
	expect(() => decrypt('AAAA')).toThrow();
	expect(() => decrypt('AAAAAAAAAAAAAAAAAAAAAA==')).toThrow();
});
