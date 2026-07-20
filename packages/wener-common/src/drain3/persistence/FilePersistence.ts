import { readFile, writeFile } from 'node:fs/promises';
import type { PersistenceHandler } from './PersistenceHandler';

/**
 * File-based persistence handler that saves and loads state from the filesystem.
 */
export class FilePersistence implements PersistenceHandler {
	constructor(private readonly filePath: string) {}

	async save(state: Uint8Array | string): Promise<void> {
		await writeFile(this.filePath, state, 'utf8');
	}

	async load(): Promise<string | null> {
		try {
			return await readFile(this.filePath, 'utf8');
		} catch (error) {
			if ((error as { code?: string })?.code === 'ENOENT') {
				return null;
			}
			throw error;
		}
	}
}
