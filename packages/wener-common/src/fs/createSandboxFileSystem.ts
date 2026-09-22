import { join, normalize, relative, sep } from 'pathe';
import type {
	CopyOptions,
	CreateReadStreamOptions,
	CreateWriteStreamOptions,
	FileSystemOperationOptions,
	FileSystemWritableData,
	IFileStat,
	IFileSystem,
	ReadFileOptions,
	WriteFileOptions,
} from './IFileSystem';
import type { FileUrlOptions } from './types';

class SandboxSecurityError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SandboxSecurityError';
	}
}

export function createSandboxFileSystem(
	fs: IFileSystem,
	basePath: string,
): IFileSystem & {
	fs: IFileSystem;
	basePath: string;
} {
	return new SandboxFS(fs, basePath);
}

class SandboxFS implements IFileSystem {
	readonly fs: IFileSystem;
	readonly basePath: string;
	readonly getUrl?: (path: IFileStat | string, options?: FileUrlOptions) => string | undefined;
	readonly createReadableStream?: (path: string, options?: CreateReadStreamOptions) => ReadableStream;
	readonly createWritableStream?: (path: string, options?: CreateWriteStreamOptions) => WritableStream;

	constructor(fs: IFileSystem, basePath: string) {
		this.fs = fs;
		this.basePath = normalize(basePath);
		if (fs.getUrl) {
			this.getUrl = (file, options) =>
				fs.getUrl?.(this._resolvePath(typeof file === 'string' ? file : file.path), options);
		}
		if (typeof fs.createReadableStream === 'function') {
			this.createReadableStream = (path, options) => fs.createReadableStream!(this._resolvePath(path), options);
		}
		if (typeof fs.createWritableStream === 'function') {
			this.createWritableStream = (path, options) => fs.createWritableStream!(this._resolvePath(path), options);
		}
	}

	private _resolvePath(userPath: string): string {
		const fullPath = normalize(join(this.basePath, userPath));
		const rel = relative(this.basePath, fullPath);
		if (rel.startsWith('..') || rel === '..' || rel.startsWith(`..${sep}`)) {
			throw new SandboxSecurityError(`Path traversal attempt detected: ${userPath}`);
		}
		return fullPath;
	}

	private _stripPath(fullPath: string): string {
		const relPath = relative(this.basePath, normalize(fullPath));
		return `/${relPath.split(sep).filter(Boolean).join('/')}`;
	}

	private _processStat(stat: IFileStat): IFileStat {
		const path = this._stripPath(stat.path);
		return {
			...stat,
			path,
			directory: stat.directory ? this._stripPath(stat.directory) : '',
			meta: { ...stat.meta },
		};
	}

	async stat(path: string, options?: FileSystemOperationOptions): Promise<IFileStat> {
		return this._processStat(await this.fs.stat(this._resolvePath(path), options));
	}

	async readdir(path: string, options?: Parameters<IFileSystem['readdir']>[1]): Promise<IFileStat[]> {
		const results = await this.fs.readdir(this._resolvePath(path), options);
		return results.map((stat) => this._processStat(stat));
	}

	async exists(path: string, options?: FileSystemOperationOptions): Promise<boolean> {
		try {
			return await this.fs.exists(this._resolvePath(path), options);
		} catch (error) {
			if (error instanceof SandboxSecurityError) return false;
			throw error;
		}
	}

	mkdir(path: string, options?: Parameters<IFileSystem['mkdir']>[1]): Promise<void> {
		return this.fs.mkdir(this._resolvePath(path), options);
	}

	readFile(path: string, options: ReadFileOptions & { encoding: 'text' }): Promise<string>;
	readFile(path: string, options?: ReadFileOptions): Promise<Uint8Array>;
	readFile(path: string, options?: ReadFileOptions): Promise<string | Uint8Array> {
		if (options?.encoding === 'text') return this.fs.readFile(this._resolvePath(path), options);
		return this.fs.readFile(this._resolvePath(path), options);
	}

	writeFile(path: string, data: FileSystemWritableData, options?: WriteFileOptions): Promise<void> {
		return this.fs.writeFile(this._resolvePath(path), data, options);
	}

	rm(path: string, options?: Parameters<IFileSystem['rm']>[1]): Promise<void> {
		return this.fs.rm(this._resolvePath(path), options);
	}

	rename(oldPath: string, newPath: string, options?: Parameters<IFileSystem['rename']>[2]): Promise<void> {
		return this.fs.rename(this._resolvePath(oldPath), this._resolvePath(newPath), options);
	}

	copy(source: string, destination: string, options?: CopyOptions): Promise<void> {
		return this.fs.copy(this._resolvePath(source), this._resolvePath(destination), options);
	}
}
