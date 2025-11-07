import type { Readable, Writable } from 'node:stream';
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
type WritableData = string | Buffer | ArrayBuffer | Readable | ArrayBufferView;
/**
 * use IFileSystem to avoid conflict with global `FileSystem` interface
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
	/**
	 * optional, may not be implemented
	 *
	 * @deprecated use `createReadableStream` instead
	 */
	createReadStream?(path: string, options?: CreateReadStreamOptions): Readable;
	/**
	 * optional, may not be implemented
	 *
	 * @deprecated use `createWritableStream` instead
	 */
	createWriteStream?(path: string, options?: CreateWriteStreamOptions): Writable;

	getUrl?(path: IFileStat | string, options?: FileUrlOptions): string | undefined;

	// createUrl?(path: IFileStat, options?: FileUrlOptions): Promise<string | undefined>;

	/**
	 * optional, may not be implemented
	 */
	createReadableStream(path: string, options?: CreateReadStreamOptions): ReadableStream;
	/**
	 * optional, may not be implemented
	 */
	createWritableStream(path: string, options?: CreateWriteStreamOptions): WritableStream;
};

export type IFileStat = {
	/**
	 * parent path
	 *
	 * - redundant, but useful for some operations
	 */
	directory: string;
	/**
	 * full path
	 *
	 * - redundant, but useful for some operations
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
