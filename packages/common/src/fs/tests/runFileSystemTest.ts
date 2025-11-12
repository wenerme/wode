import { expect } from 'vitest';
import { FileSystemError, FileSystemErrorCode } from '../FileSystemError';
import type { IFileSystem } from '../IFileSystem';

export type RunFileSystemTestOptions = {
	writableStream?: boolean;
	readableStream?: boolean;
	readStream?: boolean;
	writeStream?: boolean;
	abort?: boolean;
};

export async function runFileSystemTest(fs: IFileSystem, options: RunFileSystemTestOptions = {}) {
	const { writableStream = true, readableStream = true, readStream = true, writeStream = true, abort = true } = options;
	// should be implemented
	const stat = await fs.stat('/README.txt');
	expect(stat).toMatchObject({
		path: '/README.txt',
		directory: '/',
		name: 'README.txt',
		kind: 'file',
		size: 5,
	});
	await fs.mkdir('/');
	const entries = await fs.readdir('/');
	expect(entries.some((e) => e.name === 'README.txt')).toBe(true);
	await fs.mkdir('/test');

	if (fs.getUrl) {
		expect(fs.getUrl(await fs.stat('/README.txt'))).toBeTypeOf('string');
	}

	// should handle AbortSignal
	if (abort) {
		const controller = new AbortController();
		controller.abort();

		await expect(fs.stat('/README.txt', { signal: controller.signal })).rejects.toThrow(Error);
		await expect(fs.readdir('/', { signal: controller.signal })).rejects.toThrow(Error);
		await expect(fs.mkdir('/test', { signal: controller.signal })).rejects.toThrow(Error);
		await expect(fs.readFile('/README.txt', { signal: controller.signal })).rejects.toThrow(Error);
		await expect(fs.writeFile('/test.txt', 'test', { signal: controller.signal })).rejects.toThrow(Error);
		await expect(fs.rm('/README.txt', { signal: controller.signal })).rejects.toThrow(Error);
		await expect(fs.rename('/README.txt', '/new.txt', { signal: controller.signal })).rejects.toThrow(Error);
		await expect(fs.copy('/README.txt', '/copy.txt', { signal: controller.signal })).rejects.toThrow(Error);
	}

	// should validate input parameters
	await expect(fs.stat('')).rejects.toThrow(FileSystemError);
	await expect(fs.stat('')).rejects.toMatchObject({ code: FileSystemErrorCode.EINVAL });
	await expect(fs.stat(null as any)).rejects.toThrow(FileSystemError);
	await expect(fs.stat(null as any)).rejects.toMatchObject({ code: FileSystemErrorCode.EINVAL });
	await expect(fs.stat(undefined as any)).rejects.toThrow(FileSystemError);
	await expect(fs.stat(undefined as any)).rejects.toMatchObject({ code: FileSystemErrorCode.EINVAL });
	await expect(fs.stat(123 as any)).rejects.toThrow(FileSystemError);
	await expect(fs.stat(123 as any)).rejects.toMatchObject({ code: FileSystemErrorCode.EINVAL });

	await expect(fs.writeFile('', 'test')).rejects.toThrow(FileSystemError);
	await expect(fs.writeFile('', 'test')).rejects.toMatchObject({ code: FileSystemErrorCode.EINVAL });
	await expect(fs.writeFile('/test', null as any)).rejects.toThrow(FileSystemError);
	await expect(fs.writeFile('/test', null as any)).rejects.toMatchObject({ code: FileSystemErrorCode.EINVAL });
	await expect(fs.writeFile('/test', undefined as any)).rejects.toThrow(FileSystemError);
	await expect(fs.writeFile('/test', undefined as any)).rejects.toMatchObject({ code: FileSystemErrorCode.EINVAL });
	await expect(fs.writeFile('/', 'test')).rejects.toThrow(FileSystemError);
	await expect(fs.writeFile('/', 'test')).rejects.toMatchObject({ code: FileSystemErrorCode.EINVAL });

	// should support streaming operations
	if (readStream && fs.createReadStream) {
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
	}

	if (writeStream && fs.createWriteStream) {
		// Test createWriteStream
		const writeStream = fs.createWriteStream('/write-test.txt');
		expect(writeStream).toBeDefined();

		writeStream.write('Test content');
		writeStream.end();

		await new Promise((resolve) => writeStream.on('finish', resolve));
		expect(await fs.readFile('/write-test.txt', { encoding: 'text' })).toBe('Test content');
	}

	// should support Web Streams API
	if (readableStream) {
		await fs.writeFile('/webstream.txt', 'Web Stream Test');

		// Test createReadableStream
		const readableStream = fs.createReadableStream('/webstream.txt');
		expect(readableStream).toBeDefined();

		const reader = readableStream.getReader();
		const { value } = await reader.read();
		expect(value?.toString()).toBe('Web Stream Test');
	}

	if (writableStream) {
		// Test createWritableStream
		const writableStream = fs.createWritableStream('/web-write-test.txt');
		expect(writableStream).toBeDefined();

		const writer = writableStream.getWriter();
		await writer.write(Buffer.from('Web Stream Write Test'));
		await writer.close();

		expect(await fs.readFile('/web-write-test.txt', { encoding: 'text' })).toBe('Web Stream Write Test');
	}

	// should handle streaming errors
	if (abort && readStream && fs.createReadStream) {
		const controller2 = new AbortController();

		// Test read stream with abort
		const readStream = fs.createReadStream('/README.txt', { signal: controller2.signal });
		controller2.abort();

		await expect(
			new Promise((_, reject) => {
				readStream.on('error', reject);
			}),
		).rejects.toThrow(Error);
	}

	if (abort && writeStream && fs.createWriteStream) {
		// Test write stream with abort
		const controller3 = new AbortController();
		const writeStream = fs.createWriteStream('/abort-test.txt', { signal: controller3.signal });
		controller3.abort();

		await expect(
			new Promise((_, reject) => {
				writeStream.on('error', reject);
				writeStream.write('test');
			}),
		).rejects.toThrow(Error);
	}

	// should handle file operations correctly
	// Test file creation
	await fs.writeFile('/newfile.txt', 'New content');
	expect(await fs.exists('/newfile.txt')).toBe(true);

	const stat2 = await fs.stat('/newfile.txt');
	expect(stat2.kind).toBe('file');
	expect(stat2.size).toBe(11); // "New content" is 11 bytes

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
	await expect(fs.writeFile('/newfile.txt', 'Should fail', { overwrite: false })).rejects.toThrow(FileSystemError);
	await expect(fs.writeFile('/newfile.txt', 'Should fail', { overwrite: false })).rejects.toMatchObject({
		code: FileSystemErrorCode.EEXIST,
	});

	// Test large file write (should use file_node_content table)
	// Create ~1KB data to test large file handling
	const largeData = 'x'.repeat(1024); // 1KB of data
	await fs.writeFile('/largefile.txt', largeData);
	const largeFileStat = await fs.stat('/largefile.txt');
	expect(largeFileStat.size).toBe(1024);
	const largeFileContent = await fs.readFile('/largefile.txt', { encoding: 'text' });
	expect(largeFileContent).toBe(largeData);
	expect(largeFileContent.length).toBe(1024);

	// should handle directory operations correctly
	// Test directory creation
	await fs.mkdir('/newdir');
	expect(await fs.exists('/newdir')).toBe(true);

	const stat3 = await fs.stat('/newdir');
	expect(stat3.kind).toBe('directory');

	// Test recursive directory creation
	await fs.mkdir('/deep/nested/dir', { recursive: true });
	expect(await fs.exists('/deep/nested/dir')).toBe(true);

	// Test non-recursive directory creation failure
	await expect(fs.mkdir('/another/deep/dir')).rejects.toThrow(FileSystemError);
	await expect(fs.mkdir('/another/deep/dir')).rejects.toMatchObject({ code: FileSystemErrorCode.ENOENT });

	// Test directory listing
	await fs.writeFile('/newdir/file1.txt', 'File 1');
	await fs.writeFile('/newdir/file2.txt', 'File 2');

	const contents = await fs.readdir('/newdir');
	expect(contents).toHaveLength(2);
	expect(contents.map((f) => f.name)).toContain('file1.txt');
	expect(contents.map((f) => f.name)).toContain('file2.txt');

	// should handle file removal correctly
	await fs.writeFile('/toremove.txt', 'Remove me');
	expect(await fs.exists('/toremove.txt')).toBe(true);

	await fs.rm('/toremove.txt');
	expect(await fs.exists('/toremove.txt')).toBe(false);

	// Test force removal
	await expect(fs.rm('/nonexistent.txt')).rejects.toThrow(FileSystemError);
	await expect(fs.rm('/nonexistent.txt')).rejects.toMatchObject({ code: FileSystemErrorCode.ENOENT });
	await fs.rm('/nonexistent.txt', { force: true }); // Should not throw

	// Test recursive removal
	await fs.mkdir('/dirwithfiles', { recursive: true });
	await fs.writeFile('/dirwithfiles/file.txt', 'content');
	await expect(fs.rm('/dirwithfiles')).rejects.toThrow(FileSystemError);
	await expect(fs.rm('/dirwithfiles')).rejects.toMatchObject({ code: FileSystemErrorCode.ENOTEMPTY });
	await fs.rm('/dirwithfiles', { recursive: true });
	expect(await fs.exists('/dirwithfiles')).toBe(false);

	// should handle file rename correctly
	await fs.writeFile('/rename.txt', 'Original content');
	expect(await fs.exists('/rename.txt')).toBe(true);

	await fs.rename('/rename.txt', '/renamed.txt');
	expect(await fs.exists('/rename.txt')).toBe(false);
	expect(await fs.exists('/renamed.txt')).toBe(true);
	expect(await fs.readFile('/renamed.txt', { encoding: 'text' })).toBe('Original content');

	// should handle file copy correctly
	await fs.writeFile('/copy.txt', 'Copy me');
	expect(await fs.exists('/copy.txt')).toBe(true);

	await fs.copy('/copy.txt', '/copied.txt');
	expect(await fs.exists('/copy.txt')).toBe(true);
	expect(await fs.exists('/copied.txt')).toBe(true);
	expect(await fs.readFile('/copied.txt', { encoding: 'text' })).toBe('Copy me');

	// Test copy overwrite
	await fs.writeFile('/target2.txt', 'Target content');
	await expect(fs.copy('/copy.txt', '/target2.txt')).rejects.toThrow(FileSystemError);
	await expect(fs.copy('/copy.txt', '/target2.txt')).rejects.toMatchObject({ code: FileSystemErrorCode.EEXIST });
	await fs.copy('/copy.txt', '/target2.txt', { overwrite: true });
	expect(await fs.readFile('/target2.txt', { encoding: 'text' })).toBe('Copy me');

	// should handle edge cases correctly
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
	await expect(fs.stat('/nonexistent')).rejects.toThrow(FileSystemError);
	await expect(fs.stat('/nonexistent')).rejects.toMatchObject({ code: FileSystemErrorCode.ENOENT });
	await expect(fs.readdir('/nonexistent')).rejects.toThrow(FileSystemError);
	await expect(fs.readdir('/nonexistent')).rejects.toMatchObject({ code: FileSystemErrorCode.ENOENT });
	await expect(fs.readFile('/nonexistent')).rejects.toThrow(FileSystemError);
	await expect(fs.readFile('/nonexistent')).rejects.toMatchObject({ code: FileSystemErrorCode.ENOENT });
	await expect(fs.rm('/nonexistent')).rejects.toThrow(FileSystemError);
	await expect(fs.rm('/nonexistent')).rejects.toMatchObject({ code: FileSystemErrorCode.ENOENT });
	await expect(fs.rename('/nonexistent', '/new')).rejects.toThrow(FileSystemError);
	await expect(fs.rename('/nonexistent', '/new')).rejects.toMatchObject({ code: FileSystemErrorCode.ENOENT });
	await expect(fs.copy('/nonexistent', '/new')).rejects.toThrow(FileSystemError);
	await expect(fs.copy('/nonexistent', '/new')).rejects.toMatchObject({ code: FileSystemErrorCode.ENOENT });
}
