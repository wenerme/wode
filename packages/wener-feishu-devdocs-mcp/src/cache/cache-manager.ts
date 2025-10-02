import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { homedir } from 'os';
import consola from 'consola';

const logger = consola.withTag('cache-manager');

export interface CacheEntry<T = any> {
	data: T;
	timestamp: number;
	expiry?: number;
	query: string;
	metadata?: Record<string, any>;
}

export interface CacheOptions {
	cacheDirPath?: string;
	defaultTtl?: number; // Time to live in milliseconds
	enableCache?: boolean;
}

/**
 * Cache manager for Feishu DevDocs MCP
 * Manages local file-based caching in ~/.cache/wener-feishu-devdocs-mcp/
 */
export class CacheManager {
	private cacheDir: string;
	private defaultTtl: number;
	private enableCache: boolean;

	constructor(options: CacheOptions = {}) {
		this.cacheDir = options.cacheDirPath || path.join(homedir(), '.cache', 'wener-feishu-devdocs-mcp');
		this.defaultTtl = options.defaultTtl || 24 * 60 * 60 * 1000; // 24 hours default
		this.enableCache = options.enableCache !== false; // Enable by default
	}

	/**
	 * Initialize cache directory
	 */
	async init(): Promise<void> {
		if (!this.enableCache) {
			return;
		}

		try {
			await fs.mkdir(this.cacheDir, { recursive: true });
			logger.debug('Cache directory initialized', { cacheDir: this.cacheDir });
		} catch (error) {
			logger.error('Failed to initialize cache directory', {
				cacheDir: this.cacheDir,
				error: error instanceof Error ? error.message : String(error)
			});
			throw error;
		}
	}

	/**
	 * Generate cache key from query string
	 */
	private getCacheKey(query: string): string {
		return createHash('sha256').update(query.toLowerCase().trim()).digest('hex').substring(0, 16);
	}

	/**
	 * Get cache file path for a query
	 */
	private getCacheFilePath(query: string): string {
		const cacheKey = this.getCacheKey(query);
		return path.join(this.cacheDir, `${cacheKey}.json`);
	}

	/**
	 * Check if cache entry is valid (not expired)
	 */
	private isValidEntry<T>(entry: CacheEntry<T>): boolean {
		if (!entry.expiry) {
			return true; // No expiry set, entry is always valid
		}
		return Date.now() < entry.expiry;
	}

	/**
	 * Get cached data for a query
	 */
	async get<T = any>(query: string): Promise<T | null> {
		if (!this.enableCache) {
			return null;
		}

		const filePath = this.getCacheFilePath(query);

		try {
			const fileContent = await fs.readFile(filePath, 'utf-8');
			const entry: CacheEntry<T> = JSON.parse(fileContent);

			if (!this.isValidEntry(entry)) {
				logger.debug('Cache entry expired, removing', {
					query,
					cacheKey: this.getCacheKey(query),
					expiry: entry.expiry ? new Date(entry.expiry).toISOString() : 'none'
				});
				await this.delete(query);
				return null;
			}

			logger.debug('Cache hit', {
				query,
				cacheKey: this.getCacheKey(query),
				age: Date.now() - entry.timestamp
			});

			return entry.data;
		} catch (error) {
			if ((error as any).code === 'ENOENT') {
				// File doesn't exist, cache miss
				logger.debug('Cache miss', {
					query,
					cacheKey: this.getCacheKey(query)
				});
				return null;
			}

			logger.error('Failed to read cache', {
				query,
				cacheKey: this.getCacheKey(query),
				error: error instanceof Error ? error.message : String(error)
			});
			return null;
		}
	}

	/**
	 * Store data in cache for a query
	 */
	async set<T = any>(query: string, data: T, ttl?: number): Promise<void> {
		if (!this.enableCache) {
			return;
		}

		const filePath = this.getCacheFilePath(query);
		const actualTtl = ttl || this.defaultTtl;
		const expiry = actualTtl > 0 ? Date.now() + actualTtl : undefined;

		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
			expiry,
			query,
			metadata: {
				ttl: actualTtl,
				cacheKey: this.getCacheKey(query)
			}
		};

