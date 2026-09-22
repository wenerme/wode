import type { FileKind, FileUrlOptions } from './types';

/** Options shared by every filesystem operation. */
export type FileSystemOperationOptions = {
	signal?: AbortSignal;
};

export type ReaddirOptions = FileSystemOperationOptions & {
	glob?: string;
	recursive?: boolean;
	depth?: number;
	kind?: FileKind;
	hidden?: boolean;
	/** Reject before allocating a result that would exceed this entry count. */
	maxEntries?: number;
};

export type MkdirOptions = FileSystemOperationOptions & {
	recursive?: boolean;
};

export type ReadFileOptions = FileSystemOperationOptions & {
	encoding?: 'text' | 'binary';
	/** Read at most this many bytes. */
	maxBytes?: number;
	onDownloadProgress?: (event: { loaded: number; total: number }) => void;
};

export type WriteFileOptions = FileSystemOperationOptions & {
	overwrite?: boolean;
	onUploadProgress?: (event: { loaded: number; total: number }) => void;
};

export type RenameOptions = FileSystemOperationOptions & {
	overwrite?: boolean;
};

export type RmOptions = FileSystemOperationOptions & {
	recursive?: boolean;
	force?: boolean;
};

export type CopyOptions = FileSystemOperationOptions & {
	overwrite?: boolean;
	shallow?: boolean;
};

export type CreateReadStreamOptions = FileSystemOperationOptions & {
	range?: { start: number; end?: number };
};

export type CreateWriteStreamOptions = FileSystemOperationOptions & {
	overwrite?: boolean;
};

export type StatOptions = FileSystemOperationOptions;

export type FileSystemWritableData = string | ArrayBuffer | ArrayBufferView<ArrayBufferLike> | ReadableStream;

/** Backwards-compatible name used by existing adapters. */
export type WritableData = FileSystemWritableData;

export type FileSystemWatchOptions = FileSystemOperationOptions & {
	recursive?: boolean;
};

export type FileSystemWatchEvent = {
	type: 'rename' | 'change';
	path: string;
};

/** A watcher must make close and asyncDispose idempotent. */
export interface FileSystemWatcher extends AsyncDisposable, AsyncIterable<FileSystemWatchEvent> {
	close(): Promise<void>;
}

/**
 * Browser and server compatible asynchronous filesystem protocol.
 * Implementations expose logical POSIX paths and must keep operations within their configured root.
 */
export type IFileSystem = {
	readdir(path: string, options?: ReaddirOptions): Promise<IFileStat[]>;
	stat(path: string, options?: StatOptions): Promise<IFileStat>;
	mkdir(path: string, options?: MkdirOptions): Promise<void>;
	readFile(path: string, options: ReadFileOptions & { encoding: 'text' }): Promise<string>;
	readFile(path: string, options?: ReadFileOptions): Promise<Uint8Array>;
	writeFile(path: string, data: FileSystemWritableData, options?: WriteFileOptions): Promise<void>;
	rm(path: string, options?: RmOptions): Promise<void>;
	rename(oldPath: string, newPath: string, options?: RenameOptions): Promise<void>;
	exists(path: string, options?: FileSystemOperationOptions): Promise<boolean>;
	copy(source: string, destination: string, options?: CopyOptions): Promise<void>;

	getUrl?(path: IFileStat | string, options?: FileUrlOptions): string | undefined;
	createReadableStream?(path: string, options?: CreateReadStreamOptions): ReadableStream;
	createWritableStream?(path: string, options?: CreateWriteStreamOptions): WritableStream;
};

/** Filesystems that support Web ReadableStream reads. */
export interface IReadableStreamFileSystem extends IFileSystem {
	createReadableStream(path: string, options?: CreateReadStreamOptions): ReadableStream;
}

/** Filesystems that support Web WritableStream writes. */
export interface IWritableStreamFileSystem extends IFileSystem {
	createWritableStream(path: string, options?: CreateWriteStreamOptions): WritableStream;
}

export type IStreamableFileSystem = IFileSystem & {
	createReadableStream(path: string, options?: CreateReadStreamOptions): ReadableStream;
	createWritableStream(path: string, options?: CreateWriteStreamOptions): WritableStream;
};

export type IWatchableFileSystem = IFileSystem & {
	watch(path: string, options?: FileSystemWatchOptions): FileSystemWatcher;
};

export function isReadableStreamFileSystem(value: unknown): value is IReadableStreamFileSystem {
	return (
		isObjectLike(value) && typeof (value as Partial<IReadableStreamFileSystem>).createReadableStream === 'function'
	);
}

export function isWritableStreamFileSystem(value: unknown): value is IWritableStreamFileSystem {
	return (
		isObjectLike(value) && typeof (value as Partial<IWritableStreamFileSystem>).createWritableStream === 'function'
	);
}

export function isStreamableFileSystem(value: unknown): value is IStreamableFileSystem {
	return isReadableStreamFileSystem(value) && isWritableStreamFileSystem(value);
}

export function isWatchableFileSystem(value: unknown): value is IWatchableFileSystem {
	return isObjectLike(value) && typeof (value as Partial<IWatchableFileSystem>).watch === 'function';
}

function isObjectLike(value: unknown): value is object {
	return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

export type IFileStat = {
	/** Parent path. */
	directory: string;
	/** Full logical path. */
	path: string;
	/** Basename. */
	name: string;
	kind: FileKind;
	/** Unix epoch milliseconds. */
	mtime: number;
	meta: Record<string, unknown>;
	size: number;
};
