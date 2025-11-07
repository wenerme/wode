import { basename, dirname, normalize } from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import { parseS3Url, type ParseS3UrlOptions } from '@wener/common/s3';
import type * as Minio from 'minio';
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

type CreateMinioFileSystemOptions = ParseS3UrlOptions & {
	client?: Minio.Client;
	/**
	 * Optional prefix to scope all operations within a specific folder in the bucket.
	 * All file operations will be relative to this prefix.
	 * Should not include leading or trailing slashes.
	 * Example: 'data/uploads' or 'backups/2024'
	 */
	prefix?: string;
};

export function createMinioFileSystem(options: CreateMinioFileSystemOptions = {}): MinioFS {
	const parsed = parseS3Url(options);
	if (!parsed) {
		throw new Error('S3 URL or connection options are required');
	}

	const { client, prefix } = options;
	if (!client && (!parsed.endpoint || !parsed.bucket)) {
		throw new Error('S3 endpoint and bucket are required when client is not provided');
	}

	let minioClient: Minio.Client;
	let bucket: string;

	if (client) {
		minioClient = client;
		bucket = parsed.bucket || '';
	} else {
		bucket = parsed.bucket || '';

		// Import Minio dynamically to avoid requiring it as a dependency
		const Minio = require('minio');
		minioClient = new Minio.Client({
			endPoint: parsed.endpoint,
			port: parsed.port,
			useSSL: parsed.useSsl ?? true,
			accessKey: parsed.accessKeyId || '',
			secretKey: parsed.secretAccessKey || '',
			region: parsed.region,
			pathStyle: parsed.pathStyle,
		});
	}

	// Normalize prefix: remove leading/trailing slashes
	const normalizedPrefix = prefix ? prefix.replace(/^\/+/, '').replace(/\/+$/, '') : '';

	return new MinioFS(minioClient, bucket, normalizedPrefix);
}

