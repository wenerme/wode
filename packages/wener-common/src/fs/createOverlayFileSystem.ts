import { createFileSystemErrors } from './base/errors';
import { createMutationQueue } from './base/mutationQueue';
import { assertNonOverlappingPaths, joinChildPath, normalizeFileSystemPath } from './base/paths';
import { createFileStat } from './base/stat';
import { createMemoryFileSystem } from './createMemoryFileSystem';
import type {
	CopyOptions,
	CreateReadStreamOptions,
	CreateWriteStreamOptions,
	FileSystemOperationOptions,
	FileSystemWritableData,
	IFileStat,
	IFileSystem,
	IReadableStreamFileSystem,
	IWritableStreamFileSystem,
	MkdirOptions,
	ReaddirOptions,
	ReadFileOptions,
	RenameOptions,
	RmOptions,
	StatOptions,
	WriteFileOptions,
} from './IFileSystem';
import { isReadableStreamFileSystem, isWritableStreamFileSystem } from './IFileSystem';
import { validateReaddirMaxEntries } from './readdirLimit';

/** upper 中标记 lower 同名条目已删除的文件名前缀。 */
export const OverlayWhiteoutPrefix = '.wh.';
/** upper 目录中的该文件表示目录不透明，不再合并 lower 同路径的子项。 */
export const OverlayOpaqueMarker = '.wh..wh..opq';

export type OverlayChangeKind = 'added' | 'modified' | 'deleted' | 'replaced';

export type OverlayChange = {
	path: string;
	kind: OverlayChangeKind;
	type: IFileStat['kind'];
};

export type CreateOverlayFileSystemOptions = {
	/** 只读下层；overlay 不会调用其变更方法。 */
	lower: IFileSystem;
	/** 接收全部写入的上层；默认使用内存文件系统。 */
	upper?: IFileSystem;
};

/**
 * 写时重定向的叠加文件系统：读先查 upper 再落到 lower，写只进 upper。
 *
 * lower 可以是另一个 overlay，形成快照链。删除通过 whiteout 表示，删除后重建的目录
 * 使用 opaque 标记屏蔽 lower 旧内容。changes/reset 用于查看和清空相对 lower 的差异。
 * upper 必须与 lower 分离，并由此 overlay 独占管理。写流从打开到 close/abort 期间
 * 占用变更队列；调用方必须结束写流后再等待后续变更。目录复制不是事务。
 * readdir 仅支持当前目录合并；限额、筛选和递归选项返回 ENOTSUP。
 */
export type OverlayFileSystem = IFileSystem &
	Partial<
		Pick<IReadableStreamFileSystem, 'createReadableStream'> & Pick<IWritableStreamFileSystem, 'createWritableStream'>
	> & {
		readonly lower: IFileSystem;
		readonly upper: IFileSystem;
		changes(options?: FileSystemOperationOptions): Promise<OverlayChange[]>;
		reset(options?: FileSystemOperationOptions): Promise<void>;
	};

export function createOverlayFileSystem(options: CreateOverlayFileSystemOptions): OverlayFileSystem {
	return new OverlayFileSystemImplementation(options.lower, options.upper ?? createMemoryFileSystem());
}

const errors = createFileSystemErrors();

class OverlayFileSystemImplementation implements OverlayFileSystem {
	readonly lower: IFileSystem;
	readonly upper: IFileSystem;
	readonly createReadableStream?: (path: string, options?: CreateReadStreamOptions) => ReadableStream;
	readonly createWritableStream?: (path: string, options?: CreateWriteStreamOptions) => WritableStream;
	readonly #enqueue = createMutationQueue();

	constructor(lower: IFileSystem, upper: IFileSystem) {
		if (lower === upper) throw errors.create('Overlay upper and lower must be distinct filesystems', 'EINVAL');
		this.lower = lower;
		this.upper = upper;
		if (isReadableStreamFileSystem(lower) && isReadableStreamFileSystem(upper)) {
			this.createReadableStream = (path, streamOptions) => this.openReadableStream(path, streamOptions);
		}
		if (isWritableStreamFileSystem(upper)) {
			this.createWritableStream = (path, streamOptions) => this.openWritableStream(path, streamOptions);
		}
	}

