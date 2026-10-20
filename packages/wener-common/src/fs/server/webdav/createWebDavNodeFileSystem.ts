import { Buffer } from 'node:buffer';
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { type MaybeFunction, maybeFunction } from '@wener/utils';
import type { WebDAVClient } from 'webdav';
import { createWebDavFileSystem } from '../../createWebDavFileSystem';
import type { FileSystemWritableData, WriteFileOptions } from '../../IFileSystem';
import type { IServerFileSystem } from '../IFileSystem';
import { createWebDavReadStream, createWebDavWriteStream } from './createNodeStreams';

export function createWebDavNodeFileSystem({ client }: { client: MaybeFunction<WebDAVClient> }): IServerFileSystem {
	const fs = createWebDavFileSystem({ client });
	return Object.assign(fs, {
		createReadStream: (path: string, options = {}) => createWebDavReadStream(maybeFunction(client), path, options),
		createWriteStream: (path: string, options = {}) => createWebDavWriteStream(maybeFunction(client), path, options),
		createReadableStream: (path: string, options = {}) =>
			Readable.toWeb(createWebDavReadStream(maybeFunction(client), path, options)),
		createWritableStream: (path: string, options = {}) =>
			Writable.toWeb(createWebDavWriteStream(maybeFunction(client), path, options)),
		async writeFile(path: string, data: FileSystemWritableData | Readable, options: WriteFileOptions = {}) {
			const source =
				data instanceof Readable || data instanceof ReadableStream
					? data
					: Readable.from([
							ArrayBuffer.isView(data)
								? Buffer.from(data.buffer, data.byteOffset, data.byteLength)
								: typeof data === 'string'
									? Buffer.from(data)
									: Buffer.from(data),
						]);
			await pipeline(source, createWebDavWriteStream(maybeFunction(client), path, options), { signal: options.signal });
		},
	});
}
