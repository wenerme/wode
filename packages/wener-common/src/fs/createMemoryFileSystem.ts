import type { Readable, Writable } from 'node:stream';
import { computeIfAbsent } from '@wener/utils';
import { basename, dirname, normalize } from 'pathe';
import { findMimeType } from './findMimeType';
import type {
	CopyOptions,
	CreateReadStreamOptions,
	CreateWriteStreamOptions,
	IFileStat,
	IFileSystem,
	MkdirOptions,
	ReadFileOptions,
	RenameOptions,
	RmOptions,
	WriteFileOptions,
} from './IFileSystem';

type MemoryNode = MemoryFile | MemoryDirectory;

type MemoryFile = IFileStat & {
	kind: 'file';
	content: string | Buffer;
};

type MemoryDirectory = IFileStat & {
	kind: 'directory';
	children: MemoryNode[];
};

export function createMemoryFileSystem(
	options: {
		root?: MemoryDirectory;
	} = {},
): IFileSystem {
	return new MemFS(options);
}

class MemoryFileSystemError extends Error {
	code?: string;

	constructor(message: string, code?: string) {
		super(message);
		this.name = 'MemoryFileSystemError';
		this.code = code;
	}
}

type Cache = {
	url?: string;
};

class MemFS implements IFileSystem {
	private readonly root: MemoryDirectory;

	private readonly cache = new WeakMap<MemoryNode, Cache>();

	constructor({
		root,
	}: {
		root?: MemoryDirectory;
	} = {}) {
		this.root = root || {
			name: '',
			kind: 'directory',
			path: '/',
			directory: '',
			children: [],
			size: 0,
			mtime: Date.now(),
			meta: {},
		};
	}

	/**
	 * 核心辅助方法：通过路径查找节点
	 * @returns A tuple: [foundNode, parentNode, finalName]
	 */
	private _getNodeByPath(path: string): [MemoryNode | null, MemoryDirectory | null, string] {
		if (!path || typeof path !== 'string') {
			throw new MemoryFileSystemError('Invalid path: path must be a non-empty string', 'EINVAL');
		}

		const normalized = normalize(path);
		if (normalized === '/') {
			// the parent of root is itself
			return [this.root, this.root, ''];
		}

		const parts = normalized.split('/').filter((p) => p);
		if (parts.length === 0) {
			return [this.root, this.root, ''];
		}

		const finalName = parts.pop()!;

		let current: MemoryDirectory = this.root;
		for (const part of parts) {
			if (!part) continue; // skip empty parts

			const found = current.children.find((child) => child.name === part);
			if (!found || found.kind !== 'directory') {
				return [null, null, finalName];
			}
			current = found;
		}

		const node = current.children.find((child) => child.name === finalName) ?? null;
		return [node, current, finalName];
	}

	/**
	 * 核心辅助方法：查找或创建目录
	 */
	private _findOrCreateDirectory(path: string): MemoryDirectory {
		if (!path || typeof path !== 'string') {
			throw new MemoryFileSystemError('Invalid path: path must be a non-empty string', 'EINVAL');
		}

		const normalized = normalize(path);
		if (normalized === '/') return this.root;

		const parts = normalized.split('/').filter((p) => p);
		if (parts.length === 0) return this.root;

		let current: MemoryDirectory = this.root;
		let currentPath = '';

		for (const part of parts) {
			if (!part) continue; // skip empty parts

			currentPath = `${currentPath}/${part}`;
			let found = current.children.find((child) => child.name === part);
			if (!found) {
				const now = Date.now();
				const newDir: MemoryDirectory = {
					name: part,
					kind: 'directory',
					path: currentPath,
					directory: dirname(currentPath),
					children: [],
					size: 0,
					mtime: now,
					meta: {},
				};
				current.children.push(newDir);
				current = newDir;
			} else if (found.kind !== 'directory') {
				throw new MemoryFileSystemError(`Path conflict: ${currentPath} is a file`, 'ENOTDIR');
			} else {
				current = found;
			}
		}
		return current;
	}

	async stat(path: string, options?: { signal?: AbortSignal }): Promise<IFileStat> {
		if (options?.signal?.aborted) {
			throw new MemoryFileSystemError('Operation aborted', 'ABORT_ERR');
		}

		const [node] = this._getNodeByPath(path);
		if (!node) {
			throw new MemoryFileSystemError(`File not found: ${path}`, 'ENOENT');
		}
		return { ...node };
	}

	async exists(path: string): Promise<boolean> {
		const [node] = this._getNodeByPath(path);
		return !!node;
	}