	async stat(path: string, options?: StatOptions): Promise<IFileStat> {
		checkAborted(options?.signal);
		const target = normalize(path);
		assertNotReserved(target, 'read');
		return this.statInternal(target, options?.signal);
	}

	async exists(path: string, options?: FileSystemOperationOptions): Promise<boolean> {
		checkAborted(options?.signal);
		const target = normalize(path);
		if (isReserved(target)) return false;
		return (await this.tryStat(target, options?.signal)) !== undefined;
	}

	async readdir(path: string, options?: ReaddirOptions): Promise<IFileStat[]> {
		checkAborted(options?.signal);
		if (
			options?.glob !== undefined ||
			options?.kind !== undefined ||
			options?.hidden !== undefined ||
			options?.depth !== undefined ||
			options?.recursive
		) {
			throw errors.create('Overlay readdir does not support filtering or recursive listing', 'ENOTSUP');
		}
		const target = normalize(path);
		assertNotReserved(target, 'read');
		const maxEntries = validateReaddirMaxEntries(options?.maxEntries);
		if (maxEntries !== undefined) {
			throw errors.create('Overlay cannot bound filtered directory enumeration before allocation', 'ENOTSUP');
		}
		const stat = await this.statInternal(target, options?.signal);
		if (stat.kind !== 'directory') throw errors.notDirectory(target);

		const entries = new Map<string, IFileStat>();
		const hidden = new Set<string>();
		let opaque = false;
		const upperStat = await tryLayer(() => this.upper.stat(target, { signal: options?.signal }));
		if (upperStat?.kind === 'directory') {
			for (const entry of await this.upper.readdir(target, { signal: options?.signal })) {
				if (entry.name === OverlayOpaqueMarker) opaque = true;
				else if (entry.name.startsWith(OverlayWhiteoutPrefix))
					hidden.add(entry.name.slice(OverlayWhiteoutPrefix.length));
				else entries.set(entry.name, entry);
			}
		}

		if (!opaque && (await this.lowerVisible(target, options?.signal))) {
			const lowerStat = await tryLayer(() => this.lower.stat(target, { signal: options?.signal }));
			if (lowerStat?.kind === 'directory') {
				for (const entry of await this.lower.readdir(target, {
					signal: options?.signal,
				})) {
					if (!entry.name.startsWith(OverlayWhiteoutPrefix) && !hidden.has(entry.name) && !entries.has(entry.name)) {
						entries.set(entry.name, entry);
					}
				}
			}
		}

		return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name));
	}

	readFile(path: string, options: ReadFileOptions & { encoding: 'text' }): Promise<string>;
	readFile(path: string, options?: ReadFileOptions): Promise<Uint8Array>;
	async readFile(path: string, options?: ReadFileOptions): Promise<string | Uint8Array> {
		checkAborted(options?.signal);
		const target = normalize(path);
		assertNotReserved(target, 'read');
		const layer = await this.resolveLayer(target, options?.signal);
		return options?.encoding === 'text'
			? layer.readFile(target, { ...options, encoding: 'text' })
			: layer.readFile(target, options);
	}

	async writeFile(path: string, data: FileSystemWritableData, options: WriteFileOptions = {}): Promise<void> {
		checkAborted(options.signal);
		const target = normalizeWritable(path);
		if (data === null || data === undefined) {
			throw errors.create('Invalid data: data cannot be null or undefined', 'EINVAL');
		}
		return this.#enqueue(async () => {
			checkAborted(options.signal);
			const existing = await this.tryStat(target, options.signal);
			if (existing?.kind === 'directory') throw errors.isDirectory(target);
			if (existing && options.overwrite === false) throw errors.alreadyExists(target);
			await this.ensureUpperDirectory(parentOf(target), options.signal);
			await this.upper.writeFile(target, data, { ...options, overwrite: true });
			await this.settleCreated(target, 'file', options.signal);
		});
	}

	async mkdir(path: string, options: MkdirOptions = {}): Promise<void> {
		checkAborted(options.signal);
		const target = normalize(path);
		if (target === '/') return;
		assertNotReserved(target, 'write');
		return this.#enqueue(async () => {
			checkAborted(options.signal);
			const existing = await this.tryStat(target, options.signal);
			if (existing) {
				if (existing.kind === 'directory' && options.recursive) return;
				throw errors.alreadyExists(target);
			}
			if (options.recursive) {
				await this.ensureUpperDirectory(target, options.signal);
				return;
			}
			const parent = await this.tryStat(parentOf(target), options.signal);
			if (!parent) throw errors.notFound(parentOf(target));
			if (parent.kind !== 'directory') throw errors.notDirectory(parentOf(target));
			await this.ensureUpperDirectory(target, options.signal);
		});
	}

	async rm(path: string, options: RmOptions = {}): Promise<void> {
		checkAborted(options.signal);
		const target = normalize(path);
		if (target === '/') throw errors.create('Cannot remove the root directory', 'EBUSY');
		assertNotReserved(target, 'write');
		return this.#enqueue(() => this.rmInternal(target, options));
	}

	async rename(oldPath: string, newPath: string, options: RenameOptions = {}): Promise<void> {
		checkAborted(options.signal);
		const source = normalize(oldPath);
		const destination = normalizeWritable(newPath);
		if (source === '/') throw errors.create('Cannot move the root directory', 'EBUSY');
		assertNotReserved(source, 'write');
		assertNonOverlapping(source, destination);
		return this.#enqueue(async () => {
			checkAborted(options.signal);
			const stat = await this.statInternal(source, options.signal);
			const lowerHasSource = await this.lowerHas(source, options.signal);
			if (stat.kind === 'directory' && lowerHasSource && !(await this.upperOpaque(source, options.signal))) {
				throw errors.create(`Cross-layer directory rename: ${source} -> ${destination}`, 'EXDEV');
			}
			await this.prepareDestination(stat, destination, options.overwrite === true, options.signal);
			await this.ensureUpperDirectory(parentOf(destination), options.signal);
			if (await tryLayer(() => this.upper.stat(source, { signal: options.signal }))) {
				await this.upper.rename(source, destination, { overwrite: true, signal: options.signal });
			} else {
				await this.upper.writeFile(destination, await this.lower.readFile(source, { signal: options.signal }), {
					overwrite: true,
					signal: options.signal,
				});
			}
			await this.settleCreated(destination, stat.kind, options.signal);
			if (lowerHasSource) await this.writeWhiteout(source, options.signal);
		});
	}

	async copy(sourcePath: string, destinationPath: string, options: CopyOptions = {}): Promise<void> {
		checkAborted(options.signal);
		const source = normalize(sourcePath);
		const destination = normalizeWritable(destinationPath);
		assertNotReserved(source, 'read');
		assertNonOverlapping(source, destination);
		return this.#enqueue(async () => {
			checkAborted(options.signal);
			const stat = await this.statInternal(source, options.signal);
			await this.prepareDestination(stat, destination, options.overwrite === true, options.signal);
			await this.copyTree(source, destination, stat, options);
		});
	}

	async changes(options: FileSystemOperationOptions = {}): Promise<OverlayChange[]> {
		checkAborted(options.signal);
		const changes: OverlayChange[] = [];
		if ((await tryLayer(() => this.upper.stat('/', options)))?.kind === 'directory') {
			const opaque = await this.upperOpaque('/', options.signal);
			if (opaque) changes.push({ path: '/', kind: 'replaced', type: 'directory' });
			await this.collectChanges('/', !opaque, changes, options.signal);
		}
		return changes.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
	}

	async reset(options: FileSystemOperationOptions = {}): Promise<void> {
		checkAborted(options.signal);
		return this.#enqueue(async () => {
			checkAborted(options.signal);
			if ((await tryLayer(() => this.upper.stat('/', options)))?.kind !== 'directory') return;
			for (const entry of await this.upper.readdir('/', options)) {
				await this.upper.rm(entry.path, { recursive: true, force: true, signal: options.signal });
			}
		});
	}

	private async statInternal(target: string, signal?: AbortSignal): Promise<IFileStat> {
		const stat = await this.tryStat(target, signal);
		if (stat) return stat;
		throw errors.notFound(target);
	}

	private async tryStat(target: string, signal?: AbortSignal): Promise<IFileStat | undefined> {
		const upper = await tryLayer(() => this.upper.stat(target, { signal }));
		if (upper) return upper;
		if (await this.lowerVisible(target, signal)) {
			const lower = await tryLayer(() => this.lower.stat(target, { signal }));
			if (lower) return lower;
		}
		return target === '/' ? createFileStat({ path: '/', kind: 'directory' }) : undefined;
	}

	private async lowerVisible(target: string, signal?: AbortSignal): Promise<boolean> {
		if (target === '/') return true;
		let current = '/';
		for (const part of target.slice(1).split('/')) {
			const upperDirectory = await tryLayer(() => this.upper.stat(current, { signal }));
			if (!upperDirectory) return true;
			if (upperDirectory.kind !== 'directory') return false;
			if (await this.upperHas(joinChildPath(current, OverlayOpaqueMarker), signal)) return false;
			if (await this.upperHas(joinChildPath(current, `${OverlayWhiteoutPrefix}${part}`), signal)) return false;
			current = joinChildPath(current, part);
		}
		return true;
	}

	private async lowerHas(target: string, signal?: AbortSignal): Promise<boolean> {
		return (
			(await this.lowerVisible(target, signal)) && Boolean(await tryLayer(() => this.lower.stat(target, { signal })))
		);
	}

	private async upperHas(target: string, signal?: AbortSignal): Promise<boolean> {
		return Boolean(await tryLayer(() => this.upper.stat(target, { signal })));
	}

	private upperOpaque(directory: string, signal?: AbortSignal): Promise<boolean> {
		return this.upperHas(joinChildPath(directory, OverlayOpaqueMarker), signal);
	}

	private async resolveLayer(target: string, signal?: AbortSignal): Promise<IFileSystem> {
		if (await this.upperHas(target, signal)) return this.upper;
		if (await this.lowerHas(target, signal)) return this.lower;
		throw errors.notFound(target);
	}

	private async ensureUpperDirectory(directory: string, signal?: AbortSignal): Promise<void> {
		if (directory === '/') {
			if (!(await this.upperHas('/', signal))) await this.upper.mkdir('/', { recursive: true, signal });
			return;
		}
		await this.ensureUpperDirectory(parentOf(directory), signal);
		const upper = await tryLayer(() => this.upper.stat(directory, { signal }));
		if (upper) {
			if (upper.kind !== 'directory') throw errors.notDirectory(directory);
			return;
		}
		const lower = (await this.lowerVisible(directory, signal))
			? await tryLayer(() => this.lower.stat(directory, { signal }))
			: undefined;
		if (lower && lower.kind !== 'directory') throw errors.notDirectory(directory);
		await this.upper.mkdir(directory, { signal });
		await this.settleCreated(directory, 'directory', signal);
	}

	private async settleCreated(target: string, kind: IFileStat['kind'], signal?: AbortSignal): Promise<void> {
		const whiteout = whiteoutPath(target);
		if (!(await this.upperHas(whiteout, signal))) return;
		if (kind === 'directory') {
			await this.upper.writeFile(joinChildPath(target, OverlayOpaqueMarker), '', { overwrite: true, signal });
		}
		await this.upper.rm(whiteout, { force: true, signal });
	}

	private async writeWhiteout(target: string, signal?: AbortSignal): Promise<void> {
		await this.ensureUpperDirectory(parentOf(target), signal);
		await this.upper.writeFile(whiteoutPath(target), '', { overwrite: true, signal });
	}

	private async rmInternal(target: string, options: RmOptions): Promise<void> {
		checkAborted(options.signal);
		const stat = await this.tryStat(target, options.signal);
		if (!stat) {
			if (options.force) return;
			throw errors.notFound(target);
		}
		if (
			stat.kind === 'directory' &&
			!options.recursive &&
			(await this.readdir(target, { signal: options.signal })).length
		) {
			throw errors.directoryNotEmpty(target);
		}
		if (await this.lowerHas(target, options.signal)) await this.writeWhiteout(target, options.signal);
		await this.upper.rm(target, { recursive: true, force: true, signal: options.signal });
	}

	private async prepareDestination(
		source: IFileStat,
		destination: string,
		overwrite: boolean,
		signal?: AbortSignal,
	): Promise<void> {
		const existing = await this.tryStat(destination, signal);
		if (!existing) return;
		if (!overwrite) throw errors.alreadyExists(destination);
		if (existing.kind === 'directory' && source.kind !== 'directory') throw errors.isDirectory(destination);
		if (existing.kind !== 'directory' && source.kind === 'directory') throw errors.notDirectory(destination);
		// 文件交由 upper 直接覆盖，不提前删除目标；写入原子性由 upper 自身提供。
		if (source.kind === 'directory') await this.rmInternal(destination, { recursive: true, force: true, signal });
	}

	private async copyTree(source: string, destination: string, stat: IFileStat, options: CopyOptions): Promise<void> {
		checkAborted(options.signal);
		if (stat.kind === 'file') {
			const layer = await this.resolveLayer(source, options.signal);
			await this.ensureUpperDirectory(parentOf(destination), options.signal);
			await this.upper.writeFile(destination, await layer.readFile(source, { signal: options.signal }), {
				overwrite: true,
				signal: options.signal,
			});
			await this.settleCreated(destination, 'file', options.signal);
			return;
		}
		await this.ensureUpperDirectory(destination, options.signal);
		if (options.shallow) return;
		for (const entry of await this.readdir(source, { signal: options.signal })) {
			await this.copyTree(entry.path, joinChildPath(destination, entry.name), entry, options);
		}
	}

	private async collectChanges(
		directory: string,
		mergedWithLower: boolean,
		changes: OverlayChange[],
		signal?: AbortSignal,
	): Promise<void> {
		checkAborted(signal);
		for (const entry of await this.upper.readdir(directory, { signal })) {
			if (entry.name === OverlayOpaqueMarker) continue;
			if (entry.name.startsWith(OverlayWhiteoutPrefix)) {
				const path = joinChildPath(directory, entry.name.slice(OverlayWhiteoutPrefix.length));
				const lower = mergedWithLower ? await tryLayer(() => this.lower.stat(path, { signal })) : undefined;
				if (lower) changes.push({ path, kind: 'deleted', type: lower.kind });
				continue;
			}
			const lower = mergedWithLower ? await tryLayer(() => this.lower.stat(entry.path, { signal })) : undefined;
			if (entry.kind === 'file') {
				changes.push({
					path: entry.path,
					kind: lower ? (lower.kind === 'file' ? 'modified' : 'replaced') : 'added',
					type: 'file',
				});
				continue;
			}
			if (!lower) {
				changes.push({ path: entry.path, kind: 'added', type: 'directory' });
				await this.collectChanges(entry.path, false, changes, signal);
				continue;
			}
			const opaque = await this.upperOpaque(entry.path, signal);
			if (opaque || lower.kind !== 'directory') changes.push({ path: entry.path, kind: 'replaced', type: 'directory' });
			await this.collectChanges(entry.path, !opaque && lower.kind === 'directory', changes, signal);
		}
	}

	private openReadableStream(path: string, options: CreateReadStreamOptions = {}): ReadableStream {
		checkAborted(options.signal);
		const target = normalize(path);
		assertNotReserved(target, 'read');
		let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
		let cancelled = false;
		let cancelReason: unknown;
		return new ReadableStream<Uint8Array>({
			start: async () => {
				const layer = (await this.resolveLayer(target, options.signal)) as IReadableStreamFileSystem;
				if (cancelled) return;
				checkAborted(options.signal);
				reader = layer.createReadableStream(target, options).getReader();
				if (cancelled) {
					try {
						await reader.cancel(cancelReason);
					} finally {
						reader.releaseLock();
					}
				}
			},
			pull: async (controller) => {
				try {
					const next = await reader?.read();
					if (cancelled) return;
					if (!next || next.done) {
						reader?.releaseLock();
						controller.close();
					} else controller.enqueue(next.value);
				} catch (error) {
					reader?.releaseLock();
					throw error;
				}
			},
			cancel: async (reason) => {
				cancelled = true;
				cancelReason = reason;
				if (reader) {
					try {
						await reader.cancel(reason);
					} finally {
						reader.releaseLock();
					}
				}
			},
		});
	}

	private openWritableStream(path: string, options: CreateWriteStreamOptions = {}): WritableStream {
		checkAborted(options.signal);
		const target = normalizeWritable(path);
		const upper = this.upper as IWritableStreamFileSystem;
		let writer: WritableStreamDefaultWriter | undefined;
		const ready = Promise.withResolvers<void>();
		const finished = Promise.withResolvers<void>();
		void finished.promise.catch(() => undefined);
		let mutation: Promise<void>;
		const fail = async (reason: unknown) => {
			try {
				await writer?.abort(reason);
			} finally {
				finished.reject(reason);
			}
		};
		return new WritableStream({
			start: (controller) => {
				const onAbort = () => {
					const error = errors.aborted();
					controller.error(error);
					void fail(error).catch(() => undefined);
				};
				mutation = this.#enqueue(async () => {
					try {
						checkAborted(options.signal);
						const existing = await this.tryStat(target, options.signal);
						if (existing?.kind === 'directory') throw errors.isDirectory(target);
						if (existing && options.overwrite === false) throw errors.alreadyExists(target);
						await this.ensureUpperDirectory(parentOf(target), options.signal);
						writer = upper.createWritableStream(target, options).getWriter();
						options.signal?.addEventListener('abort', onAbort, { once: true });
						checkAborted(options.signal);
						await writer.ready;
						ready.resolve();
						await finished.promise;
					} catch (error) {
						ready.reject(error);
						controller.error(error);
						throw error;
					} finally {
						options.signal?.removeEventListener('abort', onAbort);
						writer?.releaseLock();
					}
				});
				void mutation.catch(() => undefined);
				return ready.promise;
			},
			write: async (chunk) => {
				try {
					checkAborted(options.signal);
					await writer!.write(chunk);
				} catch (error) {
					await fail(error);
					throw error;
				}
			},
			close: async () => {
				try {
					checkAborted(options.signal);
					await writer!.close();
					await this.settleCreated(target, 'file', options.signal);
					finished.resolve();
					await mutation;
				} catch (error) {
					await fail(error);
					throw error;
				}
			},
			abort: async (reason) => {
				try {
					await writer?.abort(reason);
				} finally {
					finished.resolve();
				}
				await mutation;
			},
		});
	}
}

