import { FileSystemError } from './FileSystemError';
import {
	type CreateReadStreamOptions,
	type CreateWriteStreamOptions,
	isReadableStreamFileSystem,
	isWritableStreamFileSystem,
} from './IFileSystem';

/** Get a readable stream or return a stable ENOTSUP error when the backend lacks the capability. */
export function readStream(value: unknown, path: string, options?: CreateReadStreamOptions): ReadableStream {
	if (!isReadableStreamFileSystem(value)) throw new FileSystemError('文件系统不支持流式读取', 'ENOTSUP');
	return value.createReadableStream(path, options);
}

/** Get a writable stream or return a stable ENOTSUP error when the backend lacks the capability. */
export function writeStream(value: unknown, path: string, options?: CreateWriteStreamOptions): WritableStream {
	if (!isWritableStreamFileSystem(value)) throw new FileSystemError('文件系统不支持流式写入', 'ENOTSUP');
	return value.createWritableStream(path, options);
}
