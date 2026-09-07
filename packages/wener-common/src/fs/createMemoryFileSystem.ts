import { basename, dirname, normalize } from 'pathe';
import { FileSystemError } from './FileSystemError';
import { findMimeType } from './findMimeType';
import type {
	CopyOptions,
	CreateReadStreamOptions,
	CreateWriteStreamOptions,
	IFileStat,
	IFileSystem,
	MkdirOptions,
	ReaddirOptions,
	ReadFileOptions,
	RenameOptions,
	RmOptions,
	StatOptions,
	WriteFileOptions,
} from './IFileSystem';
import { assertReaddirEntryLimit, validateReaddirMaxEntries } from './readdirLimit';

export type MemoryFileSystemContent = string | ArrayBuffer | ArrayBufferView<ArrayBufferLike>;

export type MemoryFileSystemFile = IFileStat & {
	kind: 'file';
	content: MemoryFileSystemContent;
};

export type MemoryFileSystemDirectory = IFileStat & {
	kind: 'directory';
	children: MemoryFileSystemNode[];
};

export type MemoryFileSystemNode = MemoryFileSystemFile | MemoryFileSystemDirectory;

export type CreateMemoryFileSystemOptions = {
	root?: MemoryFileSystemDirectory;
};

type MemoryFile = IFileStat & {
	kind: 'file';
	content: Uint8Array<ArrayBuffer>;
};

type MemoryDirectory = IFileStat & {
	kind: 'directory';
	children: MemoryNode[];
};

type MemoryNode = MemoryFile | MemoryDirectory;
type WritableData = string | ArrayBuffer | ArrayBufferView<ArrayBufferLike> | ReadableStream;
type UrlCache = { url?: string };

export function createMemoryFileSystem(options: CreateMemoryFileSystemOptions = {}): IFileSystem {
	return new MemoryFileSystem(options);
}

class MemoryFileSystemError extends FileSystemError {
	constructor(message: string, code: string) {
		super(message, code);
		this.name = 'MemoryFileSystemError';
	}
}

class MemoryFileSystem implements IFileSystem {
	private readonly root: MemoryDirectory;
	private readonly urlCache = new WeakMap<MemoryFile, UrlCache>();

	constructor({ root }: CreateMemoryFileSystemOptions = {}) {
		this.root = root ? this.cloneInitialDirectory(root, '/') : this.createDirectory('', '/');
	}

	private createDirectory(name: string, path: string): MemoryDirectory {
		return {
			name,
			kind: 'directory',
			path,
			directory: path === '/' ? '' : dirname(path),
			children: [],
			size: 0,
			mtime: Date.now(),
			meta: {},
		};
	}

	private cloneInitialDirectory(node: MemoryFileSystemDirectory, path: string): MemoryDirectory {
		const directory = this.createDirectory(path === '/' ? '' : basename(path), path);
		directory.mtime = node.mtime;
		directory.meta = { ...node.meta };
		directory.children = node.children.map((child) => {
			const childPath = this.joinPath(path, child.name);
			if (child.kind === 'directory') return this.cloneInitialDirectory(child, childPath);
			const content = this.toBytes(child.content);
			return {
				...this.toStatFields(child, childPath),
				kind: 'file',
				content,
				size: content.byteLength,
			};
		});
		return directory;
	}

	private toStatFields(node: IFileStat, path: string): Omit<IFileStat, 'kind'> {
		return {
			name: basename(path),
			path,
			directory: dirname(path),
			size: node.size,
			mtime: node.mtime,
			meta: { ...node.meta },
		};
	}

	private normalizePath(path: string): string {
		if (!path || typeof path !== 'string') {
			throw new MemoryFileSystemError('Invalid path: path must be a non-empty string', 'EINVAL');
		}
		return normalize(path.startsWith('/') ? path : `/${path}`);
	}

	private joinPath(parent: string, name: string): string {
		return parent === '/' ? `/${name}` : `${parent}/${name}`;
	}

