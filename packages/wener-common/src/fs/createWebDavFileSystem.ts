import type { Readable, Writable } from 'node:stream';
import { maybeFunction, type MaybeFunction } from '@wener/utils';
import type { FileStat, GetDirectoryContentsOptions, ResponseDataDetailed, WebDAVClient } from 'webdav';
import type {
	IFileStat,
	IFileSystem,
	MkdirOptions,
	ReaddirOptions,
	ReadFileOptions,
	RmOptions,
	StatOptions,
	WritableData,
	WriteFileOptions,
} from './IFileSystem';

export function createWebDavFileSystem({ client }: { client: MaybeFunction<WebDAVClient> }): IFileSystem {
	let fs = new WebdavFS({ client });
	return fs;
}

class WebdavFS implements IFileSystem {
	_client: MaybeFunction<WebDAVClient>;

	constructor({
		client = () => {
			throw new Error('WebdavFS client not initialized');
		},
	}: {
		client?: MaybeFunction<WebDAVClient>;
	}) {
		this._client = client;
	}

	set client(client: MaybeFunction<WebDAVClient>) {
		this._client = client;
	}

	get client(): WebDAVClient {
		return maybeFunction(this._client);
	}

	private toEntry(input: FileStat): IFileStat {
		const { filename: path, basename, lastmod, type: kind, etag, size, mime } = input;
		let meta: Record<string, any> = {};
		if (etag) {
			meta.etag = etag;
		}
		if (mime) {
			meta.mime = mime;
		}
		return {
			directory: path.substring(0, path.lastIndexOf('/')) || '/',
			path,
			name: basename,
			mtime: +new Date(lastmod),
			kind,
			meta,
			size,
		};
	}

	private getData<T>(input: ResponseDataDetailed<T> | T): T {
		if (
			input &&
			typeof input === 'object' &&
			'data' in input &&
			// 'headers' in input &&
			'status' in input &&
			typeof input.status === 'number'
		) {
			return input.data;
		}
		return input as T;
	}

	async readdir(
		path: string,
		{ glob, recursive, depth, kind, hidden, signal }: ReaddirOptions = {},
	): Promise<IFileStat[]> {
		// webdav depth 只支持 0,1
		let o: GetDirectoryContentsOptions = {};
		if (recursive) {
			o.deep = true;
		}
		let res = await this.client.getDirectoryContents(path, {
			deep: recursive,
			signal,
		});

		let out: FileStat[] = this.getData(res);

		if (!recursive && typeof depth === 'number' && depth >= 2) {
			let l = depth;
			let cur = out;
			while (l-- > 1) {
				let sub = (
					await Promise.all(
						cur.map(async (v) => {
							if (v.type === 'directory') {
								return this.getData(await this.client.getDirectoryContents(v.filename, { signal }));
							}
							return [];
						}),
					)
				).flat();
				out = out.concat(...sub);
				cur = sub;
			}
		}

		if (glob) {
			const { default: def, matcher = def.matcher } = await import('micromatch');
			const match = matcher(glob);
			out = out.filter((v) => match(v.filename));
		}
		if (kind) {
			out = out.filter((v) => v.type === kind);
		}
		if (!hidden) {
			out = out.filter((v) => !v.basename.startsWith('.'));
		}
		return out.map((stat) => this.toEntry(stat));
	}

	async stat(path: string, { signal }: StatOptions = {}): Promise<IFileStat> {
		const res = await this.client.stat(path, { details: true, signal });
		return this.toEntry(this.getData(res));
	}

	async mkdir(path: string, { recursive, signal }: MkdirOptions = {}): Promise<void> {
		await this.client.createDirectory(path, { recursive, signal });
	}

	async readFile(path: string, options: ReadFileOptions = {}): Promise<any> {
		const format = options.encoding === 'text' ? 'text' : 'binary';
		const res = await this.client.getFileContents(path, { format, ...options });
		return this.getData(res);
	}

	async writeFile(path: string, data: WritableData, options: WriteFileOptions = {}): Promise<void> {
		// Convert web ReadableStream to something WebDAV client can handle
		let webdavData: string | Buffer | ArrayBuffer | Readable = data as string | Buffer | ArrayBuffer | Readable;
		if (data instanceof ReadableStream) {
			// Convert web ReadableStream to Buffer
			const reader = data.getReader();
			const chunks: Uint8Array[] = [];
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				if (value) chunks.push(value);
			}
			webdavData = Buffer.concat(chunks);
		} else if (ArrayBuffer.isView(data) && !(data instanceof Buffer)) {
			// Convert ArrayBufferView to Buffer
			webdavData = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
		}
		await this.client.putFileContents(path, webdavData, options);
	}

	async rm(path: string, { signal: _signal, force, recursive: _recursive }: RmOptions = {}): Promise<void> {
		try {
			await this.client.deleteFile(path);
		} catch (e: any) {
			if (force && e.status === 404) {
				return;
			}
			throw e;
		}
	}

	async rename(oldPath: string, newPath: string, options = {}): Promise<void> {
		await this.client.moveFile(oldPath, newPath, options);
	}

	async exists(path: string): Promise<boolean> {
		return await this.client.exists(path);
	}

	async copy(src: string, dest: string, options = {}): Promise<void> {
		await this.client.copyFile(src, dest, options);
	}

	createReadStream(path: string, options = {}): Readable {
		return this.client.createReadStream(path, options);
	}

	createWriteStream(path: string, options = {}): Writable {
		return this.client.createWriteStream(path, options);
	}
}
