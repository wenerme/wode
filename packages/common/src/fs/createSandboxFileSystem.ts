import { join, normalize, relative, sep } from 'pathe';
import type { IFileStat, IFileSystem, ReadFileOptions } from './IFileSystem';
import { getPath } from './utils';

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
	fs: IFileSystem;
	basePath: string;

	constructor(fs: IFileSystem, basePath: string) {
		this.fs = fs;
		this.basePath = normalize(basePath);
	}

	private _resolvePath(userPath: string): string {
		const fullPath = join(this.basePath, userPath);

		const normalizedFullPath = normalize(fullPath);

		const rel = relative(this.basePath, normalizedFullPath);
		if (rel.startsWith('..') || rel === '..') {
			throw new SandboxSecurityError(`Path traversal attempt detected: ${userPath}`);
		}
		return normalizedFullPath;
	}

	private _stripPath(fullPath: string): string {
		const relPath = relative(this.basePath, fullPath);
		// 保证返回的是一个以 '/' 开头的绝对路径（在沙箱内）
		return sep + relPath.split(sep).join('/');
	}

	private _processStat(stat: IFileStat): IFileStat {
		stat.path = this._stripPath(stat.path);
		stat.directory = this._stripPath(stat.directory);
		return stat;
	}

	async stat(path: string, options?: any): Promise<IFileStat> {
		const fullPath = this._resolvePath(path);
		const result = await this.fs.stat(fullPath, options);
		return this._processStat(result);
	}

	async readdir(dir: string, options?: any): Promise<IFileStat[]> {
		const fullPath = this._resolvePath(dir);
		const results = await this.fs.readdir(fullPath, options);
		return results.map((stat) => this._processStat(stat));
	}

	async exists(path: string): Promise<boolean> {
		try {
			const fullPath = this._resolvePath(path);
			return await this.fs.exists(fullPath);
		} catch (e) {
			if (e instanceof SandboxSecurityError) {
				return false; // 越界访问视为不存在
			}
			throw e;
		}
	}

	mkdir(path: string, options?: any): Promise<void> {
		const fullPath = this._resolvePath(path);
		return this.fs.mkdir(fullPath, options);
	}

	readFile(path: string, options?: ReadFileOptions & { encoding: 'text' }): Promise<string>;
	readFile(path: string, options?: ReadFileOptions): Promise<Uint8Array>;
	readFile(path: string, options?: ReadFileOptions): Promise<string | Uint8Array> {
		const fullPath = this._resolvePath(path);
		return this.fs.readFile(fullPath, options);
	}

	writeFile(path: string, data: any, options?: any): Promise<void> {
		const fullPath = this._resolvePath(path);
		return this.fs.writeFile(fullPath, data, options);
	}

	rm(path: string, options?: any): Promise<void> {
		const fullPath = this._resolvePath(path);
		return this.fs.rm(fullPath, options);
	}

	rename(oldPath: string, newPath: string, options?: any): Promise<void> {
		const fullOldPath = this._resolvePath(oldPath);
		const fullNewPath = this._resolvePath(newPath);
		return this.fs.rename(fullOldPath, fullNewPath, options);
	}

	copy(src: string, dest: string, options?: any): Promise<void> {
		const fullSrc = this._resolvePath(src);
		const fullDest = this._resolvePath(dest);
		return this.fs.copy(fullSrc, fullDest, options);
	}

	createReadStream(path: string, options?: any): any {
		const fullPath = this._resolvePath(path);
		if (!this.fs.createReadStream) {
			throw new Error('Underlying filesystem does not support createReadStream');
		}
		return this.fs.createReadStream(fullPath, options);
	}

	createWriteStream(path: string, options?: any): any {
		const fullPath = this._resolvePath(path);
		if (!this.fs.createWriteStream) {
			throw new Error('Underlying filesystem does not support createWriteStream');
		}
		return this.fs.createWriteStream(fullPath, options);
	}

	getUrl(file: IFileStat, options?: any): string | undefined {
		let path = this._resolvePath(getPath(file.path));
		if (this.fs.getUrl) {
			return this.fs.getUrl(path, options);
		}
	}
}
