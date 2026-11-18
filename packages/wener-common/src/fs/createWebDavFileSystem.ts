import { type MaybeFunction, maybeFunction } from '@wener/utils';
import {
	createWebDavClient,
	type WebDavClient,
	type WebDavClientOptions,
	type WebDavEntry,
	WebDavError,
} from '@wener/client/webdav';
import { FileSystemError, type FileSystemErrorCode } from './FileSystemError';
import type {
	CopyOptions,
	CreateReadStreamOptions,
	CreateWriteStreamOptions,
	FileSystemOperationOptions,
	IFileStat,
	IFileSystem,
	MkdirOptions,
	ReaddirOptions,
	ReadFileOptions,
	RenameOptions,
	RmOptions,
	StatOptions,
	WritableData,
	WriteFileOptions,
} from './IFileSystem';
import { assertReaddirEntryLimit, validateReaddirMaxEntries } from './readdirLimit';
import { validateReadFileMaxBytes } from './resourceLimits';

export interface WebDavFileSystemLimits {
	/** Max directories visited by one readdir traversal; default 10,000. */
	maxVisitedDirectories?: number;
	/** Max entries scanned (before filtering) by one readdir; default max(10 x maxEntries, 100,000). */
	maxScannedEntries?: number;
}

export type CreateWebDavFileSystemOptions = ({ client: MaybeFunction<WebDavClient> } | WebDavClientOptions) & WebDavFileSystemLimits;

/** Error raised by the WebDAV filesystem; `status` is the HTTP status when known. */
export class WebDavFileSystemError extends FileSystemError {
	constructor(
		message: string,
		code: FileSystemErrorCode,
		readonly status?: number,
	) {
		super(message, code);
		this.name = 'WebDavFileSystemError';
	}
}

/**
 * IFileSystem over the fetch-based `@wener/client/webdav` client. Browser safe.
 * Paths are logical POSIX paths relative to the client base URL.
 */
export function createWebDavFileSystem(options: CreateWebDavFileSystemOptions): IFileSystem {
	let resolved: WebDavClient | undefined;
	const getClient = (): WebDavClient => {
		if ('client' in options) return maybeFunction(options.client);
		resolved ??= createWebDavClient(options);
		return resolved;
	};
	return new WebDavFs(getClient, options);
}

type Op = 'readdir' | 'stat' | 'mkdir' | 'readFile' | 'writeFile' | 'rm' | 'rename' | 'copy' | 'exists' | 'read';

function normalize(path: string): string {
	if (typeof path !== 'string' || !path || path.includes('\0')) throw new FileSystemError('Invalid path', 'EINVAL');
	const segments: string[] = [];
	for (const segment of path.split('/')) {
		if (!segment || segment === '.') continue;
		if (segment === '..') throw new FileSystemError(`Path escapes root: ${path}`, 'EINVAL');
		segments.push(segment);
	}
	return `/${segments.join('/')}`;
}

function parentOf(path: string) {
	return path.slice(0, path.lastIndexOf('/')) || '/';
}

function aborted(signal?: AbortSignal) {
	if (signal?.aborted) throw new FileSystemError('Operation aborted', 'ABORT_ERR');
}

function statusCode(op: Op, status: number): FileSystemErrorCode {
	if (status === 404) return 'ENOENT';
	if (status === 401 || status === 403) return 'EACCES';
	if (status === 507) return 'ENOSPC';
	if (status === 412) return 'EEXIST';
	if (status === 409) return op === 'mkdir' || op === 'writeFile' || op === 'rename' || op === 'copy' ? 'ENOENT' : 'EIO';
	if (status === 405 && op === 'mkdir') return 'EEXIST';
	// PUT onto a collection is rejected with 405 by common servers.
	if (status === 405 && op === 'writeFile') return 'EISDIR';
	if (status === 423) return 'EBUSY';
	return 'EIO';
}

function toFsError(error: unknown, op: Op, path: string, signal?: AbortSignal): unknown {
	if (error instanceof FileSystemError) return error;
	if (signal?.aborted || (error instanceof Error && error.name === 'AbortError'))
		return new FileSystemError('Operation aborted', 'ABORT_ERR');
	if (error instanceof WebDavError) {
		if (error.status) return new WebDavFileSystemError(`WebDAV ${op} failed with status ${error.status}: ${path}`, statusCode(op, error.status), error.status);
		if (/Invalid WebDAV path/u.test(error.message)) return new FileSystemError(`Invalid path: ${path}`, 'EINVAL');
		return new WebDavFileSystemError(`${error.message}: ${path}`, 'EIO');
	}
	// Never forward transport errors verbatim; they may include URLs or headers.
	return new WebDavFileSystemError(`WebDAV ${op} failed: ${path}`, 'EIO');
}

