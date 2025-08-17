import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseS3Url } from './parseS3Url';

describe('parseS3Url', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('should return undefined for empty URL', () => {
		const result = parseS3Url({ url: '' });
		expect(result).toBeUndefined();
	});

	it('should return undefined for undefined URL', () => {
		const result = parseS3Url({ url: undefined });
		expect(result).toBeUndefined();
	});

	it('should parse basic HTTPS URL', () => {
		const result = parseS3Url({ url: 'https://s3.amazonaws.com/bucket-name' });
		expect(result).toEqual({
			accessKeyId: undefined,
			secretAccessKey: undefined,
			endpoint: 's3.amazonaws.com',
			port: undefined,
			useSsl: true,
			region: undefined,
			pathStyle: true,
			bucket: 'bucket-name',
		});
	});

	it('should parse basic HTTP URL', () => {
		const result = parseS3Url({ url: 'http://s3.amazonaws.com/bucket-name' });
		expect(result).toEqual({
			accessKeyId: undefined,
			secretAccessKey: undefined,
			endpoint: 's3.amazonaws.com',
			port: undefined,
			useSsl: false,
			region: undefined,
			pathStyle: true,
			bucket: 'bucket-name',
		});
	});

	it('should parse S3 protocol URL', () => {
		const result = parseS3Url({ url: 's3://s3.amazonaws.com/bucket-name' });
		expect(result).toEqual({
			accessKeyId: undefined,
			secretAccessKey: undefined,
			endpoint: 's3.amazonaws.com',
			port: undefined,
			useSsl: true,
			region: undefined,
			pathStyle: true,
			bucket: 'bucket-name',
		});
	});

	it('should parse URL with credentials', () => {
		const result = parseS3Url({ url: 'https://user:pass@s3.amazonaws.com/bucket-name' });
		expect(result).toEqual({
			accessKeyId: 'user',
			secretAccessKey: 'pass',
			endpoint: 's3.amazonaws.com',
			port: undefined,
			useSsl: true,
			region: undefined,
			pathStyle: true,
			bucket: 'bucket-name',
		});
	});

	it('should parse URL with port', () => {
		const result = parseS3Url({ url: 'https://s3.amazonaws.com:9000/bucket-name' });
		expect(result).toEqual({
			accessKeyId: undefined,
			secretAccessKey: undefined,
			endpoint: 's3.amazonaws.com',
			port: 9000,
			useSsl: true,
			region: undefined,
			pathStyle: true,
			bucket: 'bucket-name',
		});
	});

	it('should parse URL with region query parameter', () => {
		const result = parseS3Url({ url: 'https://s3.amazonaws.com/bucket-name?region=us-east-1' });
		expect(result).toEqual({
			accessKeyId: undefined,
			secretAccessKey: undefined,
			endpoint: 's3.amazonaws.com',
			port: undefined,
			useSsl: true,
			region: 'us-east-1',
			pathStyle: true,
			bucket: 'bucket-name',
		});
	});

	it('should parse URL with pathStyle parameter', () => {
		const result = parseS3Url({ url: 'https://s3.amazonaws.com/bucket-name?pathStyle=true' });
		expect(result).toEqual({
			accessKeyId: undefined,
			secretAccessKey: undefined,
			endpoint: 's3.amazonaws.com',
			port: undefined,
			useSsl: true,
			region: undefined,
			pathStyle: true,
			bucket: 'bucket-name',
		});
	});

	it('should parse URL with pathStyle=false parameter', () => {
		const result = parseS3Url({ url: 'https://s3.amazonaws.com/bucket-name?pathStyle=false' });
		expect(result).toEqual({
			accessKeyId: undefined,
			secretAccessKey: undefined,
			endpoint: 's3.amazonaws.com',
			port: undefined,
			useSsl: true,
			region: undefined,
			pathStyle: false,
			bucket: 'bucket-name',
		});
	});

	it('should detect path style for IP addresses', () => {
		const result = parseS3Url({ url: 'https://192.168.1.1/bucket-name' });
		expect(result).toEqual({
			accessKeyId: undefined,
			secretAccessKey: undefined,
			endpoint: '192.168.1.1',
			port: undefined,
			useSsl: true,
			region: undefined,
			pathStyle: true,
			bucket: 'bucket-name',
		});
	});

	it('should detect path style for IPv6 addresses', () => {
		const result = parseS3Url({ url: 'https://[2001:db8::1]/bucket-name' });
		expect(result).toEqual({
			accessKeyId: undefined,
			secretAccessKey: undefined,
			endpoint: '[2001:db8::1]',
			port: undefined,
			useSsl: true,
			region: undefined,
			pathStyle: true,
			bucket: 'bucket-name',
		});
	});

	it('should parse AWS virtual hosted style URL', () => {
		const result = parseS3Url({ url: 'https://my-bucket.s3.us-east-1.amazonaws.com' });
		expect(result).toEqual({
			accessKeyId: undefined,
			secretAccessKey: undefined,
			endpoint: 'my-bucket.s3.us-east-1.amazonaws.com',
			port: undefined,
			useSsl: true,
			region: 'us-east-1',
			pathStyle: false,
			bucket: 'my-bucket',
		});
	});

	it('should parse AWS virtual hosted style URL with custom endpoint', () => {
		const result = parseS3Url({ url: 'https://my-bucket.s3.amazonaws.com' });
		expect(result).toEqual({
			accessKeyId: undefined,
			secretAccessKey: undefined,
			endpoint: 'my-bucket.s3.amazonaws.com',
			port: undefined,
			useSsl: true,
			region: undefined,
			pathStyle: false,
			bucket: 'my-bucket',
		});
	});

	it('should override parameters with provided options', () => {
		const result = parseS3Url({
			url: 'https://s3.amazonaws.com/bucket-name',
			region: 'us-west-2',
			pathStyle: false,
		});
		expect(result).toEqual({
			accessKeyId: undefined,
			secretAccessKey: undefined,
			endpoint: 's3.amazonaws.com',
			port: undefined,
			useSsl: true,
			region: 'us-west-2',
			pathStyle: false,
			bucket: 'bucket-name',
		});
	});

	it('should use S3_URL environment variable by default', () => {
		vi.stubEnv('S3_URL', 'https://env-bucket.s3.amazonaws.com');
		const result = parseS3Url();
		expect(result).toEqual({
			accessKeyId: undefined,
			secretAccessKey: undefined,
			endpoint: 'env-bucket.s3.amazonaws.com',
			port: undefined,
			useSsl: true,
			region: undefined,
			pathStyle: false,
			bucket: 'env-bucket',
		});
	});

	it('should throw error for invalid URL', () => {
		expect(() => parseS3Url({ url: 'invalid-url' })).toThrow('Invalid S3 URL: invalid-url');
	});

	it('should handle complex URL with multiple parameters', () => {
		const result = parseS3Url({
			url: 'https://user:pass@custom-s3.com:9000/my-bucket?region=us-east-1&pathStyle=true',
		});
		expect(result).toEqual({
			accessKeyId: 'user',
			secretAccessKey: 'pass',
			endpoint: 'custom-s3.com',
			port: 9000,
			useSsl: true,
			region: 'us-east-1',
			pathStyle: true,
			bucket: 'my-bucket',
		});
	});

	it('should ignore undefined and null values in rest parameters', () => {
		const result = parseS3Url({
			url: 'https://s3.amazonaws.com/bucket-name',
			region: 'us-west-2',
			port: undefined,
			useSsl: null as any,
		});
		expect(result).toEqual({
			accessKeyId: undefined,
			secretAccessKey: undefined,
			endpoint: 's3.amazonaws.com',
			port: undefined,
			useSsl: true,
			region: 'us-west-2',
			pathStyle: true,
			bucket: 'bucket-name',
		});
	});
});