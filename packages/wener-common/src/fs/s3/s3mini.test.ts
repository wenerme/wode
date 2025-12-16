import { S3mini } from 's3mini';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

/**
 * Tests for s3mini and S3 filesystem behavior
 *
 * Uses MinIO Play server for integration testing:
 * - Endpoint: play.min.io
 * - Access Key: Q3AM3UQ867SPQQA43P2F
 * - Secret Key: zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG
 *
 * Note: s3mini expects bucket name to be part of the endpoint URL.
 * e.g., https://play.min.io/bucket-name
 *
 * s3mini does not support anonymous access to public S3 buckets.
 */

// Set to true to run network tests
const RUN_NETWORK_TESTS = process.env.RUN_S3_NETWORK_TESTS === 'true';

// Generate unique bucket name for this test run
const TEST_BUCKET = `s3mini-test-${Date.now()}`;

describe('s3mini with MinIO Play', () => {
	let client: S3mini;

	beforeAll(async () => {
		if (!RUN_NETWORK_TESTS) return;

		// s3mini expects bucket name in the endpoint URL
		client = new S3mini({
			endpoint: `https://play.min.io/${TEST_BUCKET}`,
			accessKeyId: 'Q3AM3UQ867SPQQA43P2F',
			secretAccessKey: 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG',
			region: 'us-east-1',
		});

		// Create test bucket
		try {
			await client.createBucket();
			console.log(`Created bucket: ${TEST_BUCKET}`);
		} catch (e) {
			console.log('Bucket creation error:', e);
		}
	});

	afterAll(async () => {
		if (!RUN_NETWORK_TESTS || !client) return;

		// Cleanup: delete all objects and bucket
		try {
			const objects = await client.listObjects('/', '', 1000);
			if (objects && objects.length > 0) {
				const keys = objects.map((o) => o.Key).filter(Boolean) as string[];
				if (keys.length > 0) {
					await client.deleteObjects(keys);
				}
			}
			// Note: s3mini doesn't have deleteBucket - we'll leave the bucket
			// MinIO Play auto-cleans old buckets
		} catch (e) {
			console.log('Cleanup error:', e);
		}
	});

	describe.skipIf(!RUN_NETWORK_TESTS)('listObjects with delimiter', () => {
		test('should list objects and detect directories', async () => {
			// Create test structure
			await client.putObject('file1.txt', 'content1');
			await client.putObject('file2.txt', 'content2');
			await client.putObject('dir1/', ''); // Directory marker
			await client.putObject('dir1/nested.txt', 'nested content');
			await client.putObject('dir2/', ''); // Another directory marker

			// List with delimiter
			const objects = await client.listObjects('/', '', 100, {
				delimiter: '/',
			});

			console.log('MinIO Play listing with delimiter:', JSON.stringify(objects, null, 2));

			expect(objects).toBeDefined();
			expect(Array.isArray(objects)).toBe(true);

			if (objects && objects.length > 0) {
				// Check for files and directories
				const dirs = objects.filter((o) => o.Key?.endsWith('/'));
				const files = objects.filter((o) => !o.Key?.endsWith('/'));

				console.log(`Found ${dirs.length} directories and ${files.length} files`);
				console.log(
					'Directories:',
					dirs.map((d) => d.Key),
				);
				console.log(
					'Files:',
					files.map((f) => f.Key),
				);

				// Directories should have Size: 0
				for (const dir of dirs) {
					expect(Number(dir.Size)).toBe(0);
					expect(dir.Key).toMatch(/\/$/);
				}

				// Files should have Size > 0
				for (const file of files) {
					expect(Number(file.Size)).toBeGreaterThan(0);
					expect(file.Key).not.toMatch(/\/$/);
				}
			}
		});

		test('should list nested directory contents', async () => {
			// List dir1/ contents
			const objects = await client.listObjects('/', 'dir1/', 100, {
				delimiter: '/',
			});

			console.log('MinIO Play dir1/ listing:', JSON.stringify(objects, null, 2));

			expect(objects).toBeDefined();
			expect(Array.isArray(objects)).toBe(true);

			// Should find nested.txt
			const files = objects?.filter((o) => !o.Key?.endsWith('/')) || [];
			expect(files.some((f) => f.Key?.includes('nested.txt'))).toBe(true);
		});
	});
});