function toStat(entry: WebDavEntry): IFileStat {
	const path = entry.path || '/';
	const meta: Record<string, unknown> = {};
	if (entry.etag) meta.etag = entry.etag;
	if (entry.contentType) meta.mime = entry.contentType;
	return {
		directory: parentOf(path),
		path,
		name: entry.name,
		kind: entry.type,
		mtime: entry.lastModified ? Date.parse(entry.lastModified) : 0,
		meta,
		size: entry.size ?? 0,
	};
}

function toBody(data: WritableData): Uint8Array | string | ReadableStream<Uint8Array> {
	if (typeof data === 'string') return data;
	if (data instanceof ReadableStream) return data as ReadableStream<Uint8Array>;
	if (data instanceof ArrayBuffer) return new Uint8Array(data);
	if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
	throw new FileSystemError('Unsupported WebDAV file data', 'EINVAL');
}

export function matchesPosixGlob(value: string, pattern: string): boolean {
	let expression = '^';
	for (let index = 0; index < pattern.length; index += 1) {
		const character = pattern[index]!;
		if (character === '*') {
			if (pattern[index + 1] === '*') {
				expression += '.*';
				index += 1;
			} else expression += '[^/]*';
		} else if (character === '?') expression += '[^/]';
		else expression += character.replace(/[\\^$.*+?()[\]{}|]/gu, '\\$&');
	}
	return new RegExp(`${expression}$`, 'u').test(value);
}

class WebDavFs implements IFileSystem {
	constructor(
		private readonly client: () => WebDavClient,
		private readonly limits: WebDavFileSystemLimits = {},
	) {}

	private async run<T>(op: Op, path: string, signal: AbortSignal | undefined, invoke: (client: WebDavClient) => Promise<T>): Promise<T> {
		aborted(signal);
		try {
			return await invoke(this.client());
		} catch (error) {
			throw toFsError(error, op, path, signal);
		}
	}

	private async statOrNull(path: string, signal?: AbortSignal): Promise<IFileStat | null> {
		const entry = await this.run('stat', path, signal, (client) => client.stat(path, { signal }));
		return entry ? toStat(entry) : null;
	}

	async readdir(path: string, options: ReaddirOptions = {}): Promise<IFileStat[]> {
		const { glob, recursive, depth, kind, hidden, signal } = options;
		const maxEntries = validateReaddirMaxEntries(options.maxEntries);
		const root = normalize(path);
		const maxDepth = recursive ? Number.POSITIVE_INFINITY : Math.max(1, depth ?? 1);
		const maxDirs = this.limits.maxVisitedDirectories ?? 10_000;
		const maxScanned = this.limits.maxScannedEntries ?? Math.max((maxEntries ?? 0) * 10, 100_000);
		const out: IFileStat[] = [];
		const visited = new Set<string>([root]);
		let scanned = 0;
		let queue: Array<{ path: string; level: number }> = [{ path: root, level: 1 }];
		while (queue.length) {
			const next: typeof queue = [];
			for (const item of queue) {
				const entries = await this.run('readdir', item.path, signal, (client) =>
					client.list(item.path, { signal, includeSelf: true }));
				const self = entries.find((entry) => entry.path === item.path);
				if (self?.type === 'file') throw new FileSystemError(`Not a directory: ${item.path}`, 'ENOTDIR');
				for (const entry of entries) {
					// Servers may return ancestors, siblings or deeper entries; only direct children count.
					if (entry.path === item.path || parentOf(entry.path) !== item.path) continue;
					if (++scanned > maxScanned) throw new FileSystemError(`Directory traversal exceeds ${maxScanned} entries: ${root}`, 'EOVERFLOW');
					if (!hidden && entry.name.startsWith('.')) continue;
					const stat = toStat(entry);
					if (stat.kind === 'directory' && item.level < maxDepth && !visited.has(stat.path)) {
						visited.add(stat.path);
						if (visited.size > maxDirs) throw new FileSystemError(`Directory traversal exceeds ${maxDirs} directories: ${root}`, 'EOVERFLOW');
						next.push({ path: stat.path, level: item.level + 1 });
					}
					if (kind && stat.kind !== kind) continue;
					if (glob && !matchesPosixGlob(stat.path, glob)) continue;
					out.push(stat);
					assertReaddirEntryLimit(out.length, maxEntries, root);
				}
			}
			queue = next;
		}
		return out;
	}

