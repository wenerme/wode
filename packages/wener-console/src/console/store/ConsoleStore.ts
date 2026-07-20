import { createStore } from 'zustand';
import { mutative } from 'zustand-mutative';

export interface ConsoleStoreState {
	expired: boolean;
	locked: boolean;

	unlock(options?: { pin?: string }): void;
}

export type ConsoleStore = ReturnType<typeof createConsoleStore>;

export function createConsoleStore() {
	return createStore(
		mutative<ConsoleStoreState>((setState, _getState, _store) => {
			return {
				expired: false,
				locked: false,
				unlock: (_options) => {
					setState((s) => {
						s.locked = false;
					});
				},
			};
		}),
	);
}