function normalize(path: string): string {
	const normalized = normalizeFileSystemPath(path, 'lenient', errors);
	return normalized === '/' ? '/' : normalized.replace(/\/+$/u, '');
}

function normalizeWritable(path: string): string {
	const target = normalize(path);
	if (target === '/') throw errors.create('Cannot write to the root directory', 'EINVAL');
	assertNotReserved(target, 'write');
	return target;
}

function isReserved(target: string): boolean {
	return target.split('/').some((part) => part.startsWith(OverlayWhiteoutPrefix));
}

function assertNotReserved(target: string, mode: 'read' | 'write'): void {
	if (!isReserved(target)) return;
	if (mode === 'read') throw errors.notFound(target);
	throw errors.create(`Reserved overlay name: ${target}`, 'EINVAL');
}

function assertNonOverlapping(source: string, destination: string): void {
	assertNonOverlappingPaths(source, destination, errors);
}

function parentOf(target: string): string {
	const index = target.lastIndexOf('/');
	return index <= 0 ? '/' : target.slice(0, index);
}

function whiteoutPath(target: string): string {
	return joinChildPath(parentOf(target), `${OverlayWhiteoutPrefix}${target.slice(target.lastIndexOf('/') + 1)}`);
}

function checkAborted(signal?: AbortSignal): void {
	if (signal?.aborted) throw errors.aborted();
}

/** 层探测兼容标准文件系统错误和 Node 的原生错误；其余错误不能视作未命中。 */
async function tryLayer<T>(operation: () => Promise<T>): Promise<T | undefined> {
	try {
		return await operation();
	} catch (error) {
		const code = (error as { code?: unknown } | null)?.code;
		if (code === 'ENOENT' || code === 'ENOTDIR') return undefined;
		throw error;
	}
}
