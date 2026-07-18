import type { IFileSystem } from '../IFileSystem';
import { JustBashCopyLimitError, JustBashFileAllocationLimitError } from './adapterLimits';
import type { JustBashVirtualFileSystem } from './virtualFileSystem';

export type JustBashPathLocation = 'backing' | 'synthetic' | 'virtual';

type ReadJustBashCopyFileOptions = {
	path: string;
	remainingBytes: number;
	maxReadBytes: number;
	maxCopyBytes: number;
	location: JustBashPathLocation;
	toBackingPath(path: string): string;
	fs: IFileSystem;
	virtualFs: JustBashVirtualFileSystem;
	signal?: AbortSignal;
	onBackingRead(): void;
	throwIfAborted(): void;
};

export async function readJustBashCopyFile(options: ReadJustBashCopyFileOptions): Promise<Uint8Array> {
	const { path, remainingBytes, maxReadBytes, maxCopyBytes } = options;
	options.throwIfAborted();
	if (options.location === 'synthetic') {
		throw new Error(`EISDIR: illegal operation on a directory, open '${path}'`);
	}
	if (options.location === 'virtual') {
		assertCopyFileSize(options.virtualFs.stat(path).size, remainingBytes, maxReadBytes, maxCopyBytes);
		const bytes = options.virtualFs.readFile(path);
		assertCopyFileSize(bytes.byteLength, remainingBytes, maxReadBytes, maxCopyBytes);
		return bytes;
	}

	const backingPath = options.toBackingPath(path);
	const stat = await options.fs.stat(backingPath, { signal: options.signal });
	options.throwIfAborted();
	if (stat.kind !== 'file') throw new Error(`EISDIR: illegal operation on a directory, open '${path}'`);
	assertCopyFileSize(stat.size, remainingBytes, maxReadBytes, maxCopyBytes);
	const bytes = await options.fs.readFile(backingPath, {
		encoding: 'binary',
		maxBytes: Math.min(maxReadBytes, remainingBytes) + 1,
		signal: options.signal,
	});
	options.throwIfAborted();
	assertCopyFileSize(bytes.byteLength, remainingBytes, maxReadBytes, maxCopyBytes);
	options.onBackingRead();
	return bytes;
}

function assertCopyFileSize(size: number, remainingBytes: number, maxReadBytes: number, maxCopyBytes: number): void {
	if (!Number.isSafeInteger(size) || size < 0 || size > maxReadBytes) {
		throw new JustBashFileAllocationLimitError('cp', maxReadBytes);
	}
	if (size > remainingBytes) throw new JustBashCopyLimitError('maxBytes', maxCopyBytes);
}