class MinioFS implements IFileSystem {
	constructor(
		private readonly client: Minio.Client,
		private readonly bucket: string,
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
			return this.prefix + '/' + normalized;
		}
		return normalized;
	}

	/**
	 * Remove prefix from S3 key to get the file system path
	 */
	private stripPrefix(key: string): string {
		if (!key) {
			return '/';
		}
		// If key is just the prefix (or empty after stripping), return root
		if (this.prefix && key === this.prefix) {
			return '/';
		}
		if (!this.prefix || !key.startsWith(this.prefix + '/')) {
			return key.startsWith('/') ? key : '/' + key;
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
		return dir === '.' ? '/' : '/' + dir;
	}

	/**
	 * Check if a key represents a directory (ends with /)
	 */
	private isDirectoryKey(key: string): boolean {
		return key.endsWith('/');
	}

	/**
	 * Convert MinIO object metadata to IFileStat
	 */
	private toFileStat(key: string, obj: { name: string; size: number; lastModified: Date; etag?: string }): IFileStat {
		const isDir = this.isDirectoryKey(key);
		const path = this.keyToPath(key);
		const directory = this.getDirectory(key);

		return {
			directory,
			path,
			name: isDir ? basename(key.slice(0, -1)) || basename(directory) || '/' : basename(key),
			kind: isDir ? 'directory' : 'file',
			mtime: obj.lastModified ? new Date(obj.lastModified).getTime() : Date.now(),
			size: obj.size || 0,
			meta: {
				...(obj.etag ? { etag: obj.etag.replace(/"/g, '') } : {}),
			},
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
		const prefixWithSlash = dirPrefix ? (dirPrefix.endsWith('/') ? dirPrefix : dirPrefix + '/') : '';

		try {
			// MinIO listObjects supports recursive option
			// When recursive=false, MinIO uses delimiter='/' internally to return CommonPrefixes
			const objects: Array<{ name: string; prefix?: string; size: number; lastModified: Date; etag: string }> = [];
			const commonPrefixes: string[] = [];

			// MinIO listObjects returns a stream
			// When recursive=false, it returns both objects and prefixes (CommonPrefixes)
			const objectStream = this.client.listObjects(this.bucket, prefixWithSlash, recursive);

			await new Promise<void>((resolve, reject) => {
				objectStream.on('data', (obj: any) => {
					if (obj.name) {
						objects.push({
							name: obj.name,
							size: obj.size || 0,
							lastModified: obj.lastModified || new Date(),
							etag: obj.etag || '',
						});
					} else if (obj.prefix) {
						// CommonPrefixes from MinIO
						commonPrefixes.push(obj.prefix);
					}
				});

				objectStream.on('end', () => {
					resolve();
				});

				objectStream.on('error', (err: any) => {
					reject(err);
				});

				if (signal) {
					signal.addEventListener('abort', () => {
						objectStream.destroy();
						reject(new Error('The operation was aborted'));
					});
				}
			});

			let results: IFileStat[] = [];

			// Process CommonPrefixes (directories) first
			for (const prefix of commonPrefixes) {
				this.checkAborted(signal);

				// Skip if not under our prefix
				if (prefixWithSlash && !prefix.startsWith(prefixWithSlash)) {
					continue;
				}

				// Get relative path
				const relativePrefix = prefixWithSlash ? prefix.slice(prefixWithSlash.length) : prefix;
				const dirName = relativePrefix.replace(/\/$/, ''); // Remove trailing slash

				if (!dirName) continue;

				// For non-recursive, only show immediate children
				if (!recursive && depth === 1) {
					const firstSlash = dirName.indexOf('/');
					if (firstSlash >= 0) {
						continue;
					}
				}

				const dirKey = prefix.endsWith('/') ? prefix : prefix + '/';
				const stat = this.toFileStat(dirKey, {
					name: dirKey,
					size: 0,
					lastModified: new Date(),
				});

				// Filter by hidden
				if (!hidden && stat.name.startsWith('.')) {
					continue;
				}

				// Filter by kind
				if (kind && stat.kind !== kind) {
					continue;
				}

				results.push(stat);
			}

			// Process objects (files) to convert to IFileStat
			const seenDirs = new Set<string>();
			for (const obj of objects) {
				this.checkAborted(signal);

				const key = obj.name;
				if (!key) continue;

				// Skip if not under our prefix
				if (prefixWithSlash && !key.startsWith(prefixWithSlash)) {
					continue;
				}

				// Strip the prefix from the key for path conversion
				const relativeKey = prefixWithSlash ? key.slice(prefixWithSlash.length) : key;

				// Calculate depth: count the number of slashes in the relative path
				// depth=1 means immediate children (no slashes), depth=2 means one level deep (one slash), etc.
				const depthLevel = (relativeKey.match(/\//g) || []).length + 1;
				
				// Filter by depth
				if (depthLevel > depth) {
					continue;
				}

				const isDir = this.isDirectoryKey(key);

				// Track directories to avoid duplicates
				if (isDir) {
					const dirKey = key.slice(0, -1);
					if (seenDirs.has(dirKey)) {
						continue;
					}
					seenDirs.add(dirKey);
				} else {
					// For files in recursive mode, always include them
					// For non-recursive mode, check if parent directory was already added
					if (!recursive) {
						const parentDir = dirname(key).replace(/\\/g, '/') + '/';
						if (seenDirs.has(parentDir.slice(0, -1))) {
							continue;
						}
					}
				}

				const stat = this.toFileStat(key, {
					name: key,
					size: obj.size || 0,
					lastModified: obj.lastModified,
					etag: obj.etag,
				});

				// Filter by hidden
				if (!hidden && stat.name.startsWith('.')) {
					continue;
				}

				// Filter by kind
				if (kind && stat.kind !== kind) {
					continue;
				}

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
			if (error.code === 'NoSuchKey' || error.message?.includes('404') || error.code === 'NotFound') {
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
			// Try to get object stat
			const stat = await this.client.statObject(this.bucket, key);
			return this.toFileStat(key, {
				name: key,
				size: stat.size,
				lastModified: stat.lastModified,
				etag: stat.etag,
			});
		} catch (error: any) {
			// If object not found, try checking if it's a directory
			if (error.code === 'NotFound' || error.code === 'NoSuchKey') {
				const dirKey = key.endsWith('/') ? key : key + '/';
				try {
					// List objects with this prefix to check if it's a directory
					const objectStream = this.client.listObjects(this.bucket, dirKey, false);
					let hasObjects = false;

					await new Promise<void>((resolve, reject) => {
						objectStream.on('data', () => {
							hasObjects = true;
							objectStream.destroy();
							resolve();
						});

						objectStream.on('end', () => {
							resolve();
						});

						objectStream.on('error', reject);

						if (signal) {
							signal.addEventListener('abort', () => {
								objectStream.destroy();
								reject(new Error('The operation was aborted'));
							});
						}
					});

					if (hasObjects) {
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
				} catch {
					// Ignore listing errors
				}

				throw new Error(`File not found: ${entry}`);
			}
			throw error;
		}
	}

	async mkdir(path: string, options: MkdirOptions = {}): Promise<void> {
		const { recursive = false, signal } = options;
		this.checkAborted(signal);

		// In S3, directories don't actually exist - they're just prefixes
		// Optionally create a marker object (empty object with trailing slash)
		const key = this.normalizeKey(path);
		if (!key) {
			return; // Root directory, nothing to do
		}

		// Ensure it ends with / to indicate directory
		const dirKey = key.endsWith('/') ? key : key + '/';

		// Try to create a marker object (0-byte object)
		try {
			const stream = new PassThrough();
			stream.end();
			await this.client.putObject(this.bucket, dirKey, stream, 0, {
				'Content-Type': 'application/x-directory',
			});
		} catch (error: any) {
			// If it already exists or we don't have permission, that's okay for mkdir
			if (error.code !== 'NoSuchBucket' && error.code !== 'AccessDenied') {
				// Ignore other errors for mkdir
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
			// MinIO getObject returns Promise<Readable>
			const nodeStream = await this.client.getObject(this.bucket, key);
			const chunks: Buffer[] = [];
			let loaded = 0;
			let total = 0;

			// Get object size for progress if available
			try {
				const stat = await this.client.statObject(this.bucket, key);
				total = stat.size;
			} catch {
				// Ignore if stat fails
			}

			return new Promise((resolve, reject) => {
				nodeStream.on('data', (chunk: Buffer) => {
					chunks.push(chunk);
					loaded += chunk.length;
					if (onDownloadProgress) {
						onDownloadProgress({ loaded, total: total || -1 });
					}
				});

				nodeStream.on('end', () => {
					const buffer = Buffer.concat(chunks);
					if (encoding === 'text') {
						resolve(buffer.toString('utf-8'));
					} else {
						resolve(new Uint8Array(buffer));
					}
				});

				nodeStream.on('error', reject);

				if (signal) {
					signal.addEventListener('abort', () => {
						if (nodeStream.destroy) {
							nodeStream.destroy(new Error('The operation was aborted'));
						}
						reject(new Error('The operation was aborted'));
					});
				}
			});
		} catch (error: any) {
			if (error.code === 'NoSuchKey' || error.code === 'NotFound') {
				throw new Error(`File not found: ${path}`);
			}
			throw error;
		}
	}

	async writeFile(
		path: string,
		data: string | Buffer | ArrayBuffer | Readable | ArrayBufferView,
		options: WriteFileOptions = {},
	): Promise<void> {
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

		// Convert data to stream or buffer
		let stream: Readable;
		let size: number;

		if (data instanceof Readable) {
			stream = data;
			size = 0; // Unknown size
		} else {
			let buffer: Buffer;
			if (data instanceof ArrayBuffer) {
				buffer = Buffer.from(data);
			} else if (data instanceof Buffer) {
				buffer = data;
			} else if (typeof data === 'string') {
				buffer = Buffer.from(data, 'utf-8');
			} else {
				// ArrayBufferView
				buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
			}

			size = buffer.length;
			stream = new Readable();
			stream.push(buffer);
			stream.push(null);
		}

		// Wrap stream for progress tracking if needed
		if (onUploadProgress) {
			let loaded = 0;
			const progressStream = new PassThrough();
			stream.on('data', (chunk: Buffer) => {
				loaded += chunk.length;
				onUploadProgress({ loaded, total: size || -1 });
			});
			stream.pipe(progressStream);
			stream = progressStream;
		}

		try {
			await this.client.putObject(this.bucket, key, stream, size);
		} catch (error: any) {
			throw error;
		}
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
				// List all objects with this prefix
				const prefix = key.endsWith('/') ? key : key + '/';
				const objectStream = this.client.listObjects(this.bucket, prefix, true);
				const keys: string[] = [];

				await new Promise<void>((resolve, reject) => {
					objectStream.on('data', (obj: any) => {
						if (obj.name) {
							keys.push(obj.name);
						}
					});

					objectStream.on('end', () => {
						resolve();
					});

					objectStream.on('error', reject);

					if (signal) {
						signal.addEventListener('abort', () => {
							objectStream.destroy();
							reject(new Error('The operation was aborted'));
						});
					}
				});

				// Delete all objects
				if (keys.length > 0) {
					await this.client.removeObjects(this.bucket, keys);
				}

				// Also delete the marker object if it exists
				const markerKey = prefix;
				try {
					await this.client.removeObject(this.bucket, markerKey);
				} catch {
					// Ignore if marker doesn't exist
				}
			} else {
				// Delete single object
				try {
					await this.client.removeObject(this.bucket, key);
				} catch (error: any) {
					// Check if it's a directory with files
					if (error.code === 'NoSuchKey' || error.code === 'NotFound') {
						const prefix = key.endsWith('/') ? key : key + '/';
						const objectStream = this.client.listObjects(this.bucket, prefix, false);
						let hasObjects = false;

						await new Promise<void>((resolve) => {
							objectStream.on('data', () => {
								hasObjects = true;
								objectStream.destroy();
								resolve();
							});

							objectStream.on('end', () => {
								resolve();
							});

							objectStream.on('error', () => {
								resolve();
							});
						});

						if (hasObjects) {
							if (!force) {
								throw new Error('Directory not empty');
							}
							// If force, delete recursively
							const recursiveStream = this.client.listObjects(this.bucket, prefix, true);
							const keys: string[] = [];
							await new Promise<void>((resolve) => {
								recursiveStream.on('data', (obj: any) => {
									if (obj.name) {
										keys.push(obj.name);
									}
								});
								recursiveStream.on('end', () => resolve());
								recursiveStream.on('error', () => resolve());
							});
							if (keys.length > 0) {
								await this.client.removeObjects(this.bucket, keys);
							}
							// Also try to remove the marker
							try {
								await this.client.removeObject(this.bucket, prefix);
							} catch {
								// Ignore
							}
						} else {
							// File doesn't exist
							if (!force) {
								throw new Error('File not found');
							}
							// If force, just return without error
							return;
						}
					} else if (!force) {
						throw error;
					}
				}
			}
		} catch (error: any) {
			if (force && (error.code === 'NoSuchKey' || error.code === 'NotFound')) {
				return;
			}
			if (force && error.message === 'File not found') {
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
			const prefix = isDir ? oldKey : oldKey + '/';

			const objectStream = this.client.listObjects(this.bucket, prefix, true);
			const objects: Array<{ name: string }> = [];

			await new Promise<void>((resolve, reject) => {
				objectStream.on('data', (obj: any) => {
					if (obj.name) {
						objects.push({ name: obj.name });
					}
				});

				objectStream.on('end', () => {
					resolve();
				});

				objectStream.on('error', reject);

				if (signal) {
					signal.addEventListener('abort', () => {
						objectStream.destroy();
						reject(new Error('The operation was aborted'));
					});
				}
			});

			if (objects.length > 0) {
				// It's a directory or has multiple objects, move all
				const newPrefix = newKey.endsWith('/') ? newKey : newKey + '/';

				// Move all objects
				await Promise.all(
					objects.map(async (obj) => {
						const objKey = obj.name;
						if (!objKey) return;

						const relativeKey = objKey.slice(prefix.length);
						const newObjKey = newPrefix + relativeKey;

						// Copy then delete
						// MinIO copyObject signature: copyObject(bucketName, objectName, sourceObject)
						// sourceObject should be a string in format "bucket/object"
						await this.client.copyObject(this.bucket, newObjKey, `${this.bucket}/${objKey}`);
						await this.client.removeObject(this.bucket, objKey);
					}),
				);

				// Move marker object if it exists (skip if it's a directory marker with data)
				try {
					// Check if it's a directory marker (ends with /)
					if (prefix.endsWith('/')) {
						// Try to copy the marker, but skip if it fails due to "contains data payload"
						try {
							await this.client.copyObject(this.bucket, newPrefix, `${this.bucket}/${prefix}`);
							await this.client.removeObject(this.bucket, prefix);
						} catch (error: any) {
							// If error is about data payload, just remove the old marker
							// Directory markers are optional in S3
							if (error.message?.includes('data payload') || error.code === 'InvalidRequest') {
								await this.client.removeObject(this.bucket, prefix);
							} else {
								throw error;
							}
						}
					} else {
						await this.client.copyObject(this.bucket, newPrefix, `${this.bucket}/${prefix}`);
						await this.client.removeObject(this.bucket, prefix);
					}
				} catch {
					// Ignore if marker doesn't exist
				}
			} else {
				// Single file - copy then delete
				await this.client.copyObject(this.bucket, newKey, `${this.bucket}/${oldKey}`);
				await this.client.removeObject(this.bucket, oldKey);
			}
		} catch (error: any) {
			if (error.code === 'NoSuchKey' || error.code === 'NotFound') {
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

			await this.client.statObject(this.bucket, key);
			return true;
		} catch (error: any) {
			if (error.code === 'NotFound' || error.code === 'NoSuchKey') {
				// Check if it's a directory
				const key = this.normalizeKey(path);
				const dirKey = key.endsWith('/') ? key : key + '/';
				try {
					const objectStream = this.client.listObjects(this.bucket, dirKey, false);
					let hasObjects = false;

					await new Promise<void>((resolve) => {
						objectStream.on('data', () => {
							hasObjects = true;
							objectStream.destroy();
							resolve();
						});

						objectStream.on('end', () => {
							resolve();
						});

						objectStream.on('error', () => {
							resolve();
						});
					});

					return hasObjects;
				} catch {
					return false;
				}
			}
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
				const srcPrefix = srcKey.endsWith('/') ? srcKey : srcKey + '/';
				const destPrefix = destKey.endsWith('/') ? destKey : destKey + '/';

				const objectStream = this.client.listObjects(this.bucket, srcPrefix, !shallow);
				const objects: Array<{ name: string }> = [];

				await new Promise<void>((resolve, reject) => {
					objectStream.on('data', (obj: any) => {
						if (obj.name) {
							objects.push({ name: obj.name });
						}
					});

					objectStream.on('end', () => {
						resolve();
					});

					objectStream.on('error', reject);

					if (signal) {
						signal.addEventListener('abort', () => {
							objectStream.destroy();
							reject(new Error('The operation was aborted'));
						});
					}
				});

				// Copy all objects
				await Promise.all(
					objects.map(async (obj: { name: string }) => {
						const objKey = obj.name;
						if (!objKey) return;

						const relativeKey = objKey.slice(srcPrefix.length);
						const newObjKey = destPrefix + relativeKey;

						await this.client.copyObject(this.bucket, newObjKey, `${this.bucket}/${objKey}`);
					}),
				);

				// Copy marker object if it exists (skip if it's a directory marker with data)
				try {
					// Check if it's a directory marker (ends with /)
					if (srcPrefix.endsWith('/')) {
						// Try to copy the marker, but skip if it fails due to "contains data payload"
						try {
							await this.client.copyObject(this.bucket, destPrefix, `${this.bucket}/${srcPrefix}`);
						} catch (error: any) {
							// If error is about data payload, just skip copying the marker
							// Directory markers are optional in S3
							if (!error.message?.includes('data payload') && error.code !== 'InvalidRequest') {
								throw error;
							}
						}
					} else {
						await this.client.copyObject(this.bucket, destPrefix, `${this.bucket}/${srcPrefix}`);
					}
				} catch {
					// Ignore if marker doesn't exist
				}
			} else {
				// Copy single file
				await this.client.copyObject(this.bucket, destKey, `${this.bucket}/${srcKey}`);
			}
		} catch (error: any) {
			if (error.code === 'NoSuchKey' || error.code === 'NotFound') {
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

		// MinIO getObject and getPartialObject both return Promise<Readable>
		// Create a Readable stream that waits for the promise to resolve
		const client = this.client;
		const bucket = this.bucket;
		const readable = new Readable({
			async read() {
				// Only initialize once
				if ((readable as any)._initialized) {
					return;
				}
				(readable as any)._initialized = true;

				try {
					let nodeStream: Readable;
					
					if (range) {
						// Use getPartialObject for range requests
						// getPartialObject's length parameter: number of bytes to read (not end position)
						// So for range {start: 0, end: 4}, we need length = end - start + 1 = 5
						const length = range.end !== undefined ? range.end - range.start + 1 : undefined;
						nodeStream = await client.getPartialObject(bucket, key, range.start, length);
					} else {
						nodeStream = await client.getObject(bucket, key);
					}

					// Pipe the actual stream to our readable
					nodeStream.on('data', (chunk) => {
						if (!readable.push(chunk)) {
							// If push returns false, the stream is backpressured
							nodeStream.pause();
						}
					});

					nodeStream.on('end', () => {
						readable.push(null);
					});

					nodeStream.on('error', (err) => {
						readable.emit('error', err);
					});

					if (signal) {
						signal.addEventListener('abort', () => {
							if (nodeStream.destroy) {
								nodeStream.destroy(new Error('The operation was aborted'));
							}
							readable.emit('error', new Error('The operation was aborted'));
						});
					}
				} catch (error: any) {
					readable.emit('error', error);
				}
			},
		});

		return readable;
	}

	createReadableStream(path: string, options: CreateReadStreamOptions = {}): ReadableStream {
		const key = this.normalizeKey(path);
		if (!key) {
			throw new Error('Cannot read root directory');
		}

		const { range, signal } = options;

		// MinIO getObject and getPartialObject both return Promise<Readable>
		const client = this.client;
		const bucket = this.bucket;
		return new ReadableStream({
			async start(controller) {
				try {
					let nodeStream: Readable;
					
					if (range) {
						// Use getPartialObject for range requests
						// getPartialObject's length parameter: number of bytes to read (not end position)
						// So for range {start: 0, end: 4}, we need length = end - start + 1 = 5
						const length = range.end !== undefined ? range.end - range.start + 1 : undefined;
						nodeStream = await client.getPartialObject(bucket, key, range.start, length);
					} else {
						nodeStream = await client.getObject(bucket, key);
					}

					nodeStream.on('data', (chunk) => {
						controller.enqueue(chunk);
					});

					nodeStream.on('end', () => {
						controller.close();
					});

					nodeStream.on('error', (err) => {
						controller.error(err);
					});

					if (signal) {
						signal.addEventListener('abort', () => {
							if (nodeStream.destroy) {
								nodeStream.destroy(new Error('The operation was aborted'));
							}
							controller.error(new Error('The operation was aborted'));
						});
					}
				} catch (error: any) {
					controller.error(error);
				}
			},
		});
	}

	createWritableStream(path: string, options: CreateWriteStreamOptions = {}): WritableStream {
		const key = this.normalizeKey(path);
		if (!key) {
			throw new Error('Cannot write to root directory');
		}

		const { signal, overwrite = true } = options;
		this.checkAborted(signal);

		// Create a WritableStream that buffers data and uploads when done
		const buffer: Uint8Array[] = [];
		let controller: WritableStreamDefaultController;
		const client = this.client;
		const bucket = this.bucket;
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
					const stream = new Readable();
					stream.push(data);
					stream.push(null);
					await client.putObject(bucket, key, stream, data.length);
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

	getUrl(path: IFileStat | string, options?: any): string | undefined {
		if (typeof path === 'object' && path?.kind !== 'file') {
			return;
		}
		const key = typeof path === 'string' ? this.normalizeKey(path) : this.normalizeKey(path.path);
		if (!key) {
			return;
		}

		// MinIO supports presigned URLs, but getUrl is synchronous
		// We can't generate presigned URLs synchronously, so return undefined
		// For presigned URLs, users should use a separate method or await the promise
		return undefined;
	}
}
