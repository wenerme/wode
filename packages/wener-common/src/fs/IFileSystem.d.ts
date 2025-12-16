import type { FileKind, FileUrlOptions } from './types';

// Base operation options
type OperationOptions = {
	signal?: AbortSignal;
};

// Directory operations
export type ReaddirOptions = OperationOptions & {
	glob?: string;
	recursive?: boolean;
	depth?: number;
	kind?: FileKind;
	hidden?: boolean;
};
export type MkdirOptions = OperationOptions & {
	recursive?: boolean;
};
// File operations
export type ReadFileOptions = OperationOptions & {
	encoding?: 'text' | 'binary';
	onDownloadProgress?: (e: { loaded: number; total: number }) => void;
};
export type WriteFileOptions = OperationOptions & {
	overwrite?: boolean;
	onUploadProgress?: (e: { loaded: number; total: number }) => void;
};
export type RenameOptions = OperationOptions & {
	overwrite?: boolean;
};
export type RmOptions = OperationOptions & {
	recursive?: boolean;
	force?: boolean;
};
export type CopyOptions = OperationOptions & {
	overwrite?: boolean;
	shallow?: boolean;
};
export type CreateReadStreamOptions = OperationOptions & {
	range?: { start: number; end?: number };
	signal?: AbortSignal;
};
export type CreateWriteStreamOptions = OperationOptions & {
	overwrite?: boolean;
};
export type StatOptions = OperationOptions & {};

type WritableData = string | ArrayBuffer | ArrayBufferView | ReadableStream;

/**
 * Universal file system interface (browser & server compatible)
 */
export type IFileSystem = {
	readdir(dir: string, options?: ReaddirOptions): Promise<IFileStat[]>;
	stat(entry: string, options?: StatOptions): Promise<IFileStat>;
	mkdir(path: string, options?: MkdirOptions): Promise<void>;
	readFile(path: string, options?: ReadFileOptions & { encoding: 'text' }): Promise<string>;
	readFile(path: string, options?: ReadFileOptions): Promise<Uint8Array>;
	writeFile(path: string, data: WritableData, options?: WriteFileOptions): Promise<void>;
	rm(path: string, options?: RmOptions): Promise<void>;
	rename(oldPath: string, newPath: string, options?: RenameOptions): Promise<void>;
	exists(path: string): Promise<boolean>;
	copy(src: string, dest: string, options?: CopyOptions): Promise<void>;

	getUrl?(path: IFileStat | string, options?: FileUrlOptions): string | undefined;

	createReadableStream?(path: string, options?: CreateReadStreamOptions): ReadableStream;
	createWritableStream?(path: string, options?: CreateWriteStreamOptions): WritableStream;
};

/**
 * Server/Node.js specific file system interface with stream support
 */
export type IServerFileSystem = IFileSystem & {
	createReadStream(path: string, options?: CreateReadStreamOptions): import('node:stream').Readable;
	createWriteStream(path: string, options?: CreateWriteStreamOptions): import('node:stream').Writable;
	writeFile(
		path: string,
		data: WritableData | Buffer | import('node:stream').Readable,
		options?: WriteFileOptions,
	): Promise<void>;
};

export type IFileStat = {
	/**
	 * parent path
	 */
	directory: string;
	/**
	 * full path
	 */
	path: string;
	/**
	 * basename
	 */
	name: string;
	kind: 'directory' | 'file';
	mtime: number;
	meta: Record<string, any>;
	size: number;
};

