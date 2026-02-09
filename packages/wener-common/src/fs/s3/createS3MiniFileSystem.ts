import { basename, dirname, normalize } from 'node:path';
import { Readable } from 'node:stream';
import { formatS3Url, parseS3Url, type ParseS3UrlOptions } from '@wener/common/s3';
import { S3mini, sanitizeETag } from 's3mini';
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
	WritableData,
	WriteFileOptions,
} from '../IFileSystem';

type CreateS3MiniFileSystemOptions = ParseS3UrlOptions & {
	client?: S3mini;
	/**
	 * Optional prefix to scope all operations within a specific folder in the bucket.
	 * All file operations will be relative to this prefix.
	 * Should not include leading or trailing slashes.
	 * Example: 'data/uploads' or 'backups/2024'
	 */
	prefix?: string;
};

export function createS3MiniFileSystem(options: CreateS3MiniFileSystemOptions = {}): S3FS {
	const parsed = parseS3Url(options);
	if (!parsed) {
		throw new Error('S3 URL or connection options are required');
	}

	const { client, prefix } = options;
	if (!client && (!parsed.endpoint || !parsed.bucket)) {
		throw new Error('S3 endpoint and bucket are required when client is not provided');
	}

	let s3mini: S3mini;
	let bucket: string;

	if (client) {
		s3mini = client;
		bucket = client.bucketName || parsed.bucket || '';
	} else {
		bucket = parsed.bucket || '';

		// Construct full endpoint URL with bucket for S3mini
		const endpointUrl = formatS3Url(parsed, {
			credentials: false,
			useParams: false,
		});

		s3mini = new S3mini({
			accessKeyId: parsed.accessKeyId || '',
			secretAccessKey: parsed.secretAccessKey || '',
			endpoint: endpointUrl,
			region: parsed.region,
		});
	}

	// Normalize prefix: remove leading/trailing slashes, ensure it ends with / when not empty
	const normalizedPrefix = prefix ? prefix.replace(/^\/+/, '').replace(/\/+$/, '') : '';

	return new S3FS(s3mini, bucket, normalizedPrefix);
}

class S3FS implements IFileSystem {
	constructor(
		readonly client: S3mini,
		readonly _bucket: string,
		private readonly prefix: string = '',
	) {}

	/**
	 * Normalize path to S3 key format (remove leading slash, handle relative paths)
	 * and prepend the prefix if one is set
	 */
	private normalizeKey(path: string): string {
		if (!path || path === '/') {
			return this.prefix;
		}
		const normalized = normalize(path).replace(/^\/+/, '').replace(/\\/g, '/');

		// Prepend prefix if set
		if (this.prefix) {
			return `${this.prefix}/${normalized}`;
		}
		return normalized;
	}

	/**
	 * Remove prefix from S3 key to get the file system path
	 */
	private stripPrefix(key: string): string {
		if (!this.prefix || !key.startsWith(`${this.prefix}/`)) {
			// If key doesn't start with prefix, return as-is (shouldn't happen normally)
			return key.startsWith('/') ? key : `/${key}`;
		}
		const withoutPrefix = key.slice(this.prefix.length);
		return withoutPrefix || '/';
	}

	/**
	 * Convert S3 key back to file system path (strip prefix and add leading slash)
	 */
	private keyToPath(key: string): string {
		if (!key) {
			return '/';
		}
		return this.stripPrefix(key);
	}

	/**
	 * Get directory path from a key
	 */
	private getDirectory(key: string): string {
		if (!key) {
			return '/';
		}
		const dir = dirname(key).replace(/\\/g, '/');
		return dir === '.' ? '/' : `/${dir}`;
	}

	/**
	 * Check if a key represents a directory (ends with /)
	 */
	private isDirectoryKey(key: string): boolean {
		return key.endsWith('/');
	}

