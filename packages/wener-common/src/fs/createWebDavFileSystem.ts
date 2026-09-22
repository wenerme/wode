import { type MaybeFunction, maybeFunction } from '@wener/utils';
import type { FileStat, ResponseDataDetailed, WebDAVClient } from 'webdav';
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
import { validateReaddirMaxEntries } from './readdirLimit';
import { rejectUnsupportedFileSystemLimit, throwIfFileSystemAborted, validateReadFileMaxBytes } from './resourceLimits';

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
		{ glob, recursive, depth, kind, hidden, signal, maxEntries }: ReaddirOptions = {},
	): Promise<IFileStat[]> {
		throwIfFileSystemAborted(signal);
		rejectUnsupportedFileSystemLimit('readdir', 'maxEntries', validateReaddirMaxEntries(maxEntries));
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
			out = out.filter((v) => matchesPosixGlob(v.filename, glob));
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
		throwIfFileSystemAborted(options.signal);
		rejectUnsupportedFileSystemLimit('readFile', 'maxBytes', validateReadFileMaxBytes(options.maxBytes));
		const format = options.encoding === 'text' ? 'text' : 'binary';
		const res = await this.client.getFileContents(path, { format, ...options });
		return this.getData(res);
	}

	async writeFile(path: string, data: WritableData, options: WriteFileOptions = {}): Promise<void> {
		let webdavData: string | ArrayBuffer | Uint8Array;
		if (typeof data === 'string' || data instanceof ArrayBuffer) {
			webdavData = data;
		} else if (data instanceof ReadableStream) {
			webdavData = await readWebStream(data);
		} else if (ArrayBuffer.isView(data)) {
			webdavData = new Uint8Array(data.buffer, data.byteOffset, data.byteLength).slice();
		} else {
			throw new TypeError('Unsupported WebDAV file data');
		}
		await this.client.putFileContents(path, webdavData as never, options);
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
}

function matchesPosixGlob(value: string, pattern: string): boolean {
	let expression = '^';
	for (let index = 0; index < pattern.length; index += 1) {
		const character = pattern[index];
		if (character === '*') {
			if (pattern[index + 1] === '*') {
				expression += '.*';
				index += 1;
			} else {
				expression += '[^/]*';
			}
		} else if (character === '?') {
			expression += '[^/]';
		} else {
			expression += character.replace(/[\\^$.*+?()[\]{}|]/gu, '\\$&');
		}
	}
	return new RegExp(`${expression}$`, 'u').test(value);
}

async function readWebStream(stream: ReadableStream): Promise<Uint8Array> {
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			const chunk = value instanceof Uint8Array ? value : new Uint8Array(value);
			chunks.push(chunk);
			total += chunk.byteLength;
		}
	} finally {
		reader.releaseLock();
	}
	const output = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		output.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return output;
}
