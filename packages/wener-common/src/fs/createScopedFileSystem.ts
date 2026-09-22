import { normalize } from 'pathe';
import { FileSystemError } from './FileSystemError';
import type {
	CopyOptions,
	CreateReadStreamOptions,
	CreateWriteStreamOptions,
	FileSystemOperationOptions,
	FileSystemWritableData,
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
import type { FileUrlOptions } from './types';

export type ScopedFileSystem = IFileSystem & {
	readonly root: string;
};

/** Map an IFileSystem directory to a logical root that cannot escape through path traversal. */
export function createScopedFileSystem(fs: IFileSystem, root: string): ScopedFileSystem {
	return new ScopedFileSystemImplementation(fs, root);
}

class ScopedFileSystemImplementation implements ScopedFileSystem {
	readonly #fs: IFileSystem;
	readonly root: string;
	readonly getUrl?: (path: IFileStat | string, options?: FileUrlOptions) => string | undefined;
	readonly createReadableStream?: (path: string, options?: CreateReadStreamOptions) => ReadableStream;
	readonly createWritableStream?: (path: string, options?: CreateWriteStreamOptions) => WritableStream;

	constructor(fs: IFileSystem, root: string) {
		this.#fs = fs;
		this.root = normalizeScopedPath(root);
		if (fs.getUrl) {
			this.getUrl = (path, options) => fs.getUrl?.(this.resolve(typeof path === 'string' ? path : path.path), options);
		}
		if (typeof fs.createReadableStream === 'function') {
			this.createReadableStream = (path, options) => fs.createReadableStream!(this.resolve(path), options);
		}
		if (typeof fs.createWritableStream === 'function') {
			this.createWritableStream = (path, options) => fs.createWritableStream!(this.resolve(path), options);
		}
	}

	async readdir(path: string, options?: ReaddirOptions): Promise<IFileStat[]> {
		return (await this.#fs.readdir(this.resolve(path), options)).map((stat) => this.toScopedStat(stat));
	}

	async stat(path: string, options?: StatOptions): Promise<IFileStat> {
		return this.toScopedStat(await this.#fs.stat(this.resolve(path), options));
	}

	mkdir(path: string, options?: MkdirOptions): Promise<void> {
		return this.#fs.mkdir(this.resolve(path), options);
	}

	readFile(path: string, options: ReadFileOptions & { encoding: 'text' }): Promise<string>;
	readFile(path: string, options?: ReadFileOptions): Promise<Uint8Array>;
	readFile(path: string, options?: ReadFileOptions): Promise<string | Uint8Array> {
		if (options?.encoding === 'text') return this.#fs.readFile(this.resolve(path), options);
		return this.#fs.readFile(this.resolve(path), options);
	}

	writeFile(path: string, data: FileSystemWritableData, options?: WriteFileOptions): Promise<void> {
		return this.#fs.writeFile(this.resolve(path), data, options);
	}

	rm(path: string, options?: RmOptions): Promise<void> {
		return this.#fs.rm(this.resolve(path), options);
	}

	rename(oldPath: string, newPath: string, options?: RenameOptions): Promise<void> {
		return this.#fs.rename(this.resolve(oldPath), this.resolve(newPath), options);
	}

	exists(path: string, options?: FileSystemOperationOptions): Promise<boolean> {
		return this.#fs.exists(this.resolve(path), options);
	}

	copy(source: string, destination: string, options?: CopyOptions): Promise<void> {
		return this.#fs.copy(this.resolve(source), this.resolve(destination), options);
	}

	private resolve(path: string): string {
		const scopedPath = normalizeScopedPath(path);
		return this.root === '/' ? scopedPath : `${this.root}${scopedPath}`;
	}

	private toScopedStat(stat: IFileStat): IFileStat {
		const path = this.stripRoot(stat.path);
		return {
			...stat,
			path,
			directory: path === '/' || !stat.directory ? '' : this.stripRoot(stat.directory),
			meta: { ...stat.meta },
		};
	}

	private stripRoot(path: string): string {
		const absolute = normalizeScopedPath(path);
		if (this.root === '/') return absolute;
		if (absolute === this.root) return '/';
		if (absolute.startsWith(`${this.root}/`)) return absolute.slice(this.root.length);
		throw new FileSystemError(`文件系统返回了scope之外的路径：${absolute}`, 'EIO');
	}
}

function normalizeScopedPath(path: string): string {
	if (typeof path !== 'string' || !path.trim()) throw new FileSystemError('文件系统路径不能为空', 'EINVAL');
	const rawParts = path.replaceAll('\\', '/').split('/');
	let depth = 0;
	for (const part of rawParts) {
		if (!part || part === '.') continue;
		if (part === '..') {
			if (depth === 0) throw new FileSystemError('路径不能离开文件系统根目录', 'EINVAL');
			depth -= 1;
			continue;
		}
		depth += 1;
	}
	const value = normalize(path.startsWith('/') ? path : `/${path}`);
	return value === '.' ? '/' : value;
}
