import { beforeEach, describe, expect, test } from 'vitest';
import { createMemoryFileSystem } from './createMemoryFileSystem';

describe('MemoryFileSystem', () => {
	let fs: ReturnType<typeof createMemoryFileSystem>;

	beforeEach(() => {
		fs = createMemoryFileSystem({
			root: {
				path: '/',
				directory: '',
				name: '',
				kind: 'directory',
				meta: {},
				mtime: Date.now(),
				size: 0,
				children: [
					{
						path: '/README.txt',
						directory: '/',
						name: 'README.txt',
						kind: 'file',
						content: 'Hello',
						size: 5,
						meta: {},
						mtime: Date.now(),
					},
				],
			},
		});
	});

	test('should be implemented', async () => {
		expect(await fs.stat('/README.txt')).toMatchObject({
			path: '/README.txt',
			directory: '/',
			name: 'README.txt',
			kind: 'file',
			size: 5,
		});
		await fs.mkdir('/');
		expect(await fs.readdir('/')).toMatchObject([
			{
				path: '/README.txt',
				directory: '/',
				name: 'README.txt',
				kind: 'file',
				size: 5,
			},
		]);
		await fs.mkdir('/test');

		expect(fs.getUrl?.(await fs.stat('/README.txt'))).toBeTypeOf('string');
	});

	test('should handle AbortSignal', async () => {
		const controller = new AbortController();
		controller.abort();

		await expect(fs.stat('/README.txt', { signal: controller.signal })).rejects.toThrow('Operation aborted');
		await expect(fs.readdir('/', { signal: controller.signal })).rejects.toThrow('Operation aborted');
		await expect(fs.mkdir('/test', { signal: controller.signal })).rejects.toThrow('Operation aborted');
		await expect(fs.readFile('/README.txt', { signal: controller.signal })).rejects.toThrow('Operation aborted');
		await expect(fs.writeFile('/test.txt', 'test', { signal: controller.signal })).rejects.toThrow('Operation aborted');
		await expect(fs.rm('/README.txt', { signal: controller.signal })).rejects.toThrow('Operation aborted');
		await expect(fs.rename('/README.txt', '/new.txt', { signal: controller.signal })).rejects.toThrow(
			'Operation aborted',
		);
		await expect(fs.copy('/README.txt', '/copy.txt', { signal: controller.signal })).rejects.toThrow(
			'Operation aborted',
		);
	});

	test('should validate input parameters', async () => {
		await expect(fs.stat('')).rejects.toThrow('Invalid path');
		await expect(fs.stat(null as any)).rejects.toThrow('Invalid path');
		await expect(fs.stat(undefined as any)).rejects.toThrow('Invalid path');
		await expect(fs.stat(123 as any)).rejects.toThrow('Invalid path');

		await expect(fs.writeFile('', 'test')).rejects.toThrow('Invalid path');
		await expect(fs.writeFile('/test', null as any)).rejects.toThrow('Invalid data');
		await expect(fs.writeFile('/test', undefined as any)).rejects.toThrow('Invalid data');
		await expect(fs.writeFile('/', 'test')).rejects.toThrow('filename cannot be empty');
	});

	test('should support streaming operations', async () => {
		await fs.writeFile('/stream.txt', 'Hello, World!');

		// Test createReadStream
		const readStream = fs.createReadStream('/stream.txt');
		expect(readStream).toBeDefined();

		const chunks: Buffer[] = [];
		for await (const chunk of readStream) {
			chunks.push(chunk);
		}
		expect(Buffer.concat(chunks).toString()).toBe('Hello, World!');

		// Test createReadStream with range
		const rangeStream = fs.createReadStream('/stream.txt', { range: { start: 0, end: 4 } });
		const rangeChunks: Buffer[] = [];
		for await (const chunk of rangeStream) {
			rangeChunks.push(chunk);
		}
		expect(Buffer.concat(rangeChunks).toString()).toBe('Hello');

		// Test createWriteStream
		const writeStream = fs.createWriteStream('/write-test.txt');
		expect(writeStream).toBeDefined();

		writeStream.write('Test content');
		writeStream.end();

		await new Promise((resolve) => writeStream.on('finish', resolve));
		expect(await fs.readFile('/write-test.txt', { encoding: 'text' })).toBe('Test content');
	});

	test('should support Web Streams API', async () => {
		await fs.writeFile('/webstream.txt', 'Web Stream Test');

		// Test createReadableStream
		const readableStream = fs.createReadableStream('/webstream.txt');
		expect(readableStream).toBeDefined();

		const reader = readableStream.getReader();
		const { value } = await reader.read();
		expect(value.toString()).toBe('Web Stream Test');

		// Test createWritableStream
		const writableStream = fs.createWritableStream('/web-write-test.txt');
		expect(writableStream).toBeDefined();

		const writer = writableStream.getWriter();
		await writer.write(Buffer.from('Web Stream Write Test'));
		await writer.close();

		expect(await fs.readFile('/web-write-test.txt', { encoding: 'text' })).toBe('Web Stream Write Test');
	});

	test('should handle streaming errors', async () => {
		const controller = new AbortController();

		// Test read stream with abort
		const readStream = fs.createReadStream('/README.txt', { signal: controller.signal });
		controller.abort();

		await expect(
			new Promise((_, reject) => {
				readStream.on('error', reject);
			}),
		).rejects.toThrow('Operation aborted');

		// Test write stream with abort
		const controller2 = new AbortController();
		const writeStream = fs.createWriteStream('/abort-test.txt', { signal: controller2.signal });
		controller2.abort();

		await expect(
			new Promise((_, reject) => {
				writeStream.on('error', reject);
				writeStream.write('test');
			}),
		).rejects.toThrow('Operation aborted');
	});

	test('should handle file operations correctly', async () => {
		// Test file creation
		await fs.writeFile('/newfile.txt', 'New content');
		expect(await fs.exists('/newfile.txt')).toBe(true);

		const stat = await fs.stat('/newfile.txt');
		expect(stat.kind).toBe('file');
		expect(stat.size).toBe(11); // "New content" is 11 bytes

		// Test file reading
		const content = await fs.readFile('/newfile.txt', { encoding: 'text' });
		expect(content).toBe('New content');

		// Test file reading as binary
		const binary = await fs.readFile('/newfile.txt');
		expect(Buffer.from(binary).toString()).toBe('New content');

		// Test file overwrite
		await fs.writeFile('/newfile.txt', 'Updated content');
		expect(await fs.readFile('/newfile.txt', { encoding: 'text' })).toBe('Updated content');

		// Test file overwrite protection
		await expect(fs.writeFile('/newfile.txt', 'Should fail', { overwrite: false })).rejects.toThrow(
			'File already exists',
		);
	});

	test('should handle directory operations correctly', async () => {
		// Test directory creation
		await fs.mkdir('/newdir');
		expect(await fs.exists('/newdir')).toBe(true);

		const stat = await fs.stat('/newdir');
		expect(stat.kind).toBe('directory');

		// Test recursive directory creation
		await fs.mkdir('/deep/nested/dir', { recursive: true });
		expect(await fs.exists('/deep/nested/dir')).toBe(true);

		// Test non-recursive directory creation failure
		await expect(fs.mkdir('/another/deep/dir')).rejects.toThrow('Parent directory does not exist');

		// Test directory listing
		await fs.writeFile('/newdir/file1.txt', 'File 1');
		await fs.writeFile('/newdir/file2.txt', 'File 2');

		const contents = await fs.readdir('/newdir');
		expect(contents).toHaveLength(2);
		expect(contents.map((f) => f.name)).toContain('file1.txt');
		expect(contents.map((f) => f.name)).toContain('file2.txt');
	});

	test('should handle file removal correctly', async () => {
		await fs.writeFile('/toremove.txt', 'Remove me');
		expect(await fs.exists('/toremove.txt')).toBe(true);

		await fs.rm('/toremove.txt');
		expect(await fs.exists('/toremove.txt')).toBe(false);

		// Test force removal
		await expect(fs.rm('/nonexistent.txt')).rejects.toThrow('File not found');
		await fs.rm('/nonexistent.txt', { force: true }); // Should not throw

		// Test recursive removal
		await fs.mkdir('/dirwithfiles', { recursive: true });
		await fs.writeFile('/dirwithfiles/file.txt', 'content');
		await expect(fs.rm('/dirwithfiles')).rejects.toThrow('Directory not empty');
		await fs.rm('/dirwithfiles', { recursive: true });
		expect(await fs.exists('/dirwithfiles')).toBe(false);
	});

	test('should handle file rename correctly', async () => {
		await fs.writeFile('/rename.txt', 'Original content');
		expect(await fs.exists('/rename.txt')).toBe(true);

		await fs.rename('/rename.txt', '/renamed.txt');
		expect(await fs.exists('/rename.txt')).toBe(false);
		expect(await fs.exists('/renamed.txt')).toBe(true);
		expect(await fs.readFile('/renamed.txt', { encoding: 'text' })).toBe('Original content');
	});

	test('should handle file copy correctly', async () => {
		await fs.writeFile('/copy.txt', 'Copy me');
		expect(await fs.exists('/copy.txt')).toBe(true);

		await fs.copy('/copy.txt', '/copied.txt');
		expect(await fs.exists('/copy.txt')).toBe(true);
		expect(await fs.exists('/copied.txt')).toBe(true);
		expect(await fs.readFile('/copied.txt', { encoding: 'text' })).toBe('Copy me');

		// Test copy overwrite
		await fs.writeFile('/target2.txt', 'Target content');
		await expect(fs.copy('/copy.txt', '/target2.txt')).rejects.toThrow('Destination exists');
		await fs.copy('/copy.txt', '/target2.txt', { overwrite: true });
		expect(await fs.readFile('/target2.txt', { encoding: 'text' })).toBe('Copy me');
	});

	test('should handle edge cases correctly', async () => {
		// Test root directory operations
		await expect(fs.stat('/')).resolves.toBeDefined();
		await expect(fs.readdir('/')).resolves.toBeDefined();
		await fs.mkdir('/'); // Should not throw

		// Test path normalization
		await fs.writeFile('/normalize.txt', 'test');
		expect(await fs.exists('/normalize.txt')).toBe(true);
		expect(await fs.exists('/./normalize.txt')).toBe(true);
		// Note: the exists method may return true for files with trailing slashes due to normalization

		// Test error cases
		await expect(fs.stat('/nonexistent')).rejects.toThrow('File not found');
		await expect(fs.readdir('/nonexistent')).rejects.toThrow('Directory not found');
		await expect(fs.readFile('/nonexistent')).rejects.toThrow('File not found');
		await expect(fs.rm('/nonexistent')).rejects.toThrow('File not found');
		await expect(fs.rename('/nonexistent', '/new')).rejects.toThrow('Source not found');
		await expect(fs.copy('/nonexistent', '/new')).rejects.toThrow('Source not found');
	});
});
