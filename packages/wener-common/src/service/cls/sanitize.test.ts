import { describe, expect, it } from 'vitest';
import { sanitizeClsOutput } from './sanitize';

describe('sanitizeClsOutput', () => {
	it('redacts secret-shaped keys', () => {
		const result = sanitizeClsOutput({
			clientSecret: 'super-secret-value',
			client_secret: 'super-secret-value',
			token: 'abc',
			nested: { password: 'p@ss' },
			RequestId: 'req-1',
		});
		expect(result).toEqual({
			clientSecret: '<redacted>',
			client_secret: '<redacted>',
			token: '<redacted>',
			nested: { password: '<redacted>' },
			RequestId: 'req-1',
		});
	});

	it('redacts Authorization-like bearer strings embedded in text', () => {
		const result = sanitizeClsOutput({ message: 'Authorization: Bearer abc.def.ghi failed' });
		expect(result).toEqual({ message: 'Authorization: Bearer <redacted> failed' });
	});

	it('passes through arrays and primitives untouched otherwise', () => {
		expect(sanitizeClsOutput([1, 'a', null])).toEqual([1, 'a', null]);
	});
});
