import { basename, dirname, join, normalize } from 'pathe';
import { FileSystemError } from './FileSystemError';
import type {
	CopyOptions,
	IFileStat,
	IFileSystem,
	MkdirOptions,
	ReadFileOptions,
	ReaddirOptions,
	RenameOptions,
	RmOptions,
	StatOptions,
	WriteFileOptions,
} from './IFileSystem';

export function createWebFileSystem(options: { root: FileSystemDirectoryHandle }): IFileSystem {
	return new WebFileSystem(options);
}

class WebFileSystem implements IFileSystem {
	private readonly root: FileSystemDirectoryHandle;

	constructor({ root }: { root: FileSystemDirectoryHandle }) {
		this.root = root;
	}

	private async _getHandle(path: string): Promise<FileSystemHandle> {
		const parts = normalize(path).split('/').filter(Boolean);
		if (parts.length === 0) return this.root;

		let current: FileSystemDirectoryHandle = this.root;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			const isLast = i === parts.length - 1;

			try {
				// Try to get as directory first
				current = await current.getDirectoryHandle(part);
			} catch (e: any) {
				if (e.name === 'TypeMismatchError' || e.name === 'NotFoundError') {
					if (isLast) {
						// Might be a file
						try {
							return await current.getFileHandle(part);
						} catch (_e2) {
							throw new FileSystemError(`File not found: ${path}`, 'ENOENT');
						}
					}
				}
				if (e.name === 'NotFoundError') {
					throw new FileSystemError(`Path not found: ${path}`, 'ENOENT');
				}
				throw e;
			}
		}
		return current;
	}

	private async _getParent(path: string): Promise<{ parent: FileSystemDirectoryHandle; name: string }> {
		const normalized = normalize(path);
		const parentPath = dirname(normalized);
		const name = basename(normalized);

		if (!name) throw new FileSystemError('Invalid path', 'EINVAL');

		const parentHandle = await this._getHandle(parentPath);
		if (parentHandle.kind !== 'directory') {
			throw new FileSystemError(`Parent is not a directory: ${parentPath}`, 'ENOTDIR');
		}

		return { parent: parentHandle as FileSystemDirectoryHandle, name };
	}

	async stat(path: string, options?: StatOptions): Promise<IFileStat> {
		if (options?.signal?.aborted) throw new FileSystemError('Operation aborted', 'ABORT_ERR');

		const handle = await this._getHandle(path);
		return this._handleToStat(handle, path);
	}

	private async _handleToStat(handle: FileSystemHandle, path: string): Promise<IFileStat> {
		let size = 0;
		let mtime = 0;

		if (handle.kind === 'file') {
			const file = await (handle as FileSystemFileHandle).getFile();
			size = file.size;
			mtime = file.lastModified;
		}

		return {
			path,
			directory: dirname(path),
			name: handle.name,
			kind: handle.kind,
			size,
			mtime,
			meta: {},
		};
	}

	async exists(path: string): Promise<boolean> {
		try {
			await this._getHandle(path);
			return true;
		} catch {
			return false;
		}
	}

	async readdir(path: string, options?: ReaddirOptions): Promise<IFileStat[]> {
		if (options?.signal?.aborted) throw new FileSystemError('Operation aborted', 'ABORT_ERR');

		const handle = await this._getHandle(path);
		if (handle.kind !== 'directory') {
			throw new FileSystemError(`Not a directory: ${path}`, 'ENOTDIR');
		}

		const entries: IFileStat[] = [];
		// @ts-expect-error - FileSystemDirectoryHandle is async iterable in modern browsers
		for await (const entry of (handle as FileSystemDirectoryHandle).values()) {
			entries.push(await this._handleToStat(entry, join(path, entry.name)));
		}
		return entries;
	}

	async mkdir(path: string, options?: MkdirOptions): Promise<void> {
		if (options?.signal?.aborted) throw new FileSystemError('Operation aborted', 'ABORT_ERR');

		const normalized = normalize(path);
		const parts = normalized.split('/').filter(Boolean);
		let current = this.root;

		if (options?.recursive) {
			for (const part of parts) {
				current = await current.getDirectoryHandle(part, { create: true });
			}
		} else {
			const parentPath = dirname(normalized);
			const name = basename(normalized);
			try {
				const parent = await this._getHandle(parentPath);
				if (parent.kind !== 'directory') throw new FileSystemError(`Parent not a directory: ${parentPath}`, 'ENOTDIR');
				await (parent as FileSystemDirectoryHandle).getDirectoryHandle(name, { create: true });
			} catch (e: any) {
				if (e.code === 'ENOENT' || e.name === 'NotFoundError') {
					throw new FileSystemError(`Parent does not exist: ${parentPath}`, 'ENOENT');
				}
				throw e;
			}
		}
	}

	readFile(path: string, options?: ReadFileOptions & { encoding: 'text' }): Promise<string>;
	readFile(path: string, options?: ReadFileOptions): Promise<Uint8Array>;
	async readFile(path: string, options?: ReadFileOptions): Promise<string | Uint8Array> {
		if (options?.signal?.aborted) throw new FileSystemError('Operation aborted', 'ABORT_ERR');

		const handle = await this._getHandle(path);
		if (handle.kind !== 'file') throw new FileSystemError(`Is a directory: ${path}`, 'EISDIR');

		const file = await (handle as FileSystemFileHandle).getFile();

		if (options?.encoding === 'text') {
			return await file.text();
		} else {
			const buffer = await file.arrayBuffer();
			return new Uint8Array(buffer);
		}
	}

	async writeFile(
		path: string,
		data: string | ArrayBuffer | ArrayBufferView<ArrayBufferLike> | ReadableStream,
		options?: WriteFileOptions,
	): Promise<void> {
		if (options?.signal?.aborted) throw new FileSystemError('Operation aborted', 'ABORT_ERR');

		if (options?.overwrite === false) {
			if (await this.exists(path)) {
				throw new FileSystemError(`File already exists: ${path}`, 'EEXIST');
			}
		}

		const { parent, name } = await this._getParent(path);
		const handle = await parent.getFileHandle(name, { create: true });

		const writable = await (handle as any).createWritable();
		await writable.write(data);
		await writable.close();
	}

	async rm(path: string, options?: RmOptions): Promise<void> {
		if (options?.signal?.aborted) throw new FileSystemError('Operation aborted', 'ABORT_ERR');

		const { parent, name } = await this._getParent(path);

		try {
			await (parent as any).removeEntry(name, { recursive: options?.recursive });
		} catch (e: any) {
			if (e.name === 'NotFoundError') {
				if (!options?.force) throw new FileSystemError(`File not found: ${path}`, 'ENOENT');
			} else if (e.name === 'InvalidModificationError') {
				throw new FileSystemError(`Directory not empty: ${path}`, 'ENOTEMPTY');
			} else {
				throw e;
			}
		}
	}

	async rename(oldPath: string, newPath: string, options?: RenameOptions): Promise<void> {
		if (options?.signal?.aborted) throw new FileSystemError('Operation aborted', 'ABORT_ERR');

		// File System Access API doesn't support move/rename directly
		// Fallback to copy + delete
		await this.copy(oldPath, newPath, { overwrite: options?.overwrite });
		await this.rm(oldPath, { recursive: true });
	}

	async copy(src: string, dest: string, options?: CopyOptions): Promise<void> {
		if (options?.signal?.aborted) throw new FileSystemError('Operation aborted', 'ABORT_ERR');

		const srcHandle = await this._getHandle(src);

		if (srcHandle.kind === 'file') {
			const file = await (srcHandle as FileSystemFileHandle).getFile();
			await this.writeFile(dest, await file.arrayBuffer(), { overwrite: options?.overwrite });
		} else {
			// Directory copy
			await this.mkdir(dest);
			const entries = await this.readdir(src);
			for (const entry of entries) {
				await this.copy(entry.path, join(dest, entry.name), options);
			}
		}
	}

	getUrl(_file: IFileStat | string): string | undefined {
		return undefined;
	}
}
