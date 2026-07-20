import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import { createMinioFileSystem } from '../minio/createMinioFileSystem';

const S3_URL = process.env.S3_URL;

// Use a test prefix to avoid conflicts with real data
const TEST_PREFIX = `test-${Date.now()}`;

describe.skipIf(!S3_URL)('MinioFileSystem', () => {
	let fs: ReturnType<typeof createMinioFileSystem>;

	beforeEach(() => {
		fs = createMinioFileSystem({
			url: S3_URL!,
			prefix: TEST_PREFIX,
		});
	});

	// Cleanup: remove all test files after all tests
	afterAll(async () => {
		if (S3_URL && fs) {
			try {
				await fs.rm('/', { recursive: true, force: true });
			} catch {
				// Ignore cleanup errors
			}
		}
	});

	describe('readdir', () => {
		test('should list root directory', async () => {
			const entries = await fs.readdir('/');
			expect(Array.isArray(entries)).toBe(true);
			entries.forEach((entry) => {
				expect(entry).toHaveProperty('path');
				expect(entry).toHaveProperty('name');
				expect(entry).toHaveProperty('kind');
				expect(entry).toHaveProperty('size');
				expect(entry).toHaveProperty('mtime');
				expect(['file', 'directory']).toContain(entry.kind);
			});
		});

		test('should list directory with recursive option', async () => {
			// Create test structure
			await fs.writeFile('/test-file.txt', 'test');
			await fs.mkdir('/test-dir');
			await fs.writeFile('/test-dir/nested.txt', 'nested');

			const entries = await fs.readdir('/', { recursive: true });
			const fileNames = entries.map((e) => e.name);
			const paths = entries.map((e) => e.path);
			expect(fileNames).toContain('test-file.txt');
			expect(fileNames).toContain('test-dir');
			// In recursive mode, nested files should appear with their relative path
			expect(paths.some((p) => p.includes('nested.txt'))).toBe(true);
		});

		test('should filter by kind', async () => {
			await fs.writeFile('/filter-file.txt', 'test');
			await fs.mkdir('/filter-dir');

			const files = await fs.readdir('/', { kind: 'file' });
			expect(files.every((f) => f.kind === 'file')).toBe(true);

			const dirs = await fs.readdir('/', { kind: 'directory' });
			expect(dirs.every((d) => d.kind === 'directory')).toBe(true);
		});

		test('should filter hidden files', async () => {
			await fs.writeFile('/.hidden', 'hidden');
			await fs.writeFile('/visible.txt', 'visible');

			const entries = await fs.readdir('/', { hidden: false });
			const names = entries.map((e) => e.name);
			expect(names).not.toContain('.hidden');
			expect(names).toContain('visible.txt');

			const allEntries = await fs.readdir('/', { hidden: true });
			const allNames = allEntries.map((e) => e.name);
			expect(allNames).toContain('.hidden');
		});

		test('should support depth option', async () => {
			await fs.mkdir('/depth1', { recursive: true });
			await fs.mkdir('/depth1/depth2', { recursive: true });
			await fs.writeFile('/depth1/depth2/file.txt', 'test');

			const depth1 = await fs.readdir('/', { depth: 1 });
			expect(depth1.some((e) => e.name === 'depth1')).toBe(true);
			expect(depth1.some((e) => e.name === 'file.txt')).toBe(false);

			const depth2 = await fs.readdir('/', { depth: 2 });
			expect(depth2.some((e) => e.name === 'file.txt')).toBe(true);
		});
	});

	describe('stat', () => {
		test('should stat root directory', async () => {
			const stat = await fs.stat('/');
			expect(stat.kind).toBe('directory');
			expect(stat.path).toBe('/');
		});

		test('should stat a file', async () => {
			await fs.writeFile('/stat-test.txt', 'test content');
			const stat = await fs.stat('/stat-test.txt');
			expect(stat.kind).toBe('file');
			expect(stat.size).toBe(12); // "test content" is 12 bytes
			expect(stat.name).toBe('stat-test.txt');
		});

		test('should stat a directory', async () => {
			await fs.mkdir('/stat-dir');
			const stat = await fs.stat('/stat-dir');
			expect(stat.kind).toBe('directory');
			expect(stat.name).toBe('stat-dir');
		});

		test('should throw error for non-existent file', async () => {
			await expect(fs.stat('/nonexistent.txt')).rejects.toThrow('File not found');
		});
	});

	describe('readFile and writeFile', () => {
		test('should write and read text file', async () => {
			const content = 'Hello, World!';
			await fs.writeFile('/hello.txt', content);
			const read = await fs.readFile('/hello.txt', { encoding: 'text' });
			expect(read).toBe(content);
		});

		test('should write and read binary file', async () => {
			const content = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
			await fs.writeFile('/binary.bin', content);
			const read = await fs.readFile('/binary.bin');
			expect(Buffer.from(read)).toEqual(content);
		});

		test('should overwrite file by default', async () => {
			await fs.writeFile('/overwrite.txt', 'original');
			await fs.writeFile('/overwrite.txt', 'updated');
			const content = await fs.readFile('/overwrite.txt', { encoding: 'text' });
			expect(content).toBe('updated');
		});

		test('should prevent overwrite when overwrite=false', async () => {
			await fs.writeFile('/no-overwrite.txt', 'original');
			await expect(fs.writeFile('/no-overwrite.txt', 'new', { overwrite: false })).rejects.toThrow(
				'File already exists',
			);
		});

		test('should handle large files', async () => {
			const largeContent = 'x'.repeat(10000);
			await fs.writeFile('/large.txt', largeContent);
			const read = await fs.readFile('/large.txt', { encoding: 'text' });
			expect(read).toBe(largeContent);
			expect(read.length).toBe(10000);
		});

		test('should throw error when reading non-existent file', async () => {
			await expect(fs.readFile('/nonexistent.txt')).rejects.toThrow('File not found');
		});
	});

	describe('mkdir', () => {
		test('should create directory', async () => {
			await fs.mkdir('/new-dir');
			expect(await fs.exists('/new-dir')).toBe(true);
			const stat = await fs.stat('/new-dir');
			expect(stat.kind).toBe('directory');
		});

		test('should create nested directories recursively', async () => {
			await fs.mkdir('/nested/deep/dir', { recursive: true });
			expect(await fs.exists('/nested/deep/dir')).toBe(true);
		});

		test('should handle creating root directory', async () => {
			await expect(fs.mkdir('/')).resolves.not.toThrow();
		});
	});

	describe('rm', () => {
		test('should remove a file', async () => {
			await fs.writeFile('/to-remove.txt', 'content');
			expect(await fs.exists('/to-remove.txt')).toBe(true);

			await fs.rm('/to-remove.txt');
			expect(await fs.exists('/to-remove.txt')).toBe(false);
		});

		test('should remove directory recursively', async () => {
			await fs.mkdir('/rm-dir', { recursive: true });
			await fs.writeFile('/rm-dir/file1.txt', 'file1');
			await fs.writeFile('/rm-dir/file2.txt', 'file2');
			await fs.mkdir('/rm-dir/subdir', { recursive: true });
			await fs.writeFile('/rm-dir/subdir/file3.txt', 'file3');

			await fs.rm('/rm-dir', { recursive: true });
			expect(await fs.exists('/rm-dir')).toBe(false);
		});

		test('should handle force option', async () => {
			await expect(fs.rm('/nonexistent.txt')).rejects.toThrow();
			await expect(fs.rm('/nonexistent.txt', { force: true })).resolves.not.toThrow();
		});
	});

	describe('rename', () => {
		test('should rename a file', async () => {
			await fs.writeFile('/old-name.txt', 'content');
			await fs.rename('/old-name.txt', '/new-name.txt');

			expect(await fs.exists('/old-name.txt')).toBe(false);
			expect(await fs.exists('/new-name.txt')).toBe(true);
			const content = await fs.readFile('/new-name.txt', { encoding: 'text' });
			expect(content).toBe('content');
		});

		test('should rename a directory', async () => {
			await fs.mkdir('/old-dir', { recursive: true });
			await fs.writeFile('/old-dir/file.txt', 'content');

			// Clean up any existing new-dir first
			try {
				await fs.rm('/new-dir', { recursive: true, force: true });
			} catch {
				// Ignore if doesn't exist
			}

			await fs.rename('/old-dir', '/new-dir');

			expect(await fs.exists('/old-dir')).toBe(false);
			expect(await fs.exists('/new-dir')).toBe(true);
			expect(await fs.exists('/new-dir/file.txt')).toBe(true);
			const content = await fs.readFile('/new-dir/file.txt', { encoding: 'text' });
			expect(content).toBe('content');
		});

		test('should prevent overwrite when overwrite=false', async () => {
			await fs.writeFile('/source.txt', 'source');
			await fs.writeFile('/target.txt', 'target');

			await expect(fs.rename('/source.txt', '/target.txt', { overwrite: false })).rejects.toThrow(
				'Destination already exists',
			);
		});

		test('should allow overwrite when overwrite=true', async () => {
			await fs.writeFile('/source.txt', 'source');
			await fs.writeFile('/target.txt', 'target');

			await fs.rename('/source.txt', '/target.txt', { overwrite: true });
			expect(await fs.exists('/source.txt')).toBe(false);
			const content = await fs.readFile('/target.txt', { encoding: 'text' });
			expect(content).toBe('source');
		});
	});

	describe('copy', () => {
		test('should copy a file', async () => {
			await fs.writeFile('/source.txt', 'source content');
			await fs.copy('/source.txt', '/dest.txt');

			expect(await fs.exists('/source.txt')).toBe(true);
			expect(await fs.exists('/dest.txt')).toBe(true);
			const source = await fs.readFile('/source.txt', { encoding: 'text' });
			const dest = await fs.readFile('/dest.txt', { encoding: 'text' });
			expect(source).toBe(dest);
			expect(dest).toBe('source content');
		});

		test('should copy a directory recursively', async () => {
			await fs.mkdir('/copy-source', { recursive: true });
			await fs.writeFile('/copy-source/file1.txt', 'file1');
			await fs.writeFile('/copy-source/file2.txt', 'file2');
			await fs.mkdir('/copy-source/subdir', { recursive: true });
			await fs.writeFile('/copy-source/subdir/file3.txt', 'file3');

			await fs.copy('/copy-source', '/copy-dest');

			expect(await fs.exists('/copy-dest/file1.txt')).toBe(true);
			expect(await fs.exists('/copy-dest/file2.txt')).toBe(true);
			expect(await fs.exists('/copy-dest/subdir/file3.txt')).toBe(true);
		});

		test('should prevent overwrite when overwrite=false', async () => {
			await fs.writeFile('/copy-src.txt', 'source');
			await fs.writeFile('/copy-dst.txt', 'target');

			await expect(fs.copy('/copy-src.txt', '/copy-dst.txt', { overwrite: false })).rejects.toThrow(
				'Destination already exists',
			);
		});

		test('should allow overwrite when overwrite=true', async () => {
			await fs.writeFile('/copy-src.txt', 'source');
			await fs.writeFile('/copy-dst.txt', 'target');

			await fs.copy('/copy-src.txt', '/copy-dst.txt', { overwrite: true });
			const content = await fs.readFile('/copy-dst.txt', { encoding: 'text' });
			expect(content).toBe('source');
		});
	});

	describe('exists', () => {
		test('should return true for existing file', async () => {
			await fs.writeFile('/exists-file.txt', 'test');
			expect(await fs.exists('/exists-file.txt')).toBe(true);
		});

		test('should return true for existing directory', async () => {
			await fs.mkdir('/exists-dir');
			expect(await fs.exists('/exists-dir')).toBe(true);
		});

		test('should return true for root directory', async () => {
			expect(await fs.exists('/')).toBe(true);
		});

		test('should return false for non-existent path', async () => {
			expect(await fs.exists('/nonexistent')).toBe(false);
		});
	});

	describe('streams', () => {
		test('should support createReadStream', async () => {
			await fs.writeFile('/stream-read.txt', 'Stream content');
			const stream = fs.createReadStream('/stream-read.txt');
			expect(stream).toBeDefined();

			const chunks: Buffer[] = [];
			// Use stream events instead of async iteration for compatibility
			await new Promise<void>((resolve, reject) => {
				stream.on('data', (chunk) => {
					chunks.push(chunk);
				});
				stream.on('end', () => {
					resolve();
				});
				stream.on('error', reject);
			});
			expect(Buffer.concat(chunks).toString()).toBe('Stream content');
		});

		test('should support createReadStream with range', async () => {
			await fs.writeFile('/stream-range.txt', 'Hello, World!');
			const stream = fs.createReadStream('/stream-range.txt', { range: { start: 0, end: 4 } });

			const chunks: Buffer[] = [];
			// Use stream events instead of async iteration for compatibility
			await new Promise<void>((resolve, reject) => {
				stream.on('data', (chunk) => {
					chunks.push(chunk);
				});
				stream.on('end', () => {
					resolve();
				});
				stream.on('error', reject);
			});
			expect(Buffer.concat(chunks).toString()).toBe('Hello');
		});

		test('should support createReadableStream', async () => {
			await fs.writeFile('/readable-stream.txt', 'Readable stream content');
			const stream = fs.createReadableStream('/readable-stream.txt');

			const reader = stream.getReader();
			const chunks: Uint8Array[] = [];
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				if (value) chunks.push(value);
			}

			const content = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString();
			expect(content).toBe('Readable stream content');
		});

		test('should support createWritableStream', async () => {
			const stream = fs.createWritableStream('/writable-stream.txt');
			const writer = stream.getWriter();

			await writer.write(new TextEncoder().encode('Part 1'));
			await writer.write(new TextEncoder().encode('Part 2'));
			await writer.close();

			const content = await fs.readFile('/writable-stream.txt', { encoding: 'text' });
			expect(content).toBe('Part 1Part 2');
		});
	});

	describe('edge cases', () => {
		test('should handle empty file', async () => {
			await fs.writeFile('/empty.txt', '');
			const stat = await fs.stat('/empty.txt');
			expect(stat.size).toBe(0);
			const content = await fs.readFile('/empty.txt', { encoding: 'text' });
			expect(content).toBe('');
		});

		test('should handle special characters in filename', async () => {
			await fs.writeFile('/file with spaces.txt', 'content');
			expect(await fs.exists('/file with spaces.txt')).toBe(true);
			const content = await fs.readFile('/file with spaces.txt', { encoding: 'text' });
			expect(content).toBe('content');
		});

		test('should handle unicode content', async () => {
			const unicode = '你好世界 🌍';
			await fs.writeFile('/unicode.txt', unicode);
			const content = await fs.readFile('/unicode.txt', { encoding: 'text' });
			expect(content).toBe(unicode);
		});

		test('should handle path normalization', async () => {
			await fs.writeFile('/normalize.txt', 'test');
			expect(await fs.exists('/normalize.txt')).toBe(true);
			expect(await fs.exists('/./normalize.txt')).toBe(true);
		});
	});

	describe('prefix support', () => {
		test('should scope operations to prefix', async () => {
			const prefixedFs = createMinioFileSystem({
				url: S3_URL!,
				prefix: `${TEST_PREFIX}/prefixed`,
			});

			await prefixedFs.writeFile('/test.txt', 'prefixed content');
			expect(await prefixedFs.exists('/test.txt')).toBe(true);
			const content = await prefixedFs.readFile('/test.txt', { encoding: 'text' });
			expect(content).toBe('prefixed content');

			// Cleanup
			await prefixedFs.rm('/', { recursive: true, force: true });
		});
	});
});
