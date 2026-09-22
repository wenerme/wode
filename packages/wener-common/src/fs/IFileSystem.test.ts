import { describe, expect, test } from 'vitest';
import {
	type FileSystemWatcher,
	type IFileSystem,
	isReadableStreamFileSystem,
	isStreamableFileSystem,
	isWatchableFileSystem,
	isWritableStreamFileSystem,
} from './IFileSystem';
import { readStream, writeStream } from './stream';

describe('IFileSystem capabilities', () => {
	test('detects readable and writable stream capabilities independently', () => {
		const base = {} as IFileSystem;
		const readable = { ...base, createReadableStream: () => new ReadableStream() };
		const writable = {
			...readable,
			createReadableStream: undefined,
			createWritableStream: () => new WritableStream(),
		};
		const streamable = { ...readable, createWritableStream: () => new WritableStream() };

		expect(isReadableStreamFileSystem(readable)).toBe(true);
		expect(isWritableStreamFileSystem(readable)).toBe(false);
		expect(isStreamableFileSystem(readable)).toBe(false);
		expect(isReadableStreamFileSystem(writable)).toBe(false);
		expect(isWritableStreamFileSystem(writable)).toBe(true);
		expect(isStreamableFileSystem(writable)).toBe(false);
		expect(isStreamableFileSystem(streamable)).toBe(true);
	});

	test('detects watch capability independently', () => {
		const watcher: FileSystemWatcher = {
			async *[Symbol.asyncIterator]() {
				yield { type: 'change', path: '/file.txt' };
			},
			close: async () => undefined,
			[Symbol.asyncDispose]: async () => undefined,
		};

		expect(isWatchableFileSystem({})).toBe(false);
		expect(isWatchableFileSystem({ watch: () => watcher })).toBe(true);
	});

	test('provides stable ENOTSUP errors for unsupported stream capabilities', () => {
		const readable = new ReadableStream();
		const writable = new WritableStream();
		const streamable = {
			createReadableStream: () => readable,
			createWritableStream: () => writable,
		};

		expect(readStream(streamable, '/readable')).toBe(readable);
		expect(writeStream(streamable, '/writable')).toBe(writable);
		expect(() => readStream({}, '/readable')).toThrow(expect.objectContaining({ code: 'ENOTSUP' }));
		expect(() => writeStream({}, '/writable')).toThrow(expect.objectContaining({ code: 'ENOTSUP' }));
	});
});
