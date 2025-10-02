import { mkdir, readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { dirname, join } from 'path';
import consola from 'consola';

const logger = consola.withTag('simple-storage');

export interface SimpleStorageOptions {
	/** Storage namespace - used as filename prefix */
	namespace: string;
	/** Base directory for storage files */
	baseDir?: string;
	/** Custom filename (overrides namespace-based naming) */
	filename?: string;
}

/**
 * Simple file-based storage interface
 * Stores data as JSON files with format: {namespace}.store.local.json
 */
export class SimpleStorage<T = any> {
	private filePath: string;

	constructor(private options: SimpleStorageOptions) {
		const baseDir = options.baseDir || join(homedir(), '.config');
		const filename = options.filename || `${options.namespace}.store.local.json`;
		this.filePath = join(baseDir, filename);
	}

	/**
	 * Store data
	 */
	async store(data: T): Promise<void> {
		try {
			// Ensure directory exists
			await mkdir(dirname(this.filePath), { recursive: true });

			// Write data with metadata
			const storageData = {
				data,
				timestamp: Date.now(),
				namespace: this.options.namespace,
			};

			await writeFile(this.filePath, JSON.stringify(storageData, null, 2), { mode: 0o600 });

			logger.debug('Data stored successfully', {
				namespace: this.options.namespace,
				path: this.filePath,
			});
		} catch (error) {
			logger.error('Failed to store data', {
				namespace: this.options.namespace,
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Retrieve data
	 */
	async get(): Promise<T | null> {
		try {
			const content = await readFile(this.filePath, 'utf-8');
			const storageData = JSON.parse(content);

			// Validate namespace
			if (storageData.namespace !== this.options.namespace) {
				logger.warn('Namespace mismatch in stored data', {
					expected: this.options.namespace,
					found: storageData.namespace,
				});
			}

			logger.debug('Data retrieved successfully', {
				namespace: this.options.namespace,
				timestamp: new Date(storageData.timestamp).toISOString(),
			});

			return storageData.data;
		} catch (error) {
			if ((error as any).code === 'ENOENT') {
				logger.debug('No stored data found', { namespace: this.options.namespace });
				return null;
			}

			logger.error('Failed to retrieve data', {
				namespace: this.options.namespace,
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Check if data exists
	 */
	async exists(): Promise<boolean> {
		try {
			await readFile(this.filePath, 'utf-8');
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Clear stored data
	 */
	async clear(): Promise<void> {
		try {
			await writeFile(this.filePath, '{}', { mode: 0o600 });
			logger.debug('Data cleared successfully', { namespace: this.options.namespace });
		} catch (error) {
			logger.error('Failed to clear data', {
				namespace: this.options.namespace,
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Get file path for debugging
	 */
	getFilePath(): string {
		return this.filePath;
	}
}
