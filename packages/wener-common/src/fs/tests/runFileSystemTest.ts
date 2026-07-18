import { expect } from 'vite-plus/test';
import { FileSystemError, FileSystemErrorCode } from '../FileSystemError';
import type { IFileSystem, IServerFileSystem } from '../IFileSystem';

export type RunFileSystemTestOptions = {
	writableStream?: boolean;
	readableStream?: boolean;
	readStream?: boolean;
	writeStream?: boolean;
	abort?: boolean;
};

export async function runFileSystemTest(fs: IFileSystem | IServerFileSystem, options: RunFileSystemTestOptions = {}) {
	await runFileSystemTestBasic(fs);
	await runFileSystemTestAbort(fs, options);
	await runFileSystemTestValidation(fs);
	await runFileSystemTestStreams(fs, options);
	await runFileSystemTestFileOperations(fs);
	await runFileSystemTestDirectoryOperations(fs);
	await runFileSystemTestRemoveOperations(fs);
	await runFileSystemTestRenameOperations(fs);
	await runFileSystemTestCopyOperations(fs);
	await runFileSystemTestEdgeCases(fs);
}

export async function runFileSystemTestBasic(fs: IFileSystem | IServerFileSystem) {
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
}

export async function runFileSystemTestAbort(
	fs: IFileSystem | IServerFileSystem,
	options: RunFileSystemTestOptions = {},
) {
	const { abort = true } = options;
	if (!abort) {
		return;
	}

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

export async function runFileSystemTestValidation(fs: IFileSystem | IServerFileSystem) {
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
}

export async function runFileSystemTestStreams(
	fs: IFileSystem | IServerFileSystem,
	options: RunFileSystemTestOptions = {},
) {
	await runFileSystemTestNodeReadStream(fs, options);
	await runFileSystemTestNodeWriteStream(fs, options);
	await runFileSystemTestWebReadableStream(fs, options);
	await runFileSystemTestWebWritableStream(fs, options);
	await runFileSystemTestStreamAbort(fs, options);
}

export async function runFileSystemTestNodeReadStream(
	fs: IFileSystem | IServerFileSystem,
	options: RunFileSystemTestOptions = {},
) {
	const { readStream = true } = options;
	if (!readStream || !('createReadStream' in fs)) {
		return;
	}

	const serverFs = fs as IServerFileSystem;
	await fs.writeFile('/stream.txt', 'Hello, World!');

	const readStreamObj = serverFs.createReadStream('/stream.txt');
	expect(readStreamObj).toBeDefined();

	const chunks: Buffer[] = [];
	for await (const chunk of readStreamObj) {
		chunks.push(chunk);
	}
	expect(Buffer.concat(chunks).toString()).toBe('Hello, World!');

	const rangeStream = serverFs.createReadStream('/stream.txt', { range: { start: 0, end: 4 } });
	const rangeChunks: Buffer[] = [];
	for await (const chunk of rangeStream) {
		rangeChunks.push(chunk);
	}
	expect(Buffer.concat(rangeChunks).toString()).toBe('Hello');
}

export async function runFileSystemTestNodeWriteStream(
	fs: IFileSystem | IServerFileSystem,
	options: RunFileSystemTestOptions = {},
) {
	const { writeStream = true } = options;
	if (!writeStream || !('createWriteStream' in fs)) {
		return;
	}

	const serverFs = fs as IServerFileSystem;
	const writeStreamObj = serverFs.createWriteStream('/write-test.txt');
	expect(writeStreamObj).toBeDefined();

	writeStreamObj.write('Test content');
	writeStreamObj.end();

	await new Promise((resolve) => writeStreamObj.on('finish', resolve));
	expect(await fs.readFile('/write-test.txt', { encoding: 'text' })).toBe('Test content');
}

export async function runFileSystemTestWebReadableStream(
	fs: IFileSystem | IServerFileSystem,
	options: RunFileSystemTestOptions = {},
) {
	const { readableStream = true } = options;
	if (!readableStream || !fs.createReadableStream) {
		return;
	}

	await fs.writeFile('/webstream.txt', 'Web Stream Test');

	const readableStreamObj = fs.createReadableStream('/webstream.txt');
	expect(readableStreamObj).toBeDefined();

	const reader = readableStreamObj.getReader();
	const { value } = await reader.read();
	expect(new TextDecoder().decode(value as Uint8Array)).toBe('Web Stream Test');
}

export async function runFileSystemTestWebWritableStream(
	fs: IFileSystem | IServerFileSystem,
	options: RunFileSystemTestOptions = {},
) {
	const { writableStream = true } = options;
	if (!writableStream || !fs.createWritableStream) {
		return;
	}

	const writableStreamObj = fs.createWritableStream('/web-write-test.txt');
	expect(writableStreamObj).toBeDefined();

	const writer = writableStreamObj.getWriter();
	await writer.write(new TextEncoder().encode('Web Stream Write Test'));
	await writer.close();

	expect(await fs.readFile('/web-write-test.txt', { encoding: 'text' })).toBe('Web Stream Write Test');
}

export async function runFileSystemTestStreamAbort(
	fs: IFileSystem | IServerFileSystem,
	options: RunFileSystemTestOptions = {},
) {
	const { abort = true, readStream = true, writeStream = true } = options;
	if (!abort) {
		return;
	}

	const serverFs = fs as IServerFileSystem;
	if (readStream && 'createReadStream' in fs) {
		const controller = new AbortController();
		const readStreamObj = serverFs.createReadStream('/README.txt', { signal: controller.signal });
		controller.abort();

		await expect(
			new Promise((_, reject) => {
				readStreamObj.on('error', reject);
			}),
		).rejects.toThrow(Error);
	}

	if (writeStream && 'createWriteStream' in fs) {
		const controller = new AbortController();
		const writeStreamObj = serverFs.createWriteStream('/abort-test.txt', { signal: controller.signal });
		controller.abort();

		await expect(
			new Promise((_, reject) => {
				writeStreamObj.on('error', reject);
				writeStreamObj.write('test');
			}),
		).rejects.toThrow(Error);
	}
}

export async function runFileSystemTestFileOperations(fs: IFileSystem | IServerFileSystem) {
	await fs.writeFile('/newfile.txt', 'New content');
	expect(await fs.exists('/newfile.txt')).toBe(true);

	const stat = await fs.stat('/newfile.txt');
	expect(stat.kind).toBe('file');
	expect(stat.size).toBe(11);

	expect(await fs.readFile('/newfile.txt', { encoding: 'text' })).toBe('New content');

	const binary = await fs.readFile('/newfile.txt');
	expect(Buffer.from(binary).toString()).toBe('New content');

	await fs.writeFile('/newfile.txt', 'Updated content');
	expect(await fs.readFile('/newfile.txt', { encoding: 'text' })).toBe('Updated content');

	await expect(fs.writeFile('/newfile.txt', 'Should fail', { overwrite: false })).rejects.toThrow(FileSystemError);
	await expect(fs.writeFile('/newfile.txt', 'Should fail', { overwrite: false })).rejects.toMatchObject({
		code: FileSystemErrorCode.EEXIST,
	});

	const largeData = 'x'.repeat(1024);
	await fs.writeFile('/largefile.txt', largeData);
	const largeFileStat = await fs.stat('/largefile.txt');
	expect(largeFileStat.size).toBe(1024);
	const largeFileContent = await fs.readFile('/largefile.txt', { encoding: 'text' });
	expect(largeFileContent).toBe(largeData);
	expect(largeFileContent.length).toBe(1024);
}

export async function runFileSystemTestDirectoryOperations(fs: IFileSystem | IServerFileSystem) {
	await fs.mkdir('/newdir');
	expect(await fs.exists('/newdir')).toBe(true);

	const stat = await fs.stat('/newdir');
	expect(stat.kind).toBe('directory');

	await fs.mkdir('/deep/nested/dir', { recursive: true });
	expect(await fs.exists('/deep/nested/dir')).toBe(true);

	await expect(fs.mkdir('/another/deep/dir')).rejects.toThrow(FileSystemError);
	await expect(fs.mkdir('/another/deep/dir')).rejects.toMatchObject({ code: FileSystemErrorCode.ENOENT });

	await fs.writeFile('/newdir/file1.txt', 'File 1');
	await fs.writeFile('/newdir/file2.txt', 'File 2');

	const contents = await fs.readdir('/newdir');
	expect(contents).toHaveLength(2);
	expect(contents.map((f) => f.name)).toContain('file1.txt');
	expect(contents.map((f) => f.name)).toContain('file2.txt');
}

export async function runFileSystemTestRemoveOperations(fs: IFileSystem | IServerFileSystem) {
	await fs.writeFile('/toremove.txt', 'Remove me');
	expect(await fs.exists('/toremove.txt')).toBe(true);

	await fs.rm('/toremove.txt');
	expect(await fs.exists('/toremove.txt')).toBe(false);

	await expect(fs.rm('/nonexistent.txt')).rejects.toThrow(FileSystemError);
	await expect(fs.rm('/nonexistent.txt')).rejects.toMatchObject({ code: FileSystemErrorCode.ENOENT });
	await fs.rm('/nonexistent.txt', { force: true });

	await fs.mkdir('/dirwithfiles', { recursive: true });
	await fs.writeFile('/dirwithfiles/file.txt', 'content');
	await expect(fs.rm('/dirwithfiles')).rejects.toThrow(FileSystemError);
	await expect(fs.rm('/dirwithfiles')).rejects.toMatchObject({ code: FileSystemErrorCode.ENOTEMPTY });
	await fs.rm('/dirwithfiles', { recursive: true });
	expect(await fs.exists('/dirwithfiles')).toBe(false);
}

export async function runFileSystemTestRenameOperations(fs: IFileSystem | IServerFileSystem) {
	await fs.writeFile('/rename.txt', 'Original content');
	expect(await fs.exists('/rename.txt')).toBe(true);

	await fs.rename('/rename.txt', '/renamed.txt');
	expect(await fs.exists('/rename.txt')).toBe(false);
	expect(await fs.exists('/renamed.txt')).toBe(true);
	expect(await fs.readFile('/renamed.txt', { encoding: 'text' })).toBe('Original content');
}

export async function runFileSystemTestCopyOperations(fs: IFileSystem | IServerFileSystem) {
	await fs.writeFile('/copy.txt', 'Copy me');
	expect(await fs.exists('/copy.txt')).toBe(true);

	await fs.copy('/copy.txt', '/copied.txt');
	expect(await fs.exists('/copy.txt')).toBe(true);
	expect(await fs.exists('/copied.txt')).toBe(true);
	expect(await fs.readFile('/copied.txt', { encoding: 'text' })).toBe('Copy me');

	await fs.writeFile('/target2.txt', 'Target content');
	await expect(fs.copy('/copy.txt', '/target2.txt')).rejects.toThrow(FileSystemError);
	await expect(fs.copy('/copy.txt', '/target2.txt')).rejects.toMatchObject({ code: FileSystemErrorCode.EEXIST });

	await fs.copy('/copy.txt', '/target2.txt', { overwrite: true });
	expect(await fs.readFile('/target2.txt', { encoding: 'text' })).toBe('Copy me');
}

export async function runFileSystemTestEdgeCases(fs: IFileSystem | IServerFileSystem) {
	await expect(fs.stat('/')).resolves.toBeDefined();
	await expect(fs.readdir('/')).resolves.toBeDefined();
	await fs.mkdir('/');

	await fs.writeFile('/normalize.txt', 'test');
	expect(await fs.exists('/normalize.txt')).toBe(true);
	expect(await fs.exists('/./normalize.txt')).toBe(true);

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