	async readdir(path: string, options?: { signal?: AbortSignal }): Promise<IFileStat[]> {
		if (options?.signal?.aborted) {
			throw new MemoryFileSystemError('Operation aborted', 'ABORT_ERR');
		}

		const [node] = this._getNodeByPath(path);
		if (!node) {
			throw new MemoryFileSystemError(`Directory not found: ${path}`, 'ENOENT');
		}
		if (node.kind !== 'directory') {
			throw new MemoryFileSystemError(`Not a directory: ${path}`, 'ENOTDIR');
		}
		// 返回副本
		return node.children.map((child) => ({ ...child }));
	}

	async mkdir(path: string, options?: MkdirOptions): Promise<void> {
		if (options?.signal?.aborted) {
			throw new MemoryFileSystemError('Operation aborted', 'ABORT_ERR');
		}

		const [node] = this._getNodeByPath(path);
		if (node) {
			if (node.kind === 'file') throw new MemoryFileSystemError(`File already exists: ${path}`, 'EEXIST');
			return; // 目录已存在
		}

		if (options?.recursive) {
			this._findOrCreateDirectory(path);
		} else {
			const parentPath = dirname(path);
			const [, parent] = this._getNodeByPath(parentPath);
			if (!parent) {
				throw new MemoryFileSystemError(`Parent directory does not exist: ${parentPath}`, 'ENOENT');
			}
			this._findOrCreateDirectory(path);
		}
	}

	readFile(path: string, options?: ReadFileOptions & { encoding: 'text' }): Promise<string>;
	readFile(path: string, options?: ReadFileOptions): Promise<Uint8Array>;
	async readFile(path: string, options?: ReadFileOptions): Promise<string | Uint8Array> {
		if (options?.signal?.aborted) {
			throw new MemoryFileSystemError('Operation aborted', 'ABORT_ERR');
		}

		const [node] = this._getNodeByPath(path);
		if (!node) {
			throw new MemoryFileSystemError(`File not found: ${path}`, 'ENOENT');
		}
		if (node.kind !== 'file') {
			throw new MemoryFileSystemError(`Is a directory: ${path}`, 'EISDIR');
		}

		const content = 'content' in node ? node.content : '';
		return options?.encoding === 'text' ? content.toString() : Buffer.from(content);
	}

	async writeFile(path: string, data: string | Buffer, options: WriteFileOptions = {}): Promise<void> {
		if (options?.signal?.aborted) {
			throw new MemoryFileSystemError('Operation aborted', 'ABORT_ERR');
		}

		if (!path || typeof path !== 'string') {
			throw new MemoryFileSystemError('Invalid path: path must be a non-empty string', 'EINVAL');
		}

		if (data === null || data === undefined) {
			throw new MemoryFileSystemError('Invalid data: data cannot be null or undefined', 'EINVAL');
		}

		const { overwrite = true } = options;
		const parentPath = dirname(path);
		const filename = basename(path);

		if (!filename) {
			throw new MemoryFileSystemError('Invalid path: filename cannot be empty', 'EINVAL');
		}

		const parent = this._findOrCreateDirectory(parentPath);
		const nodeIndex = parent.children.findIndex((child) => child.name === filename);
		const existingNode = nodeIndex !== -1 ? parent.children[nodeIndex] : null;

		if (existingNode) {
			if (!overwrite) throw new MemoryFileSystemError(`File already exists: ${path}`, 'EEXIST');
			if (existingNode.kind === 'directory')
				throw new MemoryFileSystemError(`Cannot overwrite a directory: ${path}`, 'EISDIR');

			// 更新文件
			existingNode.content = data;
			existingNode.size = data.length;
			existingNode.mtime = Date.now();
		} else {
			// 创建新文件
			const now = Date.now();
			const newFile: MemoryFile = {
				name: filename,
				kind: 'file',
				path: path,
				directory: parentPath,
				content: data,
				size: data.length,
				mtime: now,
				meta: {},
			};
			parent.children.push(newFile);
		}
	}

	async rm(path: string, options: RmOptions = {}): Promise<void> {
		if (options?.signal?.aborted) {
			throw new MemoryFileSystemError('Operation aborted', 'ABORT_ERR');
		}

		const { recursive = false, force = false } = options;
		const [node, parent] = this._getNodeByPath(path);

		if (!node) {
			if (force) return;
			throw new MemoryFileSystemError(`File not found: ${path}`, 'ENOENT');
		}

		if (node.kind === 'directory' && node.children.length > 0 && !recursive) {
			throw new MemoryFileSystemError(`Directory not empty: ${path}`, 'ENOTEMPTY');
		}

		if (parent) {
			const index = parent.children.findIndex((child) => child.name === node.name);
			if (index !== -1) {
				parent.children.splice(index, 1);
			}
		}
	}

