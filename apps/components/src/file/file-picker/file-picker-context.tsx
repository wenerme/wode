'use client';

import { createContext, type PropsWithChildren, useContext, useState } from 'react';
import { useStore } from 'zustand';
import { createFilePickerStore, type FilePickerStore, type FilePickerStoreState } from './file-picker-store';

const FilePickerContext = createContext<FilePickerStore | null>(null);

export function FilePickerProvider({
	children,
	store,
	suggestedName,
}: PropsWithChildren<{ store?: FilePickerStore; suggestedName?: string }>) {
	const [localStore] = useState(() => store ?? createFilePickerStore({ suggestedName }));
	return <FilePickerContext.Provider value={store ?? localStore}>{children}</FilePickerContext.Provider>;
}

export function useFilePickerStoreContext(): FilePickerStore {
	const store = useContext(FilePickerContext);
	if (!store) throw new Error('useFilePickerStore must be used within FilePickerProvider');
	return store;
}

export function useFilePickerStore<T>(selector: (state: FilePickerStoreState) => T): T {
	return useStore(useFilePickerStoreContext(), selector);
}

export function useFilePickerActions() {
	return useFilePickerStore((state) => state.actions);
}
