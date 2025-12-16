import { dirname, join, normalize } from 'pathe';
import type {
	CopyOptions,
	IFileStat,
	IFileSystem,
	MkdirOptions,
	ReaddirOptions,
	ReadFileOptions,
	RenameOptions,
	RmOptions,
	WriteFileOptions,
} from './IFileSystem';
import type { FileUrlOptions } from './types';

class BrowserFSError extends Error {
	constructor(
		message: string,
		public code?: string,
	) {
		super(message);
		this.name = 'BrowserFSError';
	}
}

type BrowserFile = IFileStat & {
	kind: 'file';
	meta: {
		handle: FileSystemFileHandle;
		file: File;
	};
};

type BrowserDirectory = IFileStat & {
	kind: 'directory';
	meta: {
		handle: FileSystemDirectoryHandle;
	};
};

type BrowserNode = BrowserFile | BrowserDirectory;

/**
 * Creates an IFileSystem instance backed by the browser's File System Access API.
 * @param root A FileSystemDirectoryHandle, usually obtained from `window.showDirectoryPicker()`.
 */
export function createBrowserFileSystem(root: FileSystemDirectoryHandle): IFileSystem {
	return new BrowserFS(root);
}

class BrowserFS implements IFileSystem {
	root: FileSystemDirectoryHandle;
	node: BrowserDirectory;

	constructor(root: FileSystemDirectoryHandle) {
		this.root = root;
		this.node = {
			path: '/',
			name: '',
			directory: '',
			kind: 'directory',
			mtime: 0,
			size: 0,
			meta: {
				handle: root,
			},
		};
	}

	/**
	 * Resolves a path string to a file or directory handle. This is the core navigation logic.
	 * @returns A tuple of [handle, parentHandle, name] or [null, parentHandle, name] if not found.
	 */
	private async _getHandle(path: string): Promise<[FileSystemHandle | null, FileSystemDirectoryHandle | null, string]> {
		const normalized = normalize(path);
		if (normalized === '/' || normalized === '.') {
			return [this.root, null, this.root.name];
		}

		const parts = normalized.split('/').filter((p) => p);
		const name = parts.pop()!;

		let parent: FileSystemDirectoryHandle = this.root;
		for (const part of parts) {
			try {
				parent = await parent.getDirectoryHandle(part);
			} catch (e: any) {
				if (e.name === 'NotFoundError' || e.name === 'TypeMismatchError') {
					return [null, null, name]; // Parent path does not exist or is a file
				}
				throw e;
			}
		}

		try {
			// Check for file first, then directory
			const handle = await parent.getFileHandle(name).catch(() => parent.getDirectoryHandle(name));
			return [handle, parent, name];
		} catch (e: any) {
			if (e.name === 'NotFoundError') {
				return [null, parent, name]; // Entry not found
			}
			throw e;
		}
	}

	/**
	 * Converts a FileSystemHandle into our standard IFileStat object.
	 */
	private async _toFileStat(handle: FileSystemHandle, path: string): Promise<IFileStat> {
		const isFile = handle.kind === 'file';
		const file = isFile ? await (handle as FileSystemFileHandle).getFile() : undefined;

		return {
			name: handle.name,
			kind: handle.kind,
			path: path,
			directory: dirname(path),
			size: file?.size ?? 0,
			mtime: file?.lastModified ?? Date.now(),
			meta: { handle, file },
		};
	}

	// --- IFileSystem Implementation ---

	async stat(path: string): Promise<IFileStat> {
		const [handle] = await this._getHandle(path);
		if (!handle) {
			throw new BrowserFSError(`Path not found: ${path}`, 'ENOENT');
		}
		return this._toFileStat(handle, path);
	}

	async exists(path: string): Promise<boolean> {
		const [handle] = await this._getHandle(path);
		return !!handle;
	}

	async readdir(dir: string, options?: ReaddirOptions): Promise<IFileStat[]> {
		const [handle] = await this._getHandle(dir);
		if (!handle) {
			throw new BrowserFSError(`Directory not found: ${dir}`, 'ENOENT');
		}
		if (handle.kind !== 'directory') {
			throw new BrowserFSError(`Not a directory: ${dir}`, 'ENOTDIR');
		}

		const entries: IFileStat[] = [];
		for await (const entry of (handle as FileSystemDirectoryHandle).values()) {
			entries.push(await this._toFileStat(entry, join(dir, entry.name)));
		}
		return entries;
	}

	async mkdir(path: string, options: MkdirOptions = {}): Promise<void> {
		const parts = normalize(path)
			.split('/')
			.filter((p) => p);
		let currentDir = this.root;

		for (const part of parts) {
			try {
				currentDir = await currentDir.getDirectoryHandle(part, { create: options.recursive });
			} catch (e: any) {
				// If recursive is false, getDirectoryHandle throws if a segment is missing.
				// We re-throw a more standard error.
				if (e.name === 'NotFoundError' && !options.recursive) {
					throw new BrowserFSError(`Cannot create directory: Parent does not exist for path ${path}`, 'ENOENT');
				}
				// If it's another error (like a file with the same name), re-throw it.
				throw e;
			}
		}
	}