	private getNode(path: string): [MemoryNode | null, MemoryDirectory | null, string] {
		const normalized = this.normalizePath(path);
		if (normalized === '/') return [this.root, null, ''];

		const parts = normalized.split('/').filter(Boolean);
		const name = parts.pop()!;
		let parent = this.root;
		for (const part of parts) {
			const found = parent.children.find((child) => child.name === part);
			if (!found || found.kind !== 'directory') return [null, null, name];
			parent = found;
		}
		return [parent.children.find((child) => child.name === name) ?? null, parent, name];
	}

	private findOrCreateDirectory(path: string): MemoryDirectory {
		const normalized = this.normalizePath(path);
		if (normalized === '/') return this.root;

		let current = this.root;
		let currentPath = '';
		for (const part of normalized.split('/').filter(Boolean)) {
			currentPath = `${currentPath}/${part}`;
			const found = current.children.find((child) => child.name === part);
			if (!found) {
				const directory = this.createDirectory(part, currentPath);
				current.children.push(directory);
				current = directory;
			} else if (found.kind !== 'directory') {
				throw new MemoryFileSystemError(`Path conflict: ${currentPath} is a file`, 'ENOTDIR');
			} else {
				current = found;
			}
		}
		return current;
	}

	private sanitizeStat(node: MemoryNode): IFileStat {
		return {
			name: node.name,
			kind: node.kind,
			path: node.path,
			directory: node.directory,
			size: node.size,
			mtime: node.mtime,
			meta: { ...node.meta },
		};
	}

	private toBytes(data: MemoryFileSystemContent): Uint8Array<ArrayBuffer> {
		if (typeof data === 'string') return new TextEncoder().encode(data);
		if (data instanceof ArrayBuffer) return new Uint8Array(data.slice(0));

		const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
		const copy = new Uint8Array(bytes.byteLength);
		copy.set(bytes);
		return copy;
	}

	private async readWritableData(data: WritableData, signal?: AbortSignal): Promise<Uint8Array<ArrayBuffer>> {
		if (!this.isReadableStream(data)) return this.toBytes(data);

		const reader = data.getReader();
		const chunks: Uint8Array<ArrayBuffer>[] = [];
		let total = 0;
		const abortError = new MemoryFileSystemError('Operation aborted', 'ABORT_ERR');
		const onAbort = () => void reader.cancel(abortError).catch(() => undefined);
		signal?.addEventListener('abort', onAbort, { once: true });
		try {
			while (true) {
				this.throwIfAborted(signal);
				const { done, value } = await reader.read();
				if (done) break;
				if (this.isReadableStream(value)) {
					throw new MemoryFileSystemError('Nested readable streams are not valid file data', 'EINVAL');
				}
				const chunk = this.toBytes(value as MemoryFileSystemContent);
				chunks.push(chunk);
				total += chunk.byteLength;
			}
			this.throwIfAborted(signal);
			return this.concatBytes(chunks, total);
		} finally {
			signal?.removeEventListener('abort', onAbort);
			reader.releaseLock();
		}
	}

	private isReadableStream(value: unknown): value is ReadableStream {
		return typeof value === 'object' && value !== null && typeof (value as ReadableStream).getReader === 'function';
	}

