import { expect, test } from 'vitest';
import { decrypt } from './decrypt';

// Fixed fixtures generated with CryptoJS 4.2.0 and the existing yzf key.
test.each([
	['', '9OsFojwkX3ZsEh1bFvOdlw=='],
	['hello', 'Jfs2J/fgSCN3q2PI/jFP8Q=='],
	['你好🌍', '+O8YWiI48xV/bR6T5ICx5w=='],
	['0123456789abcdef', '0zjfhH4BwchlpA55EiO6XvTrBaI8JF92bBIdWxbznZc='],
	['\ufeffhello\u0000世界', 'qzzsIYrt9KNmO3VacPm7kQ=='],
	[
		'a'.repeat(64),
		'H4YFRKvIvl3G5HQfdlRXhR+GBUSryL5dxuR0H3ZUV4UfhgVEq8i+XcbkdB92VFeFH4YFRKvIvl3G5HQfdlRXhfTrBaI8JF92bBIdWxbznZc=',
	],
])('decrypts existing yzf ciphertext: %j', (plaintext, ciphertext) => {
	expect(decrypt(ciphertext)).toBe(plaintext);
});

test('preserves absent and empty input', () => {
	expect(decrypt(undefined)).toBeUndefined();
	expect(decrypt('')).toBe('');
});

test('rejects truncated ciphertext and invalid padding', () => {
	expect(() => decrypt('YWJj')).toThrow();
	expect(() => decrypt('AAAAAAAAAAAAAAAAAAAAAA==')).toThrow();
});
