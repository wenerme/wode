import { useStore, type ExtractState, type StoreApi } from 'zustand';

export const createBoundedUseStore = ((store) => (selector) => useStore(store, selector)) as <
	S extends StoreApi<unknown>,
>(
	store: S,
) => {
	(): ExtractState<S>;
	<T>(selector: (state: ExtractState<S>) => T): T;
};