	async rename(oldPath: string, newPath: string, options?: RenameOptions): Promise<void> {
		if (options?.signal?.aborted) {
			throw new MemoryFileSystemError('Operation aborted', 'ABORT_ERR');
		}

		const [oldNode, oldParent, oldName] = this._getNodeByPath(oldPath);
		if (!oldNode || !oldParent) throw new MemoryFileSystemError(`Source not found: ${oldPath}`, 'ENOENT');

		const oldNodeIndex = oldParent.children.findIndex((c) => c.name === oldName);
		oldParent.children.splice(oldNodeIndex, 1);

		const newParentPath = dirname(newPath);
		const newName = basename(newPath);
		const newParent = this._findOrCreateDirectory(newParentPath);

		const existingNodeIndex = newParent.children.findIndex((c) => c.name === newName);
		if (existingNodeIndex !== -1) {
			if (!options?.overwrite) throw new MemoryFileSystemError(`Destination exists: ${newPath}`, 'EEXIST');
			newParent.children.splice(existingNodeIndex, 1);
		}

		oldNode.name = newName;
		oldNode.path = newPath;
		oldNode.directory = newParentPath;
		oldNode.mtime = Date.now();
		newParent.children.push(oldNode);
	}

	async copy(srcPath: string, destPath: string, options?: CopyOptions): Promise<void> {
		if (options?.signal?.aborted) {
			throw new MemoryFileSystemError('Operation aborted', 'ABORT_ERR');
		}

		const [srcNode] = this._getNodeByPath(srcPath);
		if (!srcNode) throw new MemoryFileSystemError(`Source not found: ${srcPath}`, 'ENOENT');

		const deepClone = <T extends MemoryNode>(node: T): T => JSON.parse(JSON.stringify(node));
		const newNode = deepClone(srcNode);

		const newParentPath = dirname(destPath);
		const newName = basename(destPath);
		const newParent = this._findOrCreateDirectory(newParentPath);

		newNode.name = newName;
		newNode.path = destPath;
		newNode.directory = newParentPath;

		const existingNodeIndex = newParent.children.findIndex((c) => c.name === newName);
		if (existingNodeIndex !== -1) {
			if (!options?.overwrite) throw new MemoryFileSystemError(`Destination exists: ${destPath}`, 'EEXIST');
			newParent.children[existingNodeIndex] = newNode;
		} else {
			newParent.children.push(newNode);
		}
	}

	createReadStream(path: string, options?: CreateReadStreamOptions): Readable {
		const { signal, range } = options || {};

		if (signal?.aborted) {
			throw new MemoryFileSystemError('Operation aborted', 'ABORT_ERR');
		}

		const [node] = this._getNodeByPath(path);
		if (!node) {
			throw new MemoryFileSystemError(`File not found: ${path}`, 'ENOENT');
		}
		if (node.kind !== 'file') {
			throw new MemoryFileSystemError(`Is a directory: ${path}`, 'EISDIR');
		}

		const content = Buffer.from('content' in node ? node.content : '');
		const { Readable } = require('node:stream');

		let data = content;
		if (range) {
			const start = range.start || 0;
			const end = range.end || content.length - 1;
			data = content.subarray(start, end + 1);
		}

		const stream = Readable.from([data]);

		if (signal) {
			signal.addEventListener('abort', () => {
				stream.destroy(new MemoryFileSystemError('Operation aborted', 'ABORT_ERR'));
			});
		}

		return stream;
	}

	createWriteStream(path: string, options?: CreateWriteStreamOptions): Writable {
		const { signal, overwrite = true } = options || {};

		if (signal?.aborted) {
			throw new MemoryFileSystemError('Operation aborted', 'ABORT_ERR');
		}

		const { Writable } = require('node:stream');
		const chunks: Buffer[] = [];

		const self = this;
		const stream = new Writable({
			write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
				if (signal?.aborted) {
					callback(new MemoryFileSystemError('Operation aborted', 'ABORT_ERR'));
					return;
				}
				chunks.push(chunk);
				callback();
			},
			final(callback: (error?: Error | null) => void) {
				if (signal?.aborted) {
					callback(new MemoryFileSystemError('Operation aborted', 'ABORT_ERR'));
					return;
				}

				try {
					const content = Buffer.concat(chunks);
					const parentPath = dirname(path);
					const filename = basename(path);
					const parent = self._findOrCreateDirectory(parentPath);

					const nodeIndex = parent.children.findIndex((child) => child.name === filename);
					const existingNode = nodeIndex !== -1 ? parent.children[nodeIndex] : null;

					if (existingNode) {
						if (!overwrite) {
							callback(new MemoryFileSystemError(`File already exists: ${path}`, 'EEXIST'));
							return;
						}
						if (existingNode.kind === 'directory') {
							callback(new MemoryFileSystemError(`Cannot overwrite a directory: ${path}`, 'EISDIR'));
							return;
						}

						existingNode.content = content;
						existingNode.size = content.length;
						existingNode.mtime = Date.now();
					} else {
						const now = Date.now();
						const newFile: MemoryFile = {
							name: filename,
							kind: 'file',
							path: path,
							directory: parentPath,
							content: content,
							size: content.length,
							mtime: now,
							meta: {},
						};
						parent.children.push(newFile);
					}

					callback();
				} catch (error) {
					callback(error instanceof Error ? error : new MemoryFileSystemError('Unknown error', 'UNKNOWN'));
				}
			},
		});

