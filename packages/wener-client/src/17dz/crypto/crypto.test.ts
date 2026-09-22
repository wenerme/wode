import { expect, test } from 'vitest';
import { decrypt } from './decrypt';
import { encrypt } from './index';

// Captured from the previous AES-ECB/PKCS#7 implementation.
test.each([
	['', 'Q5ewARAK1rrqr0DlCUqGfQ=='],
	['neutral text', 'RXHER3K2/wrFIJgrVaDB4A=='],
	['hello', 'la4T87fdFDuluNeMXiVeBQ=='],
	['你好', 'ly+o1Rl14hnBDM4pyDeWbQ=='],
])('preserves the legacy ciphertext for %j', (plaintext, ciphertext) => {
	expect(encrypt(plaintext)).toBe(ciphertext);
	expect(decrypt(ciphertext)).toBe(plaintext);
});

test('preserves empty, missing and non-base64 values', () => {
	expect(encrypt(undefined)).toBeUndefined();
	expect(decrypt(undefined)).toBeUndefined();
	expect(decrypt('')).toBe('');
	expect(decrypt('plain text')).toBe('plain text');
});

test('rejects malformed ciphertext instead of silently returning corrupt data', () => {
	expect(() => decrypt('AAAA')).toThrow();
	expect(() => decrypt('AAAAAAAAAAAAAAAAAAAAAA==')).toThrow();
});