	private concatBytes(chunks: readonly Uint8Array[], total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)) {
		const content = new Uint8Array(total);
		let offset = 0;
		for (const chunk of chunks) {
			content.set(chunk, offset);
			offset += chunk.byteLength;
		}
		return content;
	}

	private throwIfAborted(signal?: AbortSignal): void {
		if (signal?.aborted) throw new MemoryFileSystemError('Operation aborted', 'ABORT_ERR');
	}

	private validateDestination(
		path: string,
		rootErrorCode = 'EBUSY',
	): { normalized: string; parentPath: string; name: string } {
		const normalized = this.normalizePath(path);
		if (normalized === '/') throw new MemoryFileSystemError('Cannot replace the root directory', rootErrorCode);
		const name = basename(normalized);
		if (!name) throw new MemoryFileSystemError('Invalid path: filename cannot be empty', 'EINVAL');
		return { normalized, parentPath: dirname(normalized), name };
	}

	private assertNonOverlappingPaths(source: string, destination: string): void {
		if (
			source === '/' ||
			source === destination ||
			destination.startsWith(`${source}/`) ||
			source.startsWith(`${destination}/`)
		) {
			throw new MemoryFileSystemError('Source and destination paths must not overlap', 'EINVAL');
		}
	}

	private assertReplaceable(source: MemoryNode, destination: MemoryNode): void {
		if (source.kind === destination.kind) return;
		if (source.kind === 'file') {
			throw new MemoryFileSystemError(`Cannot overwrite a directory: ${destination.path}`, 'EISDIR');
		}
		throw new MemoryFileSystemError(`Cannot overwrite a file with a directory: ${destination.path}`, 'ENOTDIR');
	}

	private rebaseNode(node: MemoryNode, path: string): void {
		node.name = basename(path);
		node.path = path;
		node.directory = dirname(path);
		if (node.kind === 'directory') {
			for (const child of node.children) this.rebaseNode(child, this.joinPath(path, child.name));
		}
	}

	private cloneNode(node: MemoryNode, path: string, shallow: boolean): MemoryNode {
		if (node.kind === 'file') {
			return {
				...this.sanitizeStat(node),
				name: basename(path),
				path,
				directory: dirname(path),
				meta: { ...node.meta },
				kind: 'file',
				content: node.content.slice(),
			};
		}

		const clone: MemoryDirectory = {
			...this.sanitizeStat(node),
			name: basename(path),
			path,
			directory: dirname(path),
			meta: { ...node.meta },
			kind: 'directory',
			children: [],
		};
		if (!shallow) {
			clone.children = node.children.map((child) => this.cloneNode(child, this.joinPath(path, child.name), false));
		}
		return clone;
	}

	private revokeNodeUrls(node: MemoryNode): void {
		if (node.kind === 'directory') {
			for (const child of node.children) this.revokeNodeUrls(child);
			return;
		}
		const cache = this.urlCache.get(node);
		if (cache?.url && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
			URL.revokeObjectURL(cache.url);
		}
		this.urlCache.delete(node);
	}

	async stat(path: string, options?: StatOptions): Promise<IFileStat> {
		this.throwIfAborted(options?.signal);
		const [node] = this.getNode(path);
		if (!node) throw new MemoryFileSystemError(`File not found: ${path}`, 'ENOENT');
		return this.sanitizeStat(node);
	}

	async exists(path: string): Promise<boolean> {
		return !!this.getNode(path)[0];
	}

	async readdir(path: string, options?: ReaddirOptions): Promise<IFileStat[]> {
		this.throwIfAborted(options?.signal);
		const maxEntries = validateReaddirMaxEntries(options?.maxEntries);
		const [node] = this.getNode(path);
		if (!node) throw new MemoryFileSystemError(`Directory not found: ${path}`, 'ENOENT');
		if (node.kind !== 'directory') throw new MemoryFileSystemError(`Not a directory: ${path}`, 'ENOTDIR');
		assertReaddirEntryLimit(node.children.length, maxEntries, path);
		return node.children.map((child) => this.sanitizeStat(child));
	}

	async mkdir(path: string, options?: MkdirOptions): Promise<void> {
		this.throwIfAborted(options?.signal);
		const normalized = this.normalizePath(path);
		const [node] = this.getNode(normalized);
		if (node) {
			if (node.kind === 'file') throw new MemoryFileSystemError(`File already exists: ${path}`, 'EEXIST');
			return;
		}

		if (options?.recursive) {
			this.findOrCreateDirectory(normalized);
			return;
		}

		const parentPath = dirname(normalized);
		const [parent] = this.getNode(parentPath);
		if (!parent) throw new MemoryFileSystemError(`Parent directory does not exist: ${parentPath}`, 'ENOENT');
		if (parent.kind !== 'directory')
			throw new MemoryFileSystemError(`Parent is not a directory: ${parentPath}`, 'ENOTDIR');
		parent.children.push(this.createDirectory(basename(normalized), normalized));
	}

	readFile(path: string, options?: ReadFileOptions & { encoding: 'text' }): Promise<string>;
	readFile(path: string, options?: ReadFileOptions): Promise<Uint8Array>;
	async readFile(path: string, options?: ReadFileOptions): Promise<string | Uint8Array> {
		this.throwIfAborted(options?.signal);
		const [node] = this.getNode(path);
		if (!node) throw new MemoryFileSystemError(`File not found: ${path}`, 'ENOENT');
		if (node.kind !== 'file') throw new MemoryFileSystemError(`Is a directory: ${path}`, 'EISDIR');

		const maxBytes = options?.maxBytes === undefined ? node.content.byteLength : Math.max(0, options.maxBytes);
		const content = node.content.slice(0, maxBytes);
		options?.onDownloadProgress?.({ loaded: content.byteLength, total: node.content.byteLength });
		return options?.encoding === 'text' ? new TextDecoder().decode(content) : content;
	}

	async writeFile(path: string, data: WritableData, options: WriteFileOptions = {}): Promise<void> {
		this.throwIfAborted(options.signal);
		if (data === null || data === undefined) {
			throw new MemoryFileSystemError('Invalid data: data cannot be null or undefined', 'EINVAL');
		}

		const { normalized, parentPath, name } = this.validateDestination(path, 'EINVAL');
		const content = await this.readWritableData(data, options.signal);
		const parent = this.findOrCreateDirectory(parentPath);
		const existing = parent.children.find((child) => child.name === name);
		if (existing) {
			if (options.overwrite === false) {
				throw new MemoryFileSystemError(`File already exists: ${path}`, 'EEXIST');
			}
			if (existing.kind === 'directory') {
				throw new MemoryFileSystemError(`Cannot overwrite a directory: ${path}`, 'EISDIR');
			}
			this.revokeNodeUrls(existing);
			existing.content = content;
			existing.size = content.byteLength;
			existing.mtime = Date.now();
		} else {
			parent.children.push({
				name,
				kind: 'file',
				path: normalized,
				directory: parentPath,
				content,
				size: content.byteLength,
				mtime: Date.now(),
				meta: {},
			});
		}
		options.onUploadProgress?.({ loaded: content.byteLength, total: content.byteLength });
	}

	async rm(path: string, options: RmOptions = {}): Promise<void> {
		this.throwIfAborted(options.signal);
		const normalized = this.normalizePath(path);
		if (normalized === '/') throw new MemoryFileSystemError('Cannot remove the root directory', 'EBUSY');

		const [node, parent] = this.getNode(normalized);
		if (!node || !parent) {
			if (options.force) return;
			throw new MemoryFileSystemError(`File not found: ${path}`, 'ENOENT');
		}
		if (node.kind === 'directory' && node.children.length > 0 && !options.recursive) {
			throw new MemoryFileSystemError(`Directory not empty: ${path}`, 'ENOTEMPTY');
		}
		this.revokeNodeUrls(node);
		parent.children.splice(parent.children.indexOf(node), 1);
	}

	async rename(oldPath: string, newPath: string, options: RenameOptions = {}): Promise<void> {
		this.throwIfAborted(options.signal);
		const sourcePath = this.normalizePath(oldPath);
		if (sourcePath === '/') throw new MemoryFileSystemError('Cannot move the root directory', 'EBUSY');
		const { normalized: destinationPath, parentPath, name } = this.validateDestination(newPath);
		this.assertNonOverlappingPaths(sourcePath, destinationPath);

		const [source, sourceParent] = this.getNode(sourcePath);
		if (!source || !sourceParent) throw new MemoryFileSystemError(`Source not found: ${oldPath}`, 'ENOENT');

		const destinationParent = this.findOrCreateDirectory(parentPath);
		const destination = destinationParent.children.find((child) => child.name === name);
		if (destination) {
			if (!options.overwrite) throw new MemoryFileSystemError(`Destination exists: ${newPath}`, 'EEXIST');
			this.assertReplaceable(source, destination);
		}

		if (destination) {
			this.revokeNodeUrls(destination);
			destinationParent.children.splice(destinationParent.children.indexOf(destination), 1);
		}
		sourceParent.children.splice(sourceParent.children.indexOf(source), 1);
		this.rebaseNode(source, destinationPath);
		source.mtime = Date.now();
		destinationParent.children.push(source);
	}

	async copy(srcPath: string, destPath: string, options: CopyOptions = {}): Promise<void> {
		this.throwIfAborted(options.signal);
		const sourcePath = this.normalizePath(srcPath);
		const { normalized: destinationPath, parentPath, name } = this.validateDestination(destPath);
		this.assertNonOverlappingPaths(sourcePath, destinationPath);

		const [source] = this.getNode(sourcePath);
		if (!source) throw new MemoryFileSystemError(`Source not found: ${srcPath}`, 'ENOENT');

		const destinationParent = this.findOrCreateDirectory(parentPath);
		const destination = destinationParent.children.find((child) => child.name === name);
		if (destination) {
			if (!options.overwrite) throw new MemoryFileSystemError(`Destination exists: ${destPath}`, 'EEXIST');
			this.assertReplaceable(source, destination);
		}

		const clone = this.cloneNode(source, destinationPath, options.shallow ?? false);
		if (destination) {
			this.revokeNodeUrls(destination);
			destinationParent.children[destinationParent.children.indexOf(destination)] = clone;
		} else {
			destinationParent.children.push(clone);
		}
	}

	getUrl(file: IFileStat | string): string | undefined {
		if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return undefined;
		const [node] = this.getNode(typeof file === 'string' ? file : file.path);
		if (!node || node.kind !== 'file') return undefined;

		let cache = this.urlCache.get(node);
		if (!cache) {
			cache = {};
			this.urlCache.set(node, cache);
		}
		if (!cache.url) {
			const mime = findMimeType(node.name) || 'application/octet-stream';
			cache.url = URL.createObjectURL(new Blob([node.content], { type: mime }));
		}
		return cache.url;
	}

	createReadableStream(path: string, options: CreateReadStreamOptions = {}): ReadableStream<Uint8Array> {
		this.throwIfAborted(options.signal);
		const [node] = this.getNode(path);
		if (!node) throw new MemoryFileSystemError(`File not found: ${path}`, 'ENOENT');
		if (node.kind !== 'file') throw new MemoryFileSystemError(`Is a directory: ${path}`, 'EISDIR');

		const start = Math.max(0, options.range?.start ?? 0);
		const inclusiveEnd = options.range?.end ?? node.content.byteLength - 1;
		const data = node.content.slice(start, Math.max(start, inclusiveEnd + 1));
		return new ReadableStream<Uint8Array>({
			start: (controller) => {
				if (options.signal?.aborted) {
					controller.error(new MemoryFileSystemError('Operation aborted', 'ABORT_ERR'));
					return;
				}
				controller.enqueue(data);
				controller.close();
			},
		});
	}

	createWritableStream(path: string, options: CreateWriteStreamOptions = {}): WritableStream<MemoryFileSystemContent> {
		this.throwIfAborted(options.signal);
		const chunks: Uint8Array<ArrayBuffer>[] = [];
		return new WritableStream<MemoryFileSystemContent>({
			write: (chunk) => {
				this.throwIfAborted(options.signal);
				chunks.push(this.toBytes(chunk));
			},
			close: async () => {
				this.throwIfAborted(options.signal);
				await this.writeFile(path, this.concatBytes(chunks), options);
			},
			abort: () => {
				chunks.length = 0;
			},
		});
	}
}
