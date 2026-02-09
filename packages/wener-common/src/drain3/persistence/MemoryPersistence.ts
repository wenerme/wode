import type { PersistenceHandler } from './PersistenceHandler';

/**
 * In-memory persistence handler that stores state in memory.
 * Useful for testing or when persistence is not needed.
 */
export class MemoryPersistence implements PersistenceHandler {
	private state: Uint8Array | string | null = null;

	/**
	 * Saves the state to memory.
	 */
	async save(state: Uint8Array | string): Promise<void> {
		this.state = state;
	}

	/**
	 * Loads the state from memory.
	 */
	async load(): Promise<Uint8Array | string | null> {
		return this.state;
	}
}