		if (signal) {
			signal.addEventListener('abort', () => {
				stream.destroy(new MemoryFileSystemError('Operation aborted', 'ABORT_ERR'));
			});
		}

		return stream;
	}

	getUrl(file: IFileStat | string) {
		let node: IFileStat | null;
		if (typeof file === 'string') {
			[node] = this._getNodeByPath(file);
		} else {
			node = file;
		}
		let mf = node as MemoryFile;
		if (mf.content) {
			let c = computeIfAbsent(this.cache, mf, () => ({}) as Cache);
			if (!c.url) {
				let mime = findMimeType(mf.name) || 'application/octet-stream';
				c.url = URL.createObjectURL(new Blob([mf.content], { type: mime }));
			}

			return c.url;
		}
		return;
	}

	createReadableStream(path: string, options?: CreateReadStreamOptions): ReadableStream {
		const { signal, range } = options || {};

		if (signal?.aborted) {
			throw new MemoryFileSystemError('Operation aborted', 'ABORT_ERR');
		}

		const [node] = this._getNodeByPath(path);
		if (!node) {
			throw new MemoryFileSystemError(`File not found: ${path}`, 'ENOENT');
		}
		if (node.kind !== 'file') {
			throw new MemoryFileSystemError(`Is a directory: ${path}`, 'EISDIR');
		}

		const content = Buffer.from('content' in node ? node.content : '');

		let data = content;
		if (range) {
			const start = range.start || 0;
			const end = range.end || content.length - 1;
			data = content.subarray(start, end + 1);
		}

		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(data);
				controller.close();
			},
		});

		if (signal) {
			signal.addEventListener('abort', () => {
				stream.cancel(new MemoryFileSystemError('Operation aborted', 'ABORT_ERR'));
			});
		}

		return stream;
	}

	createWritableStream(path: string, options?: CreateWriteStreamOptions): WritableStream {
		const { signal, overwrite = true } = options || {};

		if (signal?.aborted) {
			throw new MemoryFileSystemError('Operation aborted', 'ABORT_ERR');
		}

		const chunks: Buffer[] = [];

		const self = this;
		const stream = new WritableStream({
			write(chunk: Buffer) {
				if (signal?.aborted) {
					throw new MemoryFileSystemError('Operation aborted', 'ABORT_ERR');
				}
				chunks.push(chunk);
			},
			close() {
				if (signal?.aborted) {
					throw new MemoryFileSystemError('Operation aborted', 'ABORT_ERR');
				}

				const content = Buffer.concat(chunks);
				const parentPath = dirname(path);
				const filename = basename(path);
				const parent = self._findOrCreateDirectory(parentPath);

				const nodeIndex = parent.children.findIndex((child) => child.name === filename);
				const existingNode = nodeIndex !== -1 ? parent.children[nodeIndex] : null;

				if (existingNode) {
					if (!overwrite) {
						throw new MemoryFileSystemError(`File already exists: ${path}`, 'EEXIST');
					}
					if (existingNode.kind === 'directory') {
						throw new MemoryFileSystemError(`Cannot overwrite a directory: ${path}`, 'EISDIR');
					}

					existingNode.content = content;
					existingNode.size = content.length;
					existingNode.mtime = Date.now();
				} else {
					const now = Date.now();
					const newFile: MemoryFile = {
						name: filename,
						kind: 'file',
						path: path,
						directory: parentPath,
						content: content,
						size: content.length,
						mtime: now,
						meta: {},
					};
					parent.children.push(newFile);
				}
			},
		});

		if (signal) {
			signal.addEventListener('abort', () => {
				stream.abort(new MemoryFileSystemError('Operation aborted', 'ABORT_ERR'));
			});
		}

		return stream;
	}
}
