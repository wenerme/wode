/**
 * Interface for persistence handlers that can save and load Drain state.
 */
export interface PersistenceHandler {
	/**
	 * Saves the Drain state.
	 *
	 * @param state Serialized state data
	 * @returns Promise that resolves when save is complete
	 */
	save(state: Uint8Array | string): Promise<void>;

	/**
	 * Loads the Drain state.
	 *
	 * @returns Promise that resolves with the loaded state, or null if no state exists
	 */
	load(): Promise<Uint8Array | string | null>;
}
