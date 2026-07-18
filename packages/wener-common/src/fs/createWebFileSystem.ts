import { basename, dirname, join, normalize } from 'pathe';
import { FileSystemError } from './FileSystemError';
import type {
	CopyOptions,
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
import { validateReadFileMaxBytes } from './resourceLimits';

export function createWebFileSystem(options: { root: FileSystemDirectoryHandle }): IFileSystem {
	return new WebFileSystem(options);
}

class WebFileSystem implements IFileSystem {
	private readonly root: FileSystemDirectoryHandle;
	private temporaryEntrySequence = 0;

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
						} catch (fileError) {
							if (this._isMissingHandleError(fileError)) {
								throw new FileSystemError(`File not found: ${path}`, 'ENOENT');
							}
							throw fileError;
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

	private _isMissingHandleError(error: unknown): boolean {
		return (
			typeof error === 'object' &&
			error !== null &&
			'name' in error &&
			(error.name === 'NotFoundError' || error.name === 'TypeMismatchError')
		);
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

	private _throwIfAborted(signal?: AbortSignal): void {
		if (signal?.aborted) throw new FileSystemError('Operation aborted', 'ABORT_ERR');
	}

	private _normalizeTransferPath(path: string): string {
		const normalized = normalize(path);
		if (normalized === '.' || normalized === '/') {
			throw new FileSystemError('Cannot copy or rename the file system root', 'EINVAL');
		}

		const parts = normalized.split('/').filter(Boolean);
		if (parts.includes('..')) throw new FileSystemError(`Path escapes the file system root: ${path}`, 'EINVAL');
		return `/${parts.join('/')}`;
	}

	private _validateTransferPaths(src: string, dest: string): { sourcePath: string; destinationPath: string } {
		const sourcePath = this._normalizeTransferPath(src);
		const destinationPath = this._normalizeTransferPath(dest);
		if (
			sourcePath === destinationPath ||
			destinationPath.startsWith(`${sourcePath}/`) ||
			sourcePath.startsWith(`${destinationPath}/`)
		) {
			throw new FileSystemError('Source and destination paths must not overlap', 'EINVAL');
		}
		return { sourcePath, destinationPath };
	}

	private async _getOptionalHandle(path: string): Promise<FileSystemHandle | undefined> {
		try {
			return await this._getHandle(path);
		} catch (error) {
			if (error instanceof FileSystemError && error.code === 'ENOENT') return undefined;
			throw error;
		}
	}

	private _assertReplaceable(source: FileSystemHandle, destination: FileSystemHandle, path: string): void {
		if (source.kind === destination.kind) return;
		if (source.kind === 'file') {
			throw new FileSystemError(`Cannot overwrite a directory: ${path}`, 'EISDIR');
		}
		throw new FileSystemError(`Cannot overwrite a file with a directory: ${path}`, 'ENOTDIR');
	}

	private async _getChildHandle(
		parent: FileSystemDirectoryHandle,
		name: string,
	): Promise<FileSystemHandle | undefined> {
		try {
			return await parent.getDirectoryHandle(name);
		} catch (error: any) {
			if (error?.name !== 'NotFoundError' && error?.name !== 'TypeMismatchError') throw error;
		}
		try {
			return await parent.getFileHandle(name);
		} catch (error: any) {
			if (error?.name === 'NotFoundError' || error?.name === 'TypeMismatchError') return undefined;
			throw error;
		}
	}

	private async _allocateTemporaryName(parent: FileSystemDirectoryHandle, role: 'backup' | 'copy'): Promise<string> {
		for (let attempt = 0; attempt < 100; attempt++) {
			const name = `.wode-${role}-${++this.temporaryEntrySequence}`;
			if (!(await this._getChildHandle(parent, name))) return name;
		}
		throw new FileSystemError('Unable to allocate a temporary file system entry', 'EEXIST');
	}

	private async _removeChild(parent: FileSystemDirectoryHandle, name: string): Promise<void> {
		await parent.removeEntry(name, { recursive: true });
	}

	private async _removeChildIfPresent(parent: FileSystemDirectoryHandle, name: string): Promise<void> {
		if (await this._getChildHandle(parent, name)) await this._removeChild(parent, name);
	}

	private async _cleanupChild(parent: FileSystemDirectoryHandle, name?: string): Promise<unknown | undefined> {
		if (!name) return undefined;
		try {
			await this._removeChild(parent, name);
			return undefined;
		} catch (error) {
			return error;
		}
	}

	private _isReadableStream(value: unknown): value is ReadableStream {
		return typeof value === 'object' && value !== null && typeof (value as ReadableStream).pipeTo === 'function';
	}

	private async _writeHandle(
		handle: FileSystemFileHandle,
		data: string | ArrayBuffer | ArrayBufferView<ArrayBufferLike> | ReadableStream,
		signal?: AbortSignal,
	): Promise<void> {
		this._throwIfAborted(signal);
		const writable = await handle.createWritable();
		if (this._isReadableStream(data)) {
			await data.pipeTo(writable, { signal });
			return;
		}

		try {
			await writable.write(data as any);
			this._throwIfAborted(signal);
			await writable.close();
		} catch (error) {
			try {
				await writable.abort(error);
			} catch {
				// Preserve the original write failure.
			}
			throw error;
		}
	}

	private async _copyEntry(
		source: FileSystemHandle,
		destinationParent: FileSystemDirectoryHandle,
		destinationName: string,
		options: { shallow?: boolean; signal?: AbortSignal } = {},
	): Promise<void> {
		this._throwIfAborted(options.signal);
		if (source.kind === 'file') {
			const file = await (source as FileSystemFileHandle).getFile();
			const destination = await destinationParent.getFileHandle(destinationName, { create: true });
			await this._writeHandle(destination, file.stream(), options.signal);
			return;
		}

		const destination = await destinationParent.getDirectoryHandle(destinationName, { create: true });
		if (options.shallow) return;
		for await (const child of (source as FileSystemDirectoryHandle).values()) {
			await this._copyEntry(child, destination, child.name, options);
		}
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
		} catch (error) {
			if (error instanceof FileSystemError && error.code === 'ENOENT') return false;
			throw error;
		}
	}

	async readdir(path: string, options?: ReaddirOptions): Promise<IFileStat[]> {
		this._throwIfAborted(options?.signal);
		const maxEntries = validateReaddirMaxEntries(options?.maxEntries);

		const handle = await this._getHandle(path);
		if (handle.kind !== 'directory') {
			throw new FileSystemError(`Not a directory: ${path}`, 'ENOTDIR');
		}

		const entries: IFileStat[] = [];
		for await (const entry of (handle as FileSystemDirectoryHandle).values()) {
			this._throwIfAborted(options?.signal);
			assertReaddirEntryLimit(entries.length + 1, maxEntries, path);
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
		this._throwIfAborted(options?.signal);
		const maxBytes = validateReadFileMaxBytes(options?.maxBytes);

		const handle = await this._getHandle(path);
		this._throwIfAborted(options?.signal);
		if (handle.kind !== 'file') throw new FileSystemError(`Is a directory: ${path}`, 'EISDIR');

		const file = await (handle as FileSystemFileHandle).getFile();
		this._throwIfAborted(options?.signal);
		const readable = maxBytes === undefined ? file : file.slice(0, maxBytes);
		const bytes = new Uint8Array(await readable.arrayBuffer());
		this._throwIfAborted(options?.signal);
		return options?.encoding === 'text' ? new TextDecoder().decode(bytes) : bytes;
	}

	async writeFile(
		path: string,
		data: string | ArrayBuffer | ArrayBufferView<ArrayBufferLike> | ReadableStream,
		options?: WriteFileOptions,
	): Promise<void> {
		this._throwIfAborted(options?.signal);

		if (options?.overwrite === false) {
			if (await this.exists(path)) {
				throw new FileSystemError(`File already exists: ${path}`, 'EEXIST');
			}
		}
		const existing = await this._getOptionalHandle(path);
		if (existing?.kind === 'directory') throw new FileSystemError(`Is a directory: ${path}`, 'EISDIR');

		const { parent, name } = await this._getParent(path);
		const handle = await parent.getFileHandle(name, { create: true });
		try {
			await this._writeHandle(handle, data, options?.signal);
		} catch (error) {
			if (!existing) {
				try {
					await this._removeChild(parent, name);
				} catch (cleanupError) {
					throw new AggregateError([error, cleanupError], 'Write failed and the new file could not be removed');
				}
			}
			throw error;
		}
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
		this._throwIfAborted(options?.signal);
		const { sourcePath, destinationPath } = this._validateTransferPaths(oldPath, newPath);
		const source = await this._getHandle(sourcePath);
		const destination = await this._getOptionalHandle(destinationPath);
		if (destination && options?.overwrite !== true) {
			throw new FileSystemError(`Destination already exists: ${destinationPath}`, 'EEXIST');
		}
		if (destination) this._assertReplaceable(source, destination, destinationPath);

		const { parent: destinationParent, name: destinationName } = await this._getParent(destinationPath);
		let backupName: string | undefined;
		let preserveBackup = false;
		if (destination) {
			backupName = await this._allocateTemporaryName(destinationParent, 'backup');
			await this._copyEntry(destination, destinationParent, backupName, { signal: options?.signal });
		}

		let primaryError: unknown;
		try {
			await this.copy(sourcePath, destinationPath, { overwrite: options?.overwrite, signal: options?.signal });
			try {
				await this.rm(sourcePath, { recursive: true, signal: options?.signal });
			} catch (removeSourceError) {
				const rollbackErrors: unknown[] = [];
				try {
					await this._removeChildIfPresent(destinationParent, destinationName);
				} catch (error) {
					rollbackErrors.push(error);
				}
				if (backupName) {
					try {
						const backup = await this._getChildHandle(destinationParent, backupName);
						if (!backup) throw new FileSystemError('Rename backup disappeared during restore', 'ENOENT');
						await this._copyEntry(backup, destinationParent, destinationName);
					} catch (error) {
						preserveBackup = true;
						rollbackErrors.push(error);
					}
				}
				if (rollbackErrors.length) {
					throw new AggregateError(
						[removeSourceError, ...rollbackErrors],
						'Rename could not remove the source or restore the destination',
					);
				}
				throw removeSourceError;
			}
		} catch (error) {
			primaryError = error;
		}

		const cleanupError = preserveBackup ? undefined : await this._cleanupChild(destinationParent, backupName);
		if (primaryError !== undefined) {
			if (cleanupError !== undefined) {
				throw new AggregateError([primaryError, cleanupError], 'Rename failed and its backup could not be cleaned up');
			}
			throw primaryError;
		}
		if (cleanupError !== undefined)
			throw new AggregateError([cleanupError], 'Rename completed but its backup could not be cleaned up');
	}

	async copy(src: string, dest: string, options?: CopyOptions): Promise<void> {
		this._throwIfAborted(options?.signal);
		const { sourcePath, destinationPath } = this._validateTransferPaths(src, dest);
		const source = await this._getHandle(sourcePath);
		const { parent: destinationParent, name: destinationName } = await this._getParent(destinationPath);
		const destination = await this._getOptionalHandle(destinationPath);

		if (destination && options?.overwrite !== true) {
			throw new FileSystemError(`Destination already exists: ${destinationPath}`, 'EEXIST');
		}
		if (destination) this._assertReplaceable(source, destination, destinationPath);

		const stagingName = await this._allocateTemporaryName(destinationParent, 'copy');
		let backupName: string | undefined;
		let preserveBackup = false;
		let primaryError: unknown;
		try {
			await this._copyEntry(source, destinationParent, stagingName, {
				shallow: options?.shallow,
				signal: options?.signal,
			});
			this._throwIfAborted(options?.signal);

			if (destination) {
				backupName = await this._allocateTemporaryName(destinationParent, 'backup');
				await this._copyEntry(destination, destinationParent, backupName, { signal: options?.signal });
				this._throwIfAborted(options?.signal);
				await this._removeChild(destinationParent, destinationName);
			} else if (await this._getChildHandle(destinationParent, destinationName)) {
				throw new FileSystemError(`Destination already exists: ${destinationPath}`, 'EEXIST');
			}

			try {
				const staged = await this._getChildHandle(destinationParent, stagingName);
				if (!staged) throw new FileSystemError('Staged copy disappeared before replacement', 'ENOENT');
				await this._copyEntry(staged, destinationParent, destinationName, { signal: options?.signal });
			} catch (copyError) {
				try {
					await this._removeChildIfPresent(destinationParent, destinationName);
				} catch (rollbackError) {
					preserveBackup = Boolean(backupName);
					throw new AggregateError(
						[copyError, rollbackError],
						'Copy failed and its partial destination could not be removed',
					);
				}
				if (backupName) {
					try {
						const backup = await this._getChildHandle(destinationParent, backupName);
						if (!backup) throw new FileSystemError('Destination backup disappeared during restore', 'ENOENT');
						await this._copyEntry(backup, destinationParent, destinationName);
					} catch (restoreError) {
						preserveBackup = true;
						throw new AggregateError(
							[copyError, restoreError],
							'Copy failed and the destination could not be restored',
						);
					}
				}
				throw copyError;
			}
		} catch (error) {
			primaryError = error;
		}

		const cleanupErrors = [await this._cleanupChild(destinationParent, stagingName)];
		if (!preserveBackup) cleanupErrors.push(await this._cleanupChild(destinationParent, backupName));
		const failures = cleanupErrors.filter((error) => error !== undefined);
		if (primaryError !== undefined) {
			if (failures.length) {
				throw new AggregateError(
					[primaryError, ...failures],
					'Copy failed and temporary entries could not be cleaned up',
				);
			}
			throw primaryError;
		}
		if (failures.length) {
			throw new AggregateError(failures, 'Copy completed but temporary entries could not be cleaned up');
		}
	}

	getUrl(_file: IFileStat | string): string | undefined {
		return undefined;
	}
}