		try {
			await fs.writeFile(filePath, JSON.stringify(entry, null, 2), 'utf-8');
			logger.debug('Cache stored', {
				query,
				cacheKey: this.getCacheKey(query),
				ttl: actualTtl,
				expiry: expiry ? new Date(expiry).toISOString() : 'none'
			});
		} catch (error) {
			logger.error('Failed to write cache', {
				query,
				cacheKey: this.getCacheKey(query),
				error: error instanceof Error ? error.message : String(error)
			});
		}
	}

	/**
	 * Delete cached data for a query
	 */
	async delete(query: string): Promise<void> {
		if (!this.enableCache) {
			return;
		}

		const filePath = this.getCacheFilePath(query);

		try {
			await fs.unlink(filePath);
			logger.debug('Cache entry deleted', {
				query,
				cacheKey: this.getCacheKey(query)
			});
		} catch (error) {
			if ((error as any).code !== 'ENOENT') {
				logger.error('Failed to delete cache', {
					query,
					cacheKey: this.getCacheKey(query),
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}
	}

	/**
	 * Clear all cached data
	 */
	async clear(): Promise<void> {
		if (!this.enableCache) {
			return;
		}

		try {
			const files = await fs.readdir(this.cacheDir);
			const jsonFiles = files.filter(file => file.endsWith('.json'));

			await Promise.all(
				jsonFiles.map(file => fs.unlink(path.join(this.cacheDir, file)))
			);

			logger.info('Cache cleared', {
				filesDeleted: jsonFiles.length
			});
		} catch (error) {
			logger.error('Failed to clear cache', {
				error: error instanceof Error ? error.message : String(error)
			});
		}
	}

	/**
	 * Get cache statistics
	 */
	async getStats(): Promise<{
		totalEntries: number;
		totalSize: number;
		oldestEntry?: Date;
		newestEntry?: Date;
		expiredEntries: number;
	}> {
		if (!this.enableCache) {
			return {
				totalEntries: 0,
				totalSize: 0,
				expiredEntries: 0
			};
		}

		try {
			const files = await fs.readdir(this.cacheDir);
			const jsonFiles = files.filter(file => file.endsWith('.json'));

			let totalSize = 0;
			let oldestEntry: Date | undefined;
			let newestEntry: Date | undefined;
			let expiredEntries = 0;

			for (const file of jsonFiles) {
				const filePath = path.join(this.cacheDir, file);
				const stats = await fs.stat(filePath);
				totalSize += stats.size;

				try {
					const content = await fs.readFile(filePath, 'utf-8');
					const entry: CacheEntry = JSON.parse(content);

					const entryDate = new Date(entry.timestamp);
					if (!oldestEntry || entryDate < oldestEntry) {
						oldestEntry = entryDate;
					}
					if (!newestEntry || entryDate > newestEntry) {
						newestEntry = entryDate;
					}

					if (!this.isValidEntry(entry)) {
						expiredEntries++;
					}
				} catch (error) {
					// Skip invalid files
					logger.debug('Skipping invalid cache file', { file });
				}
			}

			return {
				totalEntries: jsonFiles.length,
				totalSize,
				oldestEntry,
				newestEntry,
				expiredEntries
			};
		} catch (error) {
			logger.error('Failed to get cache stats', {
				error: error instanceof Error ? error.message : String(error)
			});
			return {
				totalEntries: 0,
				totalSize: 0,
				expiredEntries: 0
			};
		}
	}

	/**
	 * Clean up expired cache entries
	 */
	async cleanup(): Promise<number> {
		if (!this.enableCache) {
			return 0;
		}

		let deletedCount = 0;

		try {
			const files = await fs.readdir(this.cacheDir);
			const jsonFiles = files.filter(file => file.endsWith('.json'));

			for (const file of jsonFiles) {
				const filePath = path.join(this.cacheDir, file);

				try {
					const content = await fs.readFile(filePath, 'utf-8');
					const entry: CacheEntry = JSON.parse(content);

					if (!this.isValidEntry(entry)) {
						await fs.unlink(filePath);
						deletedCount++;
						logger.debug('Expired cache entry removed', {
							file,
							query: entry.query,
							expiry: entry.expiry ? new Date(entry.expiry).toISOString() : 'none'
						});
					}
				} catch (error) {
					// If we can't read the file, it's probably corrupted, so delete it
					await fs.unlink(filePath);
					deletedCount++;
					logger.debug('Corrupted cache file removed', { file });
				}
			}

			if (deletedCount > 0) {
				logger.info('Cache cleanup completed', { deletedCount });
			}

			return deletedCount;
		} catch (error) {
			logger.error('Failed to cleanup cache', {
				error: error instanceof Error ? error.message : String(error)
			});
			return 0;
		}
	}
}