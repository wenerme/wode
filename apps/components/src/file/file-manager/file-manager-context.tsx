'use client';

import { createContext, type PropsWithChildren, useContext, useState } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { createFileManagerStore } from './file-manager-store';
import type {
	CreateFileManagerStoreOptions,
	FileManagerActions,
	FileManagerStore,
	FileManagerStoreState,
} from './file-manager-types';

export const FileManagerContext = createContext<FileManagerStore | null>(null);

export type FileManagerProviderProps = PropsWithChildren<{
	options?: CreateFileManagerStoreOptions;
	store?: FileManagerStore;
}>;

export function FileManagerProvider({ children, options, store }: FileManagerProviderProps) {
	const parentStore = useContext(FileManagerContext);
	const [localStore] = useState(() => {
		if (store) return store;
		if (!options) {
			if (parentStore) return parentStore;
			throw new Error('FileManagerProvider requires options or store');
		}
		return createFileManagerStore(options);
	});
	return <FileManagerContext.Provider value={store ?? localStore}>{children}</FileManagerContext.Provider>;
}

export function useFileManagerStoreContext(): FileManagerStore {
	const store = useContext(FileManagerContext);
	if (!store) throw new Error('useFileManagerStore must be used within FileManagerProvider');
	return store;
}

export function useFileManagerStore<T>(selector: (state: FileManagerStoreState) => T): T {
	return useStore(useFileManagerStoreContext(), selector);
}

export function useFileManagerActions(): FileManagerActions {
	return useFileManagerStore((state) => state.actions);
}

export function useFileManagerListing() {
	return useFileManagerStore(
		useShallow((state) => ({
			entries: state.listing.entries,
			error: state.listing.error,
			path: state.navigation.path,
			query: state.view.query,
			requesting: state.listing.requestedPath,
			sortBy: state.view.sortBy,
			sortDirection: state.view.sortDirection,
			status: state.listing.status,
		})),
	);
}