	readFile(path: string, options?: ReadFileOptions & { encoding: 'text' }): Promise<string>;
	readFile(path: string, options?: ReadFileOptions): Promise<Uint8Array>;
	async readFile(path: string, options?: ReadFileOptions): Promise<string | Uint8Array> {
		const [handle] = await this._getHandle(path);
		if (!handle || handle.kind !== 'file') {
			throw new BrowserFSError(`File not found: ${path}`, 'ENOENT');
		}
		const file = await (handle as FileSystemFileHandle).getFile();
		return options?.encoding === 'text' ? file.text() : file.bytes();
	}

	async writeFile(path: string, data: any, options: WriteFileOptions = {}): Promise<void> {
		const { overwrite = true } = options;
		const [handle, parent, name] = await this._getHandle(path);

		if (!parent) {
			throw new BrowserFSError(`Parent directory does not exist for path: ${path}`, 'ENOENT');
		}
		if (handle && !overwrite) {
			throw new BrowserFSError(`File already exists: ${path}`, 'EEXIST');
		}

		const fileHandle = await parent.getFileHandle(name, { create: true });
		const writable = await fileHandle.createWritable();
		await writable.write(data);
		await writable.close();
	}

	async rm(path: string, options: RmOptions = {}): Promise<void> {
		const { recursive = false, force = false } = options;
		const [handle, parent, name] = await this._getHandle(path);

		if (!handle) {
			if (force) return; // If force is true, do not error on not found.
			throw new BrowserFSError(`Path not found: ${path}`, 'ENOENT');
		}
		if (!parent) {
			throw new BrowserFSError(`Cannot remove root directory`);
		}

		await parent.removeEntry(name, { recursive });
	}

	async rename(oldPath: string, newPath: string, options?: RenameOptions): Promise<void> {
		// The File System Access API does NOT have a native move/rename.
		// The standard workaround is to copy, then delete the original.
		await this.copy(oldPath, newPath, options);
		await this.rm(oldPath, { recursive: true });
	}

	async copy(srcPath: string, destPath: string, options?: CopyOptions): Promise<void> {
		const [srcHandle] = await this._getHandle(srcPath);
		if (!srcHandle) {
			throw new BrowserFSError(`Source not found: ${srcPath}`, 'ENOENT');
		}

		const [destHandle, destParent, destName] = await this._getHandle(destPath);
		if (!destParent) {
			throw new BrowserFSError(`Destination directory does not exist: ${dirname(destPath)}`, 'ENOENT');
		}
		if (destHandle && !options?.overwrite) {
			throw new BrowserFSError(`Destination already exists: ${destPath}`, 'EEXIST');
		}
		if (destHandle?.kind === 'directory' && srcHandle.kind === 'file') {
			throw new BrowserFSError(`Cannot overwrite a directory with a file: ${destPath}`, 'EISDIR');
		}

		await this._copyEntry(srcHandle, destParent, destName);
	}

	private async _copyEntry(
		srcHandle: FileSystemHandle,
		destDirHandle: FileSystemDirectoryHandle,
		newName: string,
	): Promise<void> {
		if (srcHandle.kind === 'file') {
			const file = await (srcHandle as FileSystemFileHandle).getFile();
			const destFileHandle = await destDirHandle.getFileHandle(newName, { create: true });
			const writable = await destFileHandle.createWritable();
			await writable.write(file);
			await writable.close();
		} else if (srcHandle.kind === 'directory') {
			const newDirHandle = await destDirHandle.getDirectoryHandle(newName, { create: true });
			for await (const entry of (srcHandle as FileSystemDirectoryHandle).values()) {
				await this._copyEntry(entry, newDirHandle, entry.name);
			}
		}
	}

	async createUrl(stat: IFileStat, options?: FileUrlOptions): Promise<string> {
		// The handle is stored in the meta property in our _toFileStat method
		const handle = stat.meta.handle as FileSystemHandle | undefined;
		if (handle?.kind !== 'file') {
			// Return a placeholder or throw an error for directories
			return '';
		}
		const file = await (handle as FileSystemFileHandle).getFile();
		return URL.createObjectURL(file);
	}

	createReadStream(): never {
		throw new Error('Streaming is not implemented for BrowserFS. Use readFile instead.');
	}

	createWriteStream(): never {
		throw new Error('Streaming is not implemented for BrowserFS. Use writeFile instead.');
	}

	createWritableStream(): never {
		throw new Error('Streaming is not implemented for BrowserFS. Use writeFile instead.');
	}

	createReadableStream(): never {
		throw new Error('Streaming is not implemented for BrowserFS. Use readFile instead.');
	}
}