	async stat(path: string, { signal }: StatOptions = {}): Promise<IFileStat> {
		const target = normalize(path);
		const stat = await this.statOrNull(target, signal);
		if (!stat) throw new FileSystemError(`File not found: ${target}`, 'ENOENT');
		return stat;
	}

	async exists(path: string, { signal }: FileSystemOperationOptions = {}): Promise<boolean> {
		return Boolean(await this.statOrNull(normalize(path), signal));
	}

	async mkdir(path: string, { recursive, signal }: MkdirOptions = {}): Promise<void> {
		const target = normalize(path);
		if (target === '/') return;
		const existing = await this.statOrNull(target, signal);
		if (existing) {
			if (existing.kind === 'file') throw new FileSystemError(`File already exists: ${target}`, 'EEXIST');
			return;
		}
		if (recursive) {
			const segments = target.split('/').filter(Boolean);
			let current = '';
			for (const segment of segments.slice(0, -1)) {
				current += `/${segment}`;
				const stat = await this.statOrNull(current, signal);
				if (stat?.kind === 'file') throw new FileSystemError(`Parent is not a directory: ${current}`, 'ENOTDIR');
				if (!stat) await this.mkcol(current, signal, true);
			}
		}
		await this.mkcol(target, signal, false);
	}

	private async mkcol(path: string, signal: AbortSignal | undefined, tolerateExisting: boolean) {
		try {
			await this.run('mkdir', path, signal, (client) => client.mkdir(path, { signal }));
		} catch (error) {
			// Lost a race with a concurrent creator.
			if (tolerateExisting && error instanceof FileSystemError && error.code === 'EEXIST') return;
			throw error;
		}
	}

	readFile(path: string, options: ReadFileOptions & { encoding: 'text' }): Promise<string>;
	readFile(path: string, options?: ReadFileOptions): Promise<Uint8Array>;
	async readFile(path: string, options: ReadFileOptions = {}): Promise<string | Uint8Array> {
		const target = normalize(path);
		const maxBytes = validateReadFileMaxBytes(options.maxBytes);
		const { signal, onDownloadProgress } = options;
		const data = await this.run('readFile', target, signal, async (client) => {
			const result = await client.readStream(target, { signal });
			const reader = result.body.getReader();
			const chunks: Uint8Array[] = [];
			let loaded = 0;
			try {
				while (maxBytes === undefined || loaded < maxBytes) {
					const { done, value } = await reader.read();
					if (done) break;
					const chunk = maxBytes !== undefined && loaded + value.byteLength > maxBytes ? value.subarray(0, maxBytes - loaded) : value;
					chunks.push(chunk);
					loaded += chunk.byteLength;
					onDownloadProgress?.({ loaded, total: result.size ?? loaded });
				}
			} finally {
				// Stop the transfer once the bound is reached.
				await reader.cancel().catch(() => undefined);
			}
			const bytes = new Uint8Array(loaded);
			let offset = 0;
			for (const chunk of chunks) {
				bytes.set(chunk, offset);
				offset += chunk.byteLength;
			}
			return bytes;
		});
		aborted(signal);
		return options.encoding === 'text' ? new TextDecoder().decode(data) : data;
	}

	async writeFile(path: string, data: WritableData, options: WriteFileOptions = {}): Promise<void> {
		const target = normalize(path);
		if (target === '/') throw new FileSystemError('Cannot write to the root directory', 'EINVAL');
		if (data === null || data === undefined) throw new FileSystemError('Invalid data', 'EINVAL');
		const body = toBody(data);
		const { signal, overwrite } = options;
		await this.run('writeFile', target, signal, (client) => client.write(target, body, { signal, overwrite: overwrite !== false }));
		const size = typeof body === 'string' ? new TextEncoder().encode(body).byteLength : body instanceof Uint8Array ? body.byteLength : 0;
		options.onUploadProgress?.({ loaded: size, total: size });
	}

	async rm(path: string, { recursive, force, signal }: RmOptions = {}): Promise<void> {
		const target = normalize(path);
		if (target === '/') throw new FileSystemError('Cannot remove the root directory', 'EBUSY');
		const stat = await this.statOrNull(target, signal);
		if (!stat) {
			if (force) return;
			throw new FileSystemError(`File not found: ${target}`, 'ENOENT');
		}
		// WebDAV DELETE on a collection is always recursive, so enforce emptiness here.
		if (stat.kind === 'directory' && !recursive) {
			const children = await this.run('rm', target, signal, (client) => client.list(target, { signal }));
			if (children.length) throw new FileSystemError(`Directory not empty: ${target}`, 'ENOTEMPTY');
		}
		try {
			await this.run('rm', target, signal, (client) => client.remove(target, { signal }));
		} catch (error) {
			if (force && error instanceof FileSystemError && error.code === 'ENOENT') return;
			throw error;
		}
	}

