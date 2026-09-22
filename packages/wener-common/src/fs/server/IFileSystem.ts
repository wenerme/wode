import type { Buffer } from 'node:buffer';
import type { Readable, Writable } from 'node:stream';
import type {
	CreateReadStreamOptions,
	CreateWriteStreamOptions,
	FileSystemWritableData,
	IFileSystem,
	WriteFileOptions,
} from '../IFileSystem';

/** Node-only extension of the browser-safe filesystem protocol. */
export type IServerFileSystem = IFileSystem & {
	createReadStream(path: string, options?: CreateReadStreamOptions): Readable;
	createWriteStream(path: string, options?: CreateWriteStreamOptions): Writable;
	writeFile(path: string, data: FileSystemWritableData | Buffer | Readable, options?: WriteFileOptions): Promise<void>;
};
