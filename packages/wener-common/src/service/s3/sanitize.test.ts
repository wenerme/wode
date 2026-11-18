import { describe, expect, it } from 'vitest';
import { sanitizeS3Output } from './sanitize';

describe('sanitizeS3Output', () => {
	it('redacts known credential keys', () => {
		const result = sanitizeS3Output({
			accessKeyId: 'AKIAFIXTURE',
			secretAccessKey: 'super-secret',
			accessKeyIdEnv: 'S3_KEY_ID_ENV',
			region: 'us-east-1',
		});
		expect(result).toMatchObject({
			accessKeyId: '<redacted>',
			secretAccessKey: '<redacted>',
			region: 'us-east-1',
		});
	});

	it('redacts userinfo credentials that leak into a URL string', () => {
		const result = sanitizeS3Output('error calling https://AKIAFIXTURE:super-secret@s3.example.test/bucket/key');
		expect(result).not.toContain('AKIAFIXTURE');
		expect(result).not.toContain('super-secret');
		expect(result).toContain('https://<redacted>@s3.example.test/bucket/key');
	});

	it('redacts bearer-style authorization headers embedded in text', () => {
		const result = sanitizeS3Output('Authorization: AWS4-HMAC-SHA256 Credential=AKIA/2024, SignedHeaders=host');
		expect(result).not.toContain('AKIA/2024');
	});

	it('passes through nested structures without credentials untouched', () => {
		const value = { objects: [{ Key: 'foo.txt', Size: 3 }] };
		expect(sanitizeS3Output(value)).toEqual(value);
	});
});
