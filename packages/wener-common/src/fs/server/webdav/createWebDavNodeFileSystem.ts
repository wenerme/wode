import { Readable, Writable } from 'node:stream';
import { type CreateWebDavFileSystemOptions, createWebDavFileSystem } from '../../createWebDavFileSystem';
import type {
	CreateReadStreamOptions,
	CreateWriteStreamOptions,
	FileSystemWritableData,
	IStreamableFileSystem,
	WriteFileOptions,
} from '../../IFileSystem';
import type { IServerFileSystem } from '../IFileSystem';

/** Node stream adapters over the fetch-based WebDAV filesystem. */
export function createWebDavNodeFileSystem(options: CreateWebDavFileSystemOptions): IServerFileSystem {
	const fs = createWebDavFileSystem(options) as IStreamableFileSystem;
	const writeFile = fs.writeFile.bind(fs);
	return Object.assign(fs, {
		createReadStream: (path: string, opts: CreateReadStreamOptions = {}) =>
			Readable.fromWeb(fs.createReadableStream(path, opts) as never, { signal: opts.signal }),
		createWriteStream(path: string, opts: CreateWriteStreamOptions = {}) {
			// Writable.fromWeb closes (commits) the upload on a plain destroy(); abort it instead.
			const writer = fs.createWritableStream(path, opts).getWriter();
			let finished = false;
			return new Writable({
				signal: opts.signal,
				write(chunk: Uint8Array, _encoding, callback) {
					writer.write(chunk).then(() => callback(), callback);
				},
				final(callback) {
					writer.close().then(() => {
						finished = true;
						callback();
					}, callback);
				},
				destroy(error, callback) {
					if (!finished) writer.abort(error ?? new Error('Write stream destroyed')).catch(() => undefined);
					callback(error);
				},
			});
		},
		async writeFile(path: string, data: FileSystemWritableData | Readable, opts: WriteFileOptions = {}) {
			const body = data instanceof Readable ? (Readable.toWeb(data) as unknown as ReadableStream) : data;
			await writeFile(path, body, opts);
		},
	});
}