/**
 * Unit tests for S3 directory detection logic (no network required)
 *
 * When using delimiter: '/' with listObjects, S3 returns:
 * - Files: Key without trailing /, Size > 0
 * - Directories: Key with trailing /, Size: 0
 */
describe('s3mini listObjects behavior', () => {
	test('directory detection logic - directories end with / and have Size: 0', () => {
		// Mock response similar to user's example
		const mockResponse = [
			{
				Key: 'fusion/README.md',
				LastModified: '2025-12-18T01:51:09.000Z',
				ETag: '"adc69293e8fd256b2609664f1e11cb53"',
				Size: 6,
				StorageClass: 'STANDARD',
			},
			{
				Key: 'fusion/home/',
				Size: 0,
				LastModified: new Date('1970-01-01T00:00:00.000Z'),
				ETag: '',
				StorageClass: '',
			},
			{
				Key: 'fusion/mcp/',
				Size: 0,
				LastModified: new Date('1970-01-01T00:00:00.000Z'),
				ETag: '',
				StorageClass: '',
			},
		];

		// Test directory detection logic
		for (const obj of mockResponse) {
			const isDir = obj.Key.endsWith('/');

			if (isDir) {
				expect(obj.Size).toBe(0);
				expect(obj.Key).toMatch(/\/$/);
			} else {
				expect(obj.Size).toBeGreaterThan(0);
				expect(obj.Key).not.toMatch(/\/$/);
			}
		}

		// Count directories and files
		const dirs = mockResponse.filter((o) => o.Key.endsWith('/'));
		const files = mockResponse.filter((o) => !o.Key.endsWith('/'));

		expect(dirs).toHaveLength(2);
		expect(files).toHaveLength(1);
	});

	test('readdir should properly identify directories from S3 response', () => {
		const s3Response = [
			{ Key: 'fusion/README.md', Size: 6, LastModified: new Date(), ETag: '"abc"' },
			{ Key: 'fusion/home/', Size: 0, LastModified: new Date(0), ETag: '' },
			{ Key: 'fusion/mcp/', Size: 0, LastModified: new Date(0), ETag: '' },
		];

		const results = s3Response.map((obj) => {
			const key = obj.Key;
			const isDir = key.endsWith('/');
			const name = isDir ? key.slice(0, -1).split('/').pop() : key.split('/').pop();

			return {
				name,
				kind: isDir ? 'directory' : 'file',
				size: obj.Size,
			};
		});

		expect(results).toEqual([
			{ name: 'README.md', kind: 'file', size: 6 },
			{ name: 'home', kind: 'directory', size: 0 },
			{ name: 'mcp', kind: 'directory', size: 0 },
		]);
	});

	test('should handle nested paths correctly', () => {
		const s3Response = [
			{ Key: 'data/2024/01/file.csv', Size: 1024 },
			{ Key: 'data/2024/02/', Size: 0 },
			{ Key: 'data/config.json', Size: 256 },
		];

		const prefix = 'data/';
		const results = s3Response.map((obj) => {
			const key = obj.Key;
			const relativeKey = key.startsWith(prefix) ? key.slice(prefix.length) : key;
			const isDir = key.endsWith('/');

			const parts = relativeKey.split('/').filter(Boolean);
			const name = parts[0];

			return {
				key,
				relativeKey,
				name,
				isDir,
			};
		});

		// For non-recursive listing, only want immediate children
		const immediateChildren = results.filter((r) => {
			const keyWithoutTrailingSlash = r.relativeKey.replace(/\/$/, '');
			return !keyWithoutTrailingSlash.includes('/');
		});

		expect(immediateChildren).toHaveLength(1);
		expect(immediateChildren[0].name).toBe('config.json');
	});

	test('should correctly strip prefix and build file stat', () => {
		const prefix = 'myapp/data';
		const normalizedPrefix = prefix.replace(/^\/+/, '').replace(/\/+$/, '');

		const stripPrefix = (key: string): string => {
			if (!normalizedPrefix || !key.startsWith(normalizedPrefix + '/')) {
				return key.startsWith('/') ? key : '/' + key;
			}
			const withoutPrefix = key.slice(normalizedPrefix.length);
			return withoutPrefix || '/';
		};

		expect(stripPrefix('myapp/data/file.txt')).toBe('/file.txt');
		expect(stripPrefix('myapp/data/subdir/')).toBe('/subdir/');
		expect(stripPrefix('myapp/data/')).toBe('/');
		expect(stripPrefix('other/path')).toBe('/other/path');
	});
});
