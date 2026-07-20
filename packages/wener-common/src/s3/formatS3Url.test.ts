import { describe, expect, it } from 'vitest';
import { formatS3Url } from './formatS3Url';
import type { ParsedS3Options } from './parseS3Url';

describe('formatS3Url', () => {
	it('should format basic S3 URL with default endpoint', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
		};
		const result = formatS3Url(options);
		expect(result).toBe('https://s3.amazonaws.com/');
	});

	it('should format S3 URL with custom endpoint', () => {
		const options: ParsedS3Options = {
			endpoint: 'custom-s3.com',
		};
		const result = formatS3Url(options);
		expect(result).toBe('https://custom-s3.com/');
	});

	it('should format S3 URL with HTTP protocol', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			useSsl: false,
		};
		const result = formatS3Url(options);
		expect(result).toBe('http://s3.amazonaws.com/');
	});

	it('should format S3 URL with port', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			port: 9000,
		};
		const result = formatS3Url(options);
		expect(result).toBe('https://s3.amazonaws.com:9000/');
	});

	it('should format S3 URL with bucket in path style', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			bucket: 'my-bucket',
			pathStyle: true,
		};
		const result = formatS3Url(options);
		expect(result).toBe('https://s3.amazonaws.com/my-bucket/');
	});

	it('should format S3 URL with bucket in virtual hosted style', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			bucket: 'my-bucket',
			pathStyle: false,
		};
		const result = formatS3Url(options);
		expect(result).toBe('https://my-bucket.s3.amazonaws.com/');
	});

	it('should format S3 URL with credentials', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			accessKeyId: 'user',
			secretAccessKey: 'pass',
		};
		const result = formatS3Url(options, { credentials: true });
		expect(result).toBe('https://user:pass@s3.amazonaws.com/');
	});

	it('should format S3 URL with credentials and special characters', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			accessKeyId: 'user@example.com',
			secretAccessKey: 'pass/word',
		};
		const result = formatS3Url(options, { credentials: true });
		expect(result).toBe('https://user%40example.com:pass%2Fword@s3.amazonaws.com/');
	});

	it('should format S3 URL with region in query parameters', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			region: 'us-east-1',
		};
		const result = formatS3Url(options, { useParams: true });
		expect(result).toBe('https://s3.amazonaws.com/?region=us-east-1');
	});

	it('should format S3 URL with pathStyle in query parameters', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			pathStyle: true,
		};
		const result = formatS3Url(options, { useParams: true });
		expect(result).toBe('https://s3.amazonaws.com/?pathStyle=true');
	});

	it('should format S3 URL with all parameters', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			accessKeyId: 'user',
			secretAccessKey: 'pass',
			region: 'us-east-1',
			port: 9000,
			bucket: 'my-bucket',
			pathStyle: true,
			useSsl: true,
		};
		const result = formatS3Url(options, { credentials: true, useParams: true });
		expect(result).toBe('https://user:pass@s3.amazonaws.com:9000/my-bucket/?region=us-east-1&pathStyle=true');
	});

	it('should handle full URL as endpoint', () => {
		const options: ParsedS3Options = {
			endpoint: 'https://custom-s3.com:9000',
			bucket: 'my-bucket',
			pathStyle: true,
		};
		const result = formatS3Url(options);
		expect(result).toBe('https://custom-s3.com:9000/my-bucket/');
	});

	it('should handle complex virtual hosted style with existing bucket in hostname', () => {
		const options: ParsedS3Options = {
			endpoint: 'my-bucket.s3.amazonaws.com',
			bucket: 'my-bucket',
			pathStyle: false,
		};
		const result = formatS3Url(options);
		expect(result).toBe('https://my-bucket.s3.amazonaws.com/');
	});

	it('should throw error for missing endpoint', () => {
		const options = {} as ParsedS3Options;
		expect(() => formatS3Url(options)).toThrow('Endpoint is required');
	});

	it('should handle endpoint without protocol by adding https://', () => {
		const options: ParsedS3Options = {
			endpoint: 'custom-s3.com',
		};
		const result = formatS3Url(options);
		expect(result).toBe('https://custom-s3.com/');
	});

	it('should throw error for missing credentials when credentials=true', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			accessKeyId: 'user',
		};
		expect(() => formatS3Url(options, { credentials: true })).toThrow(
			'Access Key ID and Secret Access Key are required for credentials',
		);
	});

	it('should throw error for invalid port', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			port: 99999,
		};
		expect(() => formatS3Url(options)).toThrow('Port must be a valid number between 1 and 65535');
	});

	it('should throw error for invalid bucket name', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			bucket: 'Invalid Bucket Name',
		};
		expect(() => formatS3Url(options)).toThrow('Invalid bucket name: Invalid Bucket Name');
	});

	it('should throw error for bucket name with consecutive dots', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			bucket: 'my..bucket',
		};
		expect(() => formatS3Url(options)).toThrow('Invalid bucket name: my..bucket');
	});

	it('should throw error for bucket name with hyphen at start', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			bucket: '-mybucket',
		};
		expect(() => formatS3Url(options)).toThrow('Invalid bucket name: -mybucket');
	});

	it('should throw error for bucket name with hyphen at end', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			bucket: 'mybucket-',
		};
		expect(() => formatS3Url(options)).toThrow('Invalid bucket name: mybucket-');
	});

	it('should handle bucket name with dot-hyphen (currently allowed)', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			bucket: 'my.bucket-name',
			pathStyle: true,
		};
		const result = formatS3Url(options);
		expect(result).toBe('https://s3.amazonaws.com/my.bucket-name/');
	});

	it('should throw error for bucket name that is too short', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			bucket: 'ab',
		};
		expect(() => formatS3Url(options)).toThrow('Invalid bucket name: ab');
	});

	it('should throw error for bucket name that is too long', () => {
		const options: ParsedS3Options = {
			endpoint: 's3.amazonaws.com',
			bucket: 'a'.repeat(64),
		};
		expect(() => formatS3Url(options)).toThrow(`Invalid bucket name: ${'a'.repeat(64)}`);
	});

	it('should handle valid bucket names with various formats', () => {
		const validBuckets = ['my-bucket', 'my.bucket', 'mybucket123', '123bucket', 'test-bucket-123'];

		validBuckets.forEach((bucket) => {
			const options: ParsedS3Options = {
				endpoint: 's3.amazonaws.com',
				bucket,
				pathStyle: true,
			};
			expect(() => formatS3Url(options)).not.toThrow();
		});
	});

	it('should handle pathname concatenation correctly in path style', () => {
		const options: ParsedS3Options = {
			endpoint: 'https://s3.amazonaws.com/path/to/something',
			bucket: 'my-bucket',
			pathStyle: true,
		};
		const result = formatS3Url(options);
		expect(result).toBe('https://s3.amazonaws.com/my-bucket/path/to/something');
	});

	it('should handle URL with existing pathname in virtual hosted style', () => {
		const options: ParsedS3Options = {
			endpoint: 'https://s3.amazonaws.com/path/to/something',
			bucket: 'my-bucket',
			pathStyle: false,
		};
		const result = formatS3Url(options);
		expect(result).toBe('https://my-bucket.s3.amazonaws.com/path/to/something');
	});
});
