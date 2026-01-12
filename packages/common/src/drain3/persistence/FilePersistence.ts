import { readFile, writeFile } from 'node:fs/promises';
import { stat } from 'node:fs/promises';
import type { PersistenceHandler } from './PersistenceHandler';

/**
 * File-based persistence handler that saves and loads state from the filesystem.
 */
export class FilePersistence implements PersistenceHandler {
	constructor(private readonly filePath: string) {}

	/**
	 * Saves the state to a file.
	 *
	 * @param state Serialized state data (string or Uint8Array)
	 * @throws Error if file write fails
	 */
	async save(state: Uint8Array | string): Promise<void> {
		try {
			await writeFile(this.filePath, state, 'utf8');
		} catch (error) {
			throw new Error(`failed to write file: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Loads the state from a file.
	 *
	 * @returns Promise that resolves with the loaded state, or null if file doesn't exist
	 * @throws Error if file read fails (other than file not found)
	 */
	async load(): Promise<string | null> {
		try {
			await stat(this.filePath);
		} catch (error) {
			if ((error as { code?: string })?.code === 'ENOENT') {
				return null;
			}
			throw error;
		}

		try {
			const state = await readFile(this.filePath, 'utf8');
			return state;
		} catch (error) {
			throw new Error(`failed to read file: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}