	private toFileStat(
		key: string,
		obj: { Key: string; Size: number | string; LastModified?: Date | string; ETag?: string },
	): IFileStat {
		const isDir = this.isDirectoryKey(key);
		const path = this.keyToPath(key);
		const directory = this.getDirectory(key);
		const size = typeof obj.Size === 'string' ? parseInt(obj.Size, 10) || 0 : obj.Size || 0;
		const mtime = obj.LastModified ? new Date(obj.LastModified).getTime() : Date.now();

		return {
			directory,
			path,
			name: isDir ? basename(key.slice(0, -1)) || basename(directory) || '/' : basename(key),
			kind: isDir ? 'directory' : 'file',
			mtime,
			size,
			meta: obj.ETag ? { etag: sanitizeETag(obj.ETag) } : {},
		};
	}

	private checkAborted(signal?: AbortSignal): void {
		if (signal?.aborted) {
			throw new Error('The operation was aborted');
		}
	}

	async readdir(dir: string, options: ReaddirOptions = {}): Promise<IFileStat[]> {
		const { glob, recursive, depth = 1, kind, hidden = true, signal } = options;
		this.checkAborted(signal);

		const dirPrefix = this.normalizeKey(dir);
		const prefixWithSlash = dirPrefix ? (dirPrefix.endsWith('/') ? dirPrefix : `${dirPrefix}/`) : '';

		try {
			const delimiter = recursive ? '' : '/';

			// S3mini doesn't expose CommonPrefixes from delimiter-based listing.
			// For non-recursive listing, we do two calls:
			// 1. With delimiter to get direct files
			// 2. Without delimiter to infer directory prefixes
			let objects: Array<{ Key: string; Size: number | string; LastModified?: Date | string; ETag?: string }> = [];
			let commonPrefixes: string[] = [];

			if (delimiter && !recursive) {
				const directObjects = await this.client.listObjects(delimiter, prefixWithSlash, undefined, {
					delimiter,
					signal,
				});
				if (directObjects) {
					objects = directObjects;
				}

				// Infer CommonPrefixes by listing all objects recursively
				const allObjectsRecursive = await this.client.listObjects('', prefixWithSlash, 1000, { signal });
				if (allObjectsRecursive) {
					const prefixSet = new Set<string>();
					for (const obj of allObjectsRecursive) {
						const key = obj.Key || '';
						if (!key || !key.startsWith(prefixWithSlash)) continue;

						const relativeKey = key.slice(prefixWithSlash.length);
						const firstSlash = relativeKey.indexOf('/');
						if (firstSlash > 0) {
							prefixSet.add(prefixWithSlash + relativeKey.slice(0, firstSlash + 1));
						}
					}
					commonPrefixes = Array.from(prefixSet).sort();
				}
			} else {
				const listResult = await this.client.listObjects(delimiter, prefixWithSlash, undefined, { signal });
				if (listResult) {
					objects = listResult;
				}
			}

			if (!objects.length && !commonPrefixes.length) {
				return [];
			}

			let results: IFileStat[] = [];

			// Process inferred CommonPrefixes (directories)
			for (const prefix of commonPrefixes) {
				this.checkAborted(signal);
				if (prefixWithSlash && !prefix.startsWith(prefixWithSlash)) continue;

				const relativePrefix = prefixWithSlash ? prefix.slice(prefixWithSlash.length) : prefix;
				const dirName = relativePrefix.replace(/\/$/, '');
				if (!dirName) continue;

				if (!recursive && depth === 1) {
					if (dirName.indexOf('/') >= 0) continue;
				}

				const dirKey = prefix.endsWith('/') ? prefix : `${prefix}/`;
				const stat = this.toFileStat(dirKey, {
					Key: dirKey,
					Size: 0,
					LastModified: new Date(),
				});

				if (!hidden && stat.name.startsWith('.')) continue;
				if (kind && stat.kind !== kind) continue;

				results.push(stat);
			}

			// Process objects (files and explicit directory markers)
			const seenDirs = new Set<string>();
			for (const obj of objects) {
				this.checkAborted(signal);

				const key = obj.Key || '';
				if (!key) continue;
				if (prefixWithSlash && !key.startsWith(prefixWithSlash)) continue;

				const relativeKey = prefixWithSlash ? key.slice(prefixWithSlash.length) : key;
				if (!relativeKey || relativeKey === '/') continue;

				if (!recursive && depth === 1) {
					const firstSlash = relativeKey.indexOf('/');
					if (firstSlash >= 0) continue;
				}

				const isDir = this.isDirectoryKey(key);
				if (isDir) {
					const dk = key.slice(0, -1);
					if (seenDirs.has(dk)) continue;
					seenDirs.add(dk);
				}

				const stat = this.toFileStat(key, {
					Key: key,
					Size: obj.Size,
					LastModified: obj.LastModified,
					ETag: obj.ETag,
				});

				if (!hidden && stat.name.startsWith('.')) continue;
				if (kind && stat.kind !== kind) continue;

				results.push(stat);
			}

			// Handle recursive with depth > 1
			if (!recursive && depth > 1) {
				const subdirs = results.filter((entry) => entry.kind === 'directory');
				for (const subdir of subdirs) {
					this.checkAborted(signal);
					const maxDepth = depth - 1;
					if (maxDepth > 0) {
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
		} catch (error: any) {
			if (error.code === 'NoSuchKey' || error.message?.includes('404')) {
				throw new Error(`Directory not found: ${dir}`);
			}
			throw error;
		}
	}

	async stat(entry: string, options: StatOptions = {}): Promise<IFileStat> {
		const { signal } = options;
		this.checkAborted(signal);

		const key = this.normalizeKey(entry);
		if (!key) {
			// Root directory
			return {
				directory: '/',
				path: '/',
				name: '/',
				kind: 'directory',
				mtime: Date.now(),
				size: 0,
				meta: {},
			};
		}

		try {
			// Try to check if object exists and get metadata
			const exists = await this.client.objectExists(key, { signal });
			if (exists === true) {
				// Get ETag and size
				const etag = await this.client.getEtag(key, { signal });
				const size = await this.client.getContentLength(key);

				// Get LastModified from listing (since objectExists doesn't return it)
				const objects = await this.client.listObjects('/', key, 1, { delimiter: '/', signal });
				const obj = objects?.[0];

				return this.toFileStat(key, {
					Key: key,
					Size: size,
					LastModified: obj?.LastModified || new Date(),
					ETag: etag || undefined,
				});
			}

			// If object not found, try checking if it's a directory (prefix listing)
			const dirKey = key.endsWith('/') ? key : `${key}/`;
			const objects = await this.client.listObjects('/', dirKey, 1, { delimiter: '/', signal });

			if (objects && objects.length > 0) {
				// It's a directory
				return {
					directory: this.getDirectory(key),
					path: this.keyToPath(key),
					name: basename(key.replace(/\/$/, '')) || '/',
					kind: 'directory',
					mtime: Date.now(),
					size: 0,
					meta: {},
				};
			}

			throw new Error(`File not found: ${entry}`);
		} catch (error: any) {
			if (error.message?.includes('not found') || error.code === 'NoSuchKey') {
				throw new Error(`File not found: ${entry}`);
			}
			throw error;
		}
	}

	async mkdir(path: string, options: MkdirOptions = {}): Promise<void> {
		const { recursive: _recursive = false, signal } = options;
		this.checkAborted(signal);

		// In S3, directories don't actually exist - they're just prefixes
		// Optionally create a marker object (empty object with trailing slash)
		const key = this.normalizeKey(path);
		if (!key) {
			return; // Root directory, nothing to do
		}

		// Ensure it ends with / to indicate directory
		const dirKey = key.endsWith('/') ? key : `${key}/`;

		// Try to create a marker object (0-byte object)
		try {
			await this.client.putObject(dirKey, '', 'application/x-directory', undefined, undefined);
		} catch (error: any) {
			// If it already exists or we don't have permission, that's okay for mkdir
			if (!error.message?.includes('409') && !error.message?.includes('403')) {
				throw error;
			}
		}
	}

	async readFile(path: string, options?: ReadFileOptions & { encoding: 'text' }): Promise<string>;
	async readFile(path: string, options?: ReadFileOptions): Promise<Uint8Array>;
	async readFile(path: string, options: ReadFileOptions = {}): Promise<string | Uint8Array> {
		const { encoding = 'binary', signal, onDownloadProgress } = options;
		this.checkAborted(signal);

		const key = this.normalizeKey(path);
		if (!key) {
			throw new Error('Cannot read root directory');
		}

		try {
			// Use getObjectArrayBuffer for binary data
			const data = await this.client.getObjectArrayBuffer(key, { signal });

			if (!data) {
				throw new Error(`File not found: ${path}`);
			}

			// Handle progress reporting if needed
			if (onDownloadProgress) {
				onDownloadProgress({ loaded: data.byteLength, total: data.byteLength });
			}

			if (encoding === 'text') {
				return new TextDecoder().decode(data);
			}

			return new Uint8Array(data);
		} catch (error: any) {
			if (error.code === 'NoSuchKey' || error.message?.includes('404')) {
				throw new Error(`File not found: ${path}`);
			}
			throw error;
		}
	}

	async writeFile(path: string, data: WritableData, options: WriteFileOptions = {}): Promise<void> {
		const { signal, overwrite = true, onUploadProgress } = options;
		this.checkAborted(signal);

		const key = this.normalizeKey(path);
		if (!key) {
			throw new Error('Cannot write to root directory');
		}

		// Check if file exists and overwrite is false
		if (!overwrite) {
			const exists = await this.exists(path);
			if (exists) {
				throw new Error(`File already exists: ${path}`);
			}
		}

		// Convert data to buffer or string
		let body: string | Buffer;
		if (data instanceof ReadableStream) {
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
			body = Buffer.concat(chunks);
		} else if (data instanceof Readable) {
			// For streams, we need to read them into a buffer
			const chunks: Buffer[] = [];
			let loaded = 0;

			if (onUploadProgress) {
				data.on('data', (chunk: Buffer) => {
					chunks.push(chunk);
					loaded += chunk.length;
					onUploadProgress({ loaded, total: -1 });
				});
			} else {
				data.on('data', (chunk: Buffer) => {
					chunks.push(chunk);
				});
			}

			body = await new Promise<Buffer>((resolve, reject) => {
				const allChunks: Buffer[] = [];
				data.on('data', (chunk) => allChunks.push(chunk));
				data.on('end', () => resolve(Buffer.concat(allChunks)));
				data.on('error', reject);

				if (signal) {
					signal.addEventListener('abort', () => {
						data.destroy();
						reject(new Error('The operation was aborted'));
					});
				}
			});
		} else if (data instanceof ArrayBuffer) {
			body = Buffer.from(data);
		} else if (data instanceof Buffer) {
			body = data;
		} else if (typeof data === 'string') {
			body = data;
		} else {
			// ArrayBufferView
			body = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
		}
		await this.client.putObject(key, body, undefined, undefined, undefined);
	}

	async rm(path: string, options: RmOptions = {}): Promise<void> {
		const { recursive = false, force = false, signal } = options;
		this.checkAborted(signal);

		const key = this.normalizeKey(path);
		if (!key) {
			throw new Error('Cannot remove root directory');
		}

		try {
			if (recursive) {
				// List all objects with this prefix (no delimiter = recursive)
				const prefix = key.endsWith('/') ? key : `${key}/`;
				const objects = await this.client.listObjects('', prefix, undefined, { signal });

				if (objects) {
					// Delete all objects
					const keys = objects.map((obj) => obj.Key || '').filter(Boolean);
					if (keys.length > 0) {
						await this.client.deleteObjects(keys);
					}
				}

				// Also delete the marker object if it exists
				const markerKey = prefix;
				try {
					await this.client.deleteObject(markerKey);
				} catch {
					// Ignore if marker doesn't exist
				}
			} else {
				// Delete single object
				await this.client.deleteObject(key);
			}
		} catch (error: any) {
			if (force && (error.code === 'NoSuchKey' || error.message?.includes('404'))) {
				return;
			}
			throw error;
		}
	}

	async rename(oldPath: string, newPath: string, options: RenameOptions = {}): Promise<void> {
		const { signal, overwrite = false } = options;
		this.checkAborted(signal);

		const oldKey = this.normalizeKey(oldPath);
		const newKey = this.normalizeKey(newPath);

		if (!oldKey) {
			throw new Error('Cannot rename root directory');
		}

		// Check if target exists and overwrite is false
		if (!overwrite) {
			const exists = await this.exists(newPath);
			if (exists) {
				throw new Error(`Destination already exists: ${newPath}`);
			}
		}

		try {
			// Check if it's a directory (has objects with prefix)
			const isDir = oldKey.endsWith('/');
			const prefix = isDir ? oldKey : `${oldKey}/`;

			const objects = await this.client.listObjects('', prefix, undefined, { signal });

			if (objects && objects.length > 0) {
				// It's a directory or has multiple objects, move all
				const newPrefix = newKey.endsWith('/') ? newKey : `${newKey}/`;

				// Move all objects
				await Promise.all(
					objects.map(async (obj) => {
						const objKey = obj.Key || '';
						if (!objKey) return;

						const relativeKey = objKey.slice(prefix.length);
						const newObjKey = newPrefix + relativeKey;

						// Move object (copy + delete)
						await this.client.moveObject(objKey, newObjKey);
					}),
				);

				// Move marker object if it exists
				try {
					await this.client.moveObject(prefix, newPrefix);
				} catch {
					// Ignore if marker doesn't exist
				}
			} else {
				// Single file - use moveObject
				await this.client.moveObject(oldKey, newKey);
			}
		} catch (error: any) {
			if (error.code === 'NoSuchKey' || error.message?.includes('404')) {
				throw new Error(`Source file not found: ${oldPath}`);
			}
			throw error;
		}
	}

	async exists(path: string): Promise<boolean> {
		try {
			const key = this.normalizeKey(path);
			if (!key) {
				return true; // Root always exists
			}

			const exists = await this.client.objectExists(key);
			if (exists === true) {
				return true;
			}

			// Check if it's a directory
			const dirKey = key.endsWith('/') ? key : `${key}/`;
			const objects = await this.client.listObjects('/', dirKey, 1, { delimiter: '/' });
			return objects !== null && objects.length > 0;
		} catch {
			return false;
		}
	}

	async copy(src: string, dest: string, options: CopyOptions = {}): Promise<void> {
		const { signal, overwrite = true, shallow = false } = options;
		this.checkAborted(signal);

		const srcKey = this.normalizeKey(src);
		const destKey = this.normalizeKey(dest);

		if (!srcKey) {
			throw new Error('Cannot copy root directory');
		}

		// Check if source exists
		try {
			const srcStat = await this.stat(src);

			// Check if destination exists and overwrite is false
			if (!overwrite) {
				const exists = await this.exists(dest);
				if (exists) {
					throw new Error(`Destination already exists: ${dest}`);
				}
			}

			if (srcStat.kind === 'directory') {
				// Copy directory recursively
				const srcPrefix = srcKey.endsWith('/') ? srcKey : `${srcKey}/`;
				const destPrefix = destKey.endsWith('/') ? destKey : `${destKey}/`;

				const objects = await this.client.listObjects(shallow ? '/' : '', srcPrefix, undefined, {
					...(shallow ? { delimiter: '/' } : {}),
					signal,
				});

				if (objects) {
					// Copy all objects
					await Promise.all(
						objects.map(async (obj) => {
							const objKey = obj.Key || '';
							if (!objKey) return;

							const relativeKey = objKey.slice(srcPrefix.length);
							const newObjKey = destPrefix + relativeKey;

							await this.client.copyObject(objKey, newObjKey);
						}),
					);
				}

				// Copy marker object if it exists
				try {
					await this.client.copyObject(srcPrefix, destPrefix);
				} catch {
					// Ignore if marker doesn't exist
				}
			} else {
				// Copy single file
				await this.client.copyObject(srcKey, destKey);
			}
		} catch (error: any) {
			if (error.code === 'NoSuchKey' || error.message?.includes('404')) {
				throw new Error(`Source file not found: ${src}`);
			}
			throw error;
		}
	}

	createReadStream(path: string, options: CreateReadStreamOptions = {}): Readable {
		const key = this.normalizeKey(path);
		if (!key) {
			throw new Error('Cannot read root directory');
		}

		const { range, signal } = options;

		// Use getObjectRaw with range support
		const responsePromise = this.client.getObjectRaw(key, !range, range?.start, range?.end, { signal }, undefined);

		// Convert Response to Readable stream
		let nodeStream: Readable | null = null;

		const stream = new Readable({
			async read() {
				if (!nodeStream) {
					try {
						const response = await responsePromise;
						if (!response.body) {
							this.emit('error', new Error('No response body'));
							return;
						}

						// Convert ReadableStream to Node Readable
						const reader = response.body.getReader();
						const _decoder = new TextDecoder();

						nodeStream = new Readable({
							async read() {
								try {
									const { done, value } = await reader.read();
									if (done) {
										this.push(null);
									} else {
										this.push(Buffer.from(value));
									}
								} catch (err) {
									this.emit('error', err);
								}
							},
						});

						nodeStream.on('data', (chunk) => {
							this.push(chunk);
						});

						nodeStream.on('end', () => {
							this.push(null);
						});

						nodeStream.on('error', (err) => {
							this.emit('error', err);
						});
					} catch (err: any) {
						this.emit('error', err);
					}
				}
			},
		});

		signal?.addEventListener('abort', () => {
			stream.destroy(new Error('The operation was aborted'));
		});

		return stream;
	}

	createReadableStream(path: string, options: CreateReadStreamOptions = {}): ReadableStream {
		const key = this.normalizeKey(path);
		if (!key) {
			throw new Error('Cannot read root directory');
		}

		const { range, signal } = options;

		// Use getObjectRaw which returns a Response with ReadableStream
		const responsePromise = this.client.getObjectRaw(key, !range, range?.start, range?.end, { signal }, undefined);

		return new ReadableStream({
			async start(controller) {
				try {
					const response = await responsePromise;
					if (!response.body) {
						controller.error(new Error('No response body'));
						return;
					}

					const reader = response.body.getReader();

					signal?.addEventListener('abort', () => {
						reader.cancel(new Error('The operation was aborted'));
						controller.error(new Error('The operation was aborted'));
					});

					while (true) {
						const { done, value } = await reader.read();
						if (done) {
							controller.close();
							break;
						}
						controller.enqueue(value);
					}
				} catch (err) {
					controller.error(err);
				}
			},
		});
	}

	createWritableStream(path: string, options: CreateWriteStreamOptions = {}): WritableStream {
		const key = this.normalizeKey(path);
		if (!key) {
			throw new Error('Cannot write to root directory');
		}

		const { signal, overwrite: _overwrite = true } = options;
		this.checkAborted(signal);

		// Create a WritableStream that buffers data and uploads when done
		const buffer: Uint8Array[] = [];
		let controller: WritableStreamDefaultController;
		const client = this.client;
		const checkAborted = this.checkAborted.bind(this);

		return new WritableStream({
			start(ctrl) {
				controller = ctrl;
			},
			async write(chunk) {
				buffer.push(chunk);
			},
			async close() {
				try {
					checkAborted(signal);
					const data = Buffer.concat(buffer.map((chunk) => Buffer.from(chunk)));
					await client.putObject(key, data, undefined, undefined, undefined);
					// Controller closes automatically when close() completes successfully
				} catch (error) {
					controller.error(error);
				}
			},
			abort(reason) {
				buffer.length = 0;
				controller.error(reason);
			},
		});
	}

	getUrl(path: IFileStat | string, _options?: any): string | undefined {
		if (typeof path === 'object' && path?.kind !== 'file') {
			return;
		}
		const key = typeof path === 'string' ? this.normalizeKey(path) : this.normalizeKey(path.path);
		if (!key) {
			return;
		}

		// Construct URL from endpoint - S3mini doesn't provide presigned URLs in basic API
		// This is a fallback - real implementation would need presigned URLs
		return undefined;
	}
}
