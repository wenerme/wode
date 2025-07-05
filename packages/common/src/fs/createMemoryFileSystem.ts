import { basename, dirname, normalize } from 'pathe';
import type {
	CopyOptions,
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

class MemFS implements IFileSystem {
	private readonly root: MemoryDirectory;

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
		const normalized = normalize(path);
		if (normalized === '/') {
			return [this.root, null, ''];
		}

		const parts = normalized.split('/').filter((p) => p);
		const finalName = parts.pop()!;

		let current: MemoryDirectory = this.root;
		for (const part of parts) {
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
		const normalized = normalize(path);
		if (normalized === '/') return this.root;

		const parts = normalized.split('/').filter((p) => p);
		let current: MemoryDirectory = this.root;
		let currentPath = '';

		for (const part of parts) {
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

	async stat(path: string): Promise<IFileStat> {
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

	async readdir(path: string): Promise<IFileStat[]> {
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
	readFile(path: string, options?: ReadFileOptions & { encoding: 'binary' }): Promise<Buffer | ArrayBuffer>;
	async readFile(path: string, options?: ReadFileOptions): Promise<string | Buffer | ArrayBuffer> {
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
		const { overwrite = true } = options;
		const parentPath = dirname(path);
		const filename = basename(path);

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

	createReadStream(path: string): never {
		throw new Error('Streaming read is not implemented in MemFS.');
	}

	createWriteStream(path: string): never {
		throw new Error('Streaming write is not implemented in MemFS.');
	}
}
