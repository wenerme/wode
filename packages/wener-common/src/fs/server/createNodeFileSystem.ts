import { createReadStream as nodeCreateReadStream, createWriteStream as nodeCreateWriteStream } from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { Readable, type Writable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import type {
	CopyOptions,
	CreateReadStreamOptions,
	CreateWriteStreamOptions,
	IFileStat,
	IServerFileSystem,
	MkdirOptions,
	ReaddirOptions,
	ReadFileOptions,
	RenameOptions,
	RmOptions,
	StatOptions,
	WritableData,
	WriteFileOptions,
} from '../IFileSystem';
import { validateReaddirMaxEntries } from '../readdirLimit';
import { validateReadFileMaxBytes } from '../resourceLimits';
import { readNodeDirectory, toNodeFileStat } from './nodeFileSystemDirectory';
import {
	assertNodePathHasNoSymlink,
	assertNodePathHasNoSymlinkSync,
	readBoundedNodeFile,
} from './nodeFileSystemLimits';

export type INodeFileSystem = IServerFileSystem & {
	readonly root: string;
	resolvePath(filePath: string): string;
};

/**
 * Creates a Node.js filesystem adapter that implements the IFileSystem interface
 *
 * A configured root rejects lexical escapes and symlinks observed during each call. The adapter uses
 * pathname-based Node APIs, so the host filesystem namespace must be trusted not to replace path segments
 * concurrently. It is not a sandbox boundary against another same-host process racing rename/symlink changes.
 * @param options Configuration options for the filesystem
 * @param options.root Optional root directory to restrict all operations within
 */
export function createNodeFileSystem(options: { root?: string } = {}): INodeFileSystem {
	return new NodeFs(options);
}

type IFS = typeof import('fs/promises');

class NodeFs implements IServerFileSystem, INodeFileSystem {
	readonly root: string;
	private readonly fs: IFS;

	constructor({
		root,
		fs = fsp,
	}: {
		root?: string;
		fs?: IFS;
	} = {}) {
		// Normalize the root path if provided
		if (root) {
			this.root = path.resolve(root);
		} else {
			this.root = '';
		}
		this.fs = fs;
	}

	// Helper method to handle aborted signals consistently
	private checkAborted(signal?: AbortSignal): void {
		if (signal?.aborted) {
			throw new Error('The operation was aborted');
		}
	}

	/**
	 * Resolves and secures a path by:
	 * 1. Normalizing the path
	 * 2. Prepending the root directory if one is set
	 * 3. Verifying the resulting path is within the root directory
	 *
	 * This prevents path traversal attacks.
	 */
	resolvePath(filePath: string): string {
		// Handle empty paths
		if (!filePath) {
			return this.root || '';
		}

		// Normalize to remove any '..' segments and handle slashes
		const normalizedPath = path.normalize(filePath);

		// If no root is set, just return the normalized path
		if (!this.root) {
			return normalizedPath;
		}

		// Join with root and resolve to absolute path
		const resolvedPath = path.resolve(path.join(this.root, normalizedPath));

		// Security check: ensure the path is within the root directory
		const relative = path.relative(this.root, resolvedPath);
		if (relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative)) {
			throw new Error(`Security violation: Path ${filePath} attempts to access outside of the root directory`);
		}

		return resolvedPath;
	}

	/**
	 * Removes the root prefix from a path for external representation
	 */
	private stripRoot(fullPath: string): string {
		if (!this.root || !fullPath.startsWith(this.root)) {
			return fullPath;
		}

		// Remove the root prefix and ensure there's a leading slash
		let relativePath = fullPath.substring(this.root.length);
		if (!relativePath) {
			return '/';
		}

		if (!relativePath.startsWith('/') && !relativePath.startsWith('\\')) {
			relativePath = `/${relativePath}`;
		}

		// Normalize to ensure consistent path separators
		return path.normalize(relativePath).replace(/\\/g, '/');
	}

	async readdir(dir: string, options: ReaddirOptions = {}): Promise<IFileStat[]> {
		const { fs } = this;
		const { signal } = options;
		const maxEntries = validateReaddirMaxEntries(options.maxEntries);
		this.checkAborted(signal);

		// Resolve the directory path with security checks
		const resolvedDir = this.resolvePath(dir);
		await this.assertSafePath(resolvedDir);
		return readNodeDirectory({
			dir: resolvedDir,
			fs,
			maxEntries,
			options,
			readdir: (path, nextOptions) => this.readdir(path, nextOptions),
			stripRoot: (value) => this.stripRoot(value),
			throwIfAborted: () => this.checkAborted(signal),
		});
	}

	async stat(filePath: string, options: StatOptions = {}): Promise<IFileStat> {
		const { fs } = this;

		const { signal } = options;
		this.checkAborted(signal);

		const resolvedPath = this.resolvePath(filePath);
		await this.assertSafePath(resolvedPath);

		try {
			const stat = await fs.stat(resolvedPath);
			return toNodeFileStat(resolvedPath, path.basename(resolvedPath), stat.isDirectory(), stat, (value) =>
				this.stripRoot(value),
			);
		} catch (err: any) {
			if (err.code === 'ENOENT') {
				throw new Error(`File not found: ${filePath}`);
			}
			throw err;
		}
	}

	async mkdir(dirPath: string, options: MkdirOptions = {}): Promise<void> {
		const { fs } = this;

		const { recursive = false, signal } = options;
		this.checkAborted(signal);

		const resolvedPath = this.resolvePath(dirPath);
		await this.assertSafePath(resolvedPath, true);

		try {
			await fs.mkdir(resolvedPath, { recursive });
		} catch (err: any) {
			if (err.code === 'EEXIST' && recursive) {
				// Ignore if directory exists and recursive is true
				return;
			}
			throw err;
		}
	}

	async readFile(path: string, options?: ReadFileOptions & { encoding: 'text' }): Promise<string>;
	async readFile(path: string, options?: ReadFileOptions): Promise<Uint8Array>;
	async readFile(path: string, options: ReadFileOptions = {}): Promise<string | Uint8Array> {
		const { fs } = this;

		const { encoding = 'binary', signal, onDownloadProgress } = options;
		const maxBytes = validateReadFileMaxBytes(options.maxBytes);
		this.checkAborted(signal);

		const resolvedPath = this.resolvePath(path);
		await this.assertSafePath(resolvedPath);
		if (maxBytes !== undefined) {
			return readBoundedNodeFile({ encoding, fs, maxBytes, onDownloadProgress, path: resolvedPath, signal });
		}

		try {
			// Handle progress reporting if needed
			if (onDownloadProgress) {
				const stat = await fs.stat(resolvedPath);
				const stream = this.createReadStream(path, { signal });

				return new Promise((resolve, reject) => {
					const chunks: Buffer[] = [];
					let loaded = 0;

					stream.on('data', (chunk) => {
						chunks.push(Buffer.from(chunk));
						loaded += chunk.length;
						onDownloadProgress({ loaded, total: stat.size });
					});

					stream.on('end', () => {
						const buffer = Buffer.concat(chunks);
						if (encoding === 'text') {
							resolve(buffer.toString('utf-8'));
						} else {
							resolve(buffer);
						}
					});

					stream.on('error', reject);
				});
			}

			// Standard file reading
			if (encoding === 'text') {
				return await fs.readFile(resolvedPath, { encoding: 'utf-8' });
			} else {
				return await fs.readFile(resolvedPath);
			}
		} catch (err: any) {
			if (err.code === 'ENOENT') {
				throw new Error(`File not found: ${path}`);
			}
			throw err;
		}
	}

	async writeFile(path: string, data: WritableData, options: WriteFileOptions = {}): Promise<void> {
		const { fs } = this;

		const { signal, overwrite = true, onUploadProgress } = options;
		this.checkAborted(signal);

		const resolvedPath = this.resolvePath(path);
		await this.assertSafePath(resolvedPath, true);

		// Check if file exists and overwrite is false
		if (!overwrite) {
			const exists = await this.exists(path);
			if (exists) {
				throw new Error(`File already exists: ${path}`);
			}
		}

		// Create parent directories if they don't exist
		const directory = this.getDirectoryName(resolvedPath);
		if (directory !== resolvedPath) {
			try {
				await this.mkdir(this.stripRoot(directory), { recursive: true });
			} catch (err: any) {
				// Ignore directory exists error
				if (err?.code !== 'EEXIST') {
					throw err;
				}
			}
		}

		if (data instanceof Readable) {
			let _data = data;
			return new Promise((resolve, reject) => {
				const writeStream = this.createWriteStream(path, options);
				let totalBytes = 0;

				if (onUploadProgress) {
					_data.on('data', (chunk) => {
						totalBytes += chunk.length;
						onUploadProgress({ loaded: totalBytes, total: -1 });
					});
				}

				_data.pipe(writeStream);

				writeStream.on('finish', () => resolve());
				writeStream.on('error', reject);

				if (signal) {
					signal.addEventListener('abort', () => {
						_data.destroy();
						writeStream.destroy();
						reject(new Error('The operation was aborted'));
					});
				}
			});
		} else if (data instanceof ReadableStream) {
			// Handle web ReadableStream
			const reader = data.getReader();
			const chunks: Uint8Array[] = [];
			let loaded = 0;
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				if (value) {
					chunks.push(value);
					loaded += value.length;
					if (onUploadProgress) {
						onUploadProgress({ loaded, total: -1 });
					}
				}
			}
			await fs.writeFile(resolvedPath, Buffer.concat(chunks));
		} else {
			// Convert ArrayBuffer/ArrayBufferView to Buffer if necessary
			let writeData: string | Buffer;
			if (data instanceof ArrayBuffer) {
				writeData = Buffer.from(data);
			} else if (ArrayBuffer.isView(data)) {
				writeData = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
			} else {
				writeData = data;
			}
			await fs.writeFile(resolvedPath, writeData);
		}
	}

	async rm(path: string, options: RmOptions = {}): Promise<void> {
		const { fs } = this;

		const { recursive = false, force = false, signal } = options;
		this.checkAborted(signal);

		const resolvedPath = this.resolvePath(path);
		await this.assertSafePath(resolvedPath, force);

		try {
			await fs.rm(resolvedPath, { recursive, force });
		} catch (err: any) {
			if (force && err.code === 'ENOENT') {
				return;
			}
			throw err;
		}
	}

	async rename(oldPath: string, newPath: string, options: RenameOptions = {}): Promise<void> {
		const { fs } = this;

		const { signal, overwrite = false } = options;
		this.checkAborted(signal);

		const resolvedOldPath = this.resolvePath(oldPath);
		const resolvedNewPath = this.resolvePath(newPath);
		await this.assertSafePath(resolvedOldPath);
		await this.assertSafePath(resolvedNewPath, true);

		// Check if target exists and overwrite is false
		if (!overwrite) {
			const exists = await this.exists(newPath);
			if (exists) {
				throw new Error(`Destination already exists: ${newPath}`);
			}
		}

		try {
			await fs.rename(resolvedOldPath, resolvedNewPath);
		} catch (err: any) {
			if (err.code === 'ENOENT') {
				throw new Error(`Source file not found: ${oldPath}`);
			}
			throw err;
		}
	}

	async exists(path: string): Promise<boolean> {
		const { fs } = this;

		try {
			const resolvedPath = this.resolvePath(path);
			await this.assertSafePath(resolvedPath);
			await fs.access(resolvedPath);
			return true;
		} catch (error) {
			if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ELOOP') throw error;
			return false;
		}
	}

	async copy(src: string, dest: string, options: CopyOptions = {}): Promise<void> {
		const { fs } = this;

		const { signal, overwrite = true, shallow = false } = options;
		this.checkAborted(signal);

		const resolvedSrc = this.resolvePath(src);
		const resolvedDest = this.resolvePath(dest);
		await this.assertSafePath(resolvedSrc);
		await this.assertSafePath(resolvedDest, true);

		// Check if source exists
		try {
			const stat = await fs.stat(resolvedSrc);

			// Check if destination exists and overwrite is false
			if (!overwrite) {
				const exists = await this.exists(dest);
				if (exists) {
					throw new Error(`Destination already exists: ${dest}`);
				}
			}

			// Create parent directory if it doesn't exist
			const parentDir = this.getDirectoryName(resolvedDest);
			await this.mkdir(this.stripRoot(parentDir), { recursive: true });

			// Copy recursively or not based on shallow and if it's a directory
			await fs.cp(resolvedSrc, resolvedDest, {
				recursive: !shallow && stat.isDirectory(),
				force: overwrite,
			});
		} catch (err: any) {
			if (err.code === 'ENOENT') {
				throw new Error(`Source file not found: ${src}`);
			}
			throw err;
		}
	}

	createReadStream(filePath: string, options: CreateReadStreamOptions = {}): Readable {
		const resolvedPath = this.resolvePath(filePath);
		this.assertSafePathSync(resolvedPath);
		const { signal, range } = options;
		const stream = nodeCreateReadStream(resolvedPath, {
			start: range?.start,
			end: range?.end,
		});

		signal?.addEventListener('abort', () => stream.destroy(new Error('The operation was aborted')));

		return stream;
	}

	createWriteStream(filePath: string, options: CreateWriteStreamOptions = {}): Writable {
		const resolvedPath = this.resolvePath(filePath);
		this.assertSafePathSync(resolvedPath, true);
		const { signal } = options;
		const stream = nodeCreateWriteStream(resolvedPath, { flags: options.overwrite === false ? 'wx' : 'w' });

		signal?.addEventListener('abort', () => stream.destroy(new Error('The operation was aborted')));

		return stream;
	}

	// Helper to extract directory name correctly
	private getDirectoryName(filePath: string): string {
		return path.dirname(filePath);
	}

	private assertSafePath(filePath: string, allowMissing = false): Promise<void> {
		return assertNodePathHasNoSymlink({ allowMissing, fs: this.fs, path: filePath, root: this.root });
	}

	private assertSafePathSync(filePath: string, allowMissing = false): void {
		assertNodePathHasNoSymlinkSync({ allowMissing, path: filePath, root: this.root });
	}

	getUrl(needle: IFileStat | string) {
		if (typeof needle === 'object' && needle?.kind !== 'file') {
			return;
		}
		let path = typeof needle === 'string' ? needle : needle.path;
		if (!path) {
			return;
		}
		// file://
		const resolvedPath = this.resolvePath(path);
		this.assertSafePathSync(resolvedPath);
		return pathToFileURL(resolvedPath).toString();
	}
}
