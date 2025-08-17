import {
	createReadStream as nodeCreateReadStream,
	createWriteStream as nodeCreateWriteStream,
	type Stats,
} from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { Readable, type Writable } from 'node:stream';
import { pathToFileURL } from 'node:url';
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
} from '../IFileSystem';

export type INodeFileSystem = IFileSystem & {
	readonly root: string;
	resolvePath(filePath: string): string;
};

/**
 * Creates a Node.js filesystem adapter that implements the IFileSystem interface
 * @param options Configuration options for the filesystem
 * @param options.root Optional root directory to restrict all operations within
 */
export function createNodeFileSystem(options: { root?: string } = {}): INodeFileSystem {
	return new NodeFs(options);
}

type IFS = typeof import('fs/promises');

class NodeFs implements INodeFileSystem {
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
		if (!resolvedPath.startsWith(this.root)) {
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
			relativePath = '/' + relativePath;
		}

		// Normalize to ensure consistent path separators
		return path.normalize(relativePath).replace(/\\/g, '/');
	}

	/**
	 * Converts a system file stat to our IFileStat interface,
	 * stripping the root prefix from paths
	 */
	private toFileStat(fullPath: string, fsStats: Stats): IFileStat {
		const normalizedPath = this.stripRoot(fullPath);
		const directoryPath = path.dirname(normalizedPath);
		const directory = directoryPath === '.' ? '/' : directoryPath.replace(/\\/g, '/');

		return {
			directory,
			path: normalizedPath,
			name: path.basename(fullPath),
			kind: fsStats.isDirectory() ? 'directory' : 'file',
			mtime: fsStats.mtimeMs,
			size: fsStats.size,
			meta: {},
		};
	}

	async readdir(dir: string, options: ReaddirOptions = {}): Promise<IFileStat[]> {
		const { fs } = this;
		const { glob, recursive, depth = 1, kind, hidden = true, signal } = options;
		this.checkAborted(signal);

		// Resolve the directory path with security checks
		const resolvedDir = this.resolvePath(dir);

		// Basic file listing
		const entries = await fs.readdir(resolvedDir, { withFileTypes: true });
		let results = await Promise.all(
			entries
				.filter((entry) => hidden || !entry.name.startsWith('.'))
				.filter((entry) => !kind || (kind === 'directory' ? entry.isDirectory() : entry.isFile()))
				.map(async (entry) => {
					this.checkAborted(signal);

					const entryFullPath = path.join(resolvedDir, entry.name);
					const stat = await fs.stat(entryFullPath);

					// Convert to external representation
					return {
						directory: this.stripRoot(resolvedDir),
						path: this.stripRoot(entryFullPath),
						name: entry.name,
						kind: entry.isDirectory() ? 'directory' : 'file',
						mtime: stat.mtimeMs,
						size: stat.size,
						meta: {},
					} as IFileStat;
				}),
		);

		// Handle recursive option
		if (recursive || depth > 1) {
			const subdirs = results.filter((entry) => entry.kind === 'directory');

			for (const subdir of subdirs) {
				this.checkAborted(signal);

				const maxDepth = recursive ? Infinity : depth - 1;
				if (maxDepth > 0) {
					// Need to convert the path back to a full path for the recursive call
					const subdirFullPath = this.resolvePath(subdir.path);

					const subEntries = await this.readdir(subdir.path, {
						...options,
						depth: maxDepth,
					});
					results = [...results, ...subEntries];
				}
			}
		}

		// Handle glob filtering
		if (glob) {
			const { matcher } = await import('micromatch');
			const match = matcher(glob);
			results = results.filter((entry) => match(entry.path));
		}

		return results;
	}

	async stat(filePath: string, options: StatOptions = {}): Promise<IFileStat> {
		const { fs } = this;

		const { signal } = options;
		this.checkAborted(signal);

		const resolvedPath = this.resolvePath(filePath);

		try {
			const stat = await fs.stat(resolvedPath);
			return this.toFileStat(resolvedPath, stat);
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
		this.checkAborted(signal);

		const resolvedPath = this.resolvePath(path);

		try {
			// Handle progress reporting if needed
			if (onDownloadProgress) {
				const stat = await fs.stat(resolvedPath);
				const stream = this.createReadStream(resolvedPath, { signal });

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

	async writeFile(
		path: string,
		data: string | Buffer | ArrayBuffer | Readable,
		options: WriteFileOptions = {},
	): Promise<void> {
		const { fs } = this;

		const { signal, overwrite = true, onUploadProgress } = options;
		this.checkAborted(signal);

		const resolvedPath = this.resolvePath(path);

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
				const writeStream = this.createWriteStream(resolvedPath, options);
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
		} else {
			// Convert ArrayBuffer to Buffer if necessary
			if (data instanceof ArrayBuffer) {
				data = Buffer.from(data);
			}
			await fs.writeFile(resolvedPath, data);
		}
	}

	async rm(path: string, options: RmOptions = {}): Promise<void> {
		const { fs } = this;

		const { recursive = false, force = false, signal } = options;
		this.checkAborted(signal);

		const resolvedPath = this.resolvePath(path);

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
			await fs.access(this.resolvePath(path));
			return true;
		} catch {
			return false;
		}
	}

	async copy(src: string, dest: string, options: CopyOptions = {}): Promise<void> {
		const { fs } = this;

		const { signal, overwrite = true, shallow = false } = options;
		this.checkAborted(signal);

		const resolvedSrc = this.resolvePath(src);
		const resolvedDest = this.resolvePath(dest);

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
		const { signal } = options;
		const stream = nodeCreateWriteStream(resolvedPath, { flags: options.overwrite === false ? 'wx' : 'w' });

		signal?.addEventListener('abort', () => stream.destroy(new Error('The operation was aborted')));

		return stream;
	}

	// Helper to extract directory name correctly
	private getDirectoryName(filePath: string): string {
		return path.dirname(filePath);
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
		return pathToFileURL(this.resolvePath(path)).toString();
	}
}