	async rename(oldPath: string, newPath: string, { overwrite, signal }: RenameOptions = {}): Promise<void> {
		const [from, to] = this.transferPaths(oldPath, newPath, 'move');
		await this.run('rename', from, signal, (client) => client.move(from, to, { signal, overwrite: Boolean(overwrite) }));
	}

	async copy(source: string, destination: string, { overwrite, shallow, signal }: CopyOptions = {}): Promise<void> {
		const [from, to] = this.transferPaths(source, destination, 'copy');
		await this.run('copy', from, signal, (client) =>
			client.copy(from, to, { signal, overwrite: Boolean(overwrite), shallow: Boolean(shallow) }));
	}

	private transferPaths(source: string, destination: string, label: string): [string, string] {
		const from = normalize(source);
		const to = normalize(destination);
		if (from === '/' || to === '/') throw new FileSystemError(`Cannot ${label} the root directory`, 'EBUSY');
		if (from === to || to.startsWith(`${from}/`)) throw new FileSystemError(`Cannot ${label} into itself: ${to}`, 'EINVAL');
		return [from, to];
	}

	createReadableStream(path: string, options: CreateReadStreamOptions = {}): ReadableStream<Uint8Array> {
		const target = normalize(path);
		const { signal, range } = options;
		let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
		// When a server ignores Range (200 instead of 206), skip/limit bytes locally.
		let skip = 0;
		let remaining = Number.POSITIVE_INFINITY;
		return new ReadableStream<Uint8Array>({
			start: async () => {
				const result = await this.run('read', target, signal, async (client) => {
					try {
						return await client.readStream(target, { signal, range });
					} catch (error) {
						// RFC 9110: a range on a zero-length resource is unsatisfiable (416); retry without Range.
						if (range && range.start === 0 && error instanceof WebDavError && error.status === 416)
							return client.readStream(target, { signal });
						throw error;
					}
				});
				reader = result.body.getReader();
				if (range && result.status !== 206) {
					skip = range.start;
					if (range.end !== undefined) remaining = range.end - range.start + 1;
				}
			},
			pull: async (controller) => {
				try {
					for (;;) {
						if (remaining <= 0) {
							await reader!.cancel().catch(() => undefined);
							controller.close();
							return;
						}
						const { done, value } = await reader!.read();
						if (done) {
							controller.close();
							return;
						}
						let chunk = value;
						if (skip > 0) {
							const dropped = Math.min(skip, chunk.byteLength);
							skip -= dropped;
							chunk = chunk.subarray(dropped);
						}
						if (chunk.byteLength > remaining) chunk = chunk.subarray(0, remaining);
						if (!chunk.byteLength) continue;
						if (remaining !== Number.POSITIVE_INFINITY) remaining -= chunk.byteLength;
						controller.enqueue(chunk);
						return;
					}
				} catch (error) {
					throw toFsError(error, 'read', target, signal);
				}
			},
			cancel: async (reason) => {
				await reader?.cancel(reason).catch(() => undefined);
			},
		});
	}

	createWritableStream(path: string, options: CreateWriteStreamOptions = {}): WritableStream<Uint8Array> {
		const target = normalize(path);
		const { signal, overwrite } = options;
		const controller = new AbortController();
		const merged = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
		let writer: WritableStreamDefaultWriter<Uint8Array> | undefined;
		let upload: Promise<unknown> | undefined;
		// The PUT starts on first write/close, so an aborted unused stream sends nothing.
		const start = () => {
			if (writer) return writer;
			const pipe = new TransformStream<Uint8Array, Uint8Array>();
			const current = pipe.writable.getWriter();
			writer = current;
			upload = this.run('writeFile', target, merged, (client) =>
				client.write(target, pipe.readable, { signal: merged, overwrite: overwrite !== false }));
			// Surface upload failures through the writable side; avoid unhandled rejections.
			upload.catch((error) => current.abort(error).catch(() => undefined));
			return current;
		};
		return new WritableStream<Uint8Array>({
			write: async (chunk) => {
				aborted(signal);
				await start().write(chunk);
			},
			close: async () => {
				aborted(signal);
				await start().close();
				await upload;
			},
			abort: async (reason) => {
				controller.abort(reason);
				await writer?.abort(reason).catch(() => undefined);
				await upload?.catch(() => undefined);
			},
		});
	}
}
