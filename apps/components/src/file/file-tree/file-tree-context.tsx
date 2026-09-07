'use client';

import { createContext, type PropsWithChildren, useContext, useState } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { createFileTreeStore } from './file-tree-store';
import type { CreateFileTreeStoreOptions, FileTreeActions, FileTreeStore, FileTreeStoreState } from './file-tree-types';

export const FileTreeContext = createContext<FileTreeStore | null>(null);

export type FileTreeProviderProps = PropsWithChildren<{
	options?: CreateFileTreeStoreOptions;
	store?: FileTreeStore;
}>;

export function FileTreeProvider({ children, options, store }: FileTreeProviderProps) {
	const parentStore = useContext(FileTreeContext);
	const [localStore] = useState(() => {
		if (store) return store;
		if (options) return createFileTreeStore(options);
		if (parentStore) return parentStore;
		throw new Error('FileTreeProvider requires options or store');
	});
	return <FileTreeContext.Provider value={store ?? localStore}>{children}</FileTreeContext.Provider>;
}

export function useFileTreeStoreContext(): FileTreeStore {
	const store = useContext(FileTreeContext);
	if (!store) throw new Error('useFileTreeStore must be used within FileTreeProvider');
	return store;
}

export function useFileTreeStore<T>(selector: (state: FileTreeStoreState) => T): T {
	return useStore(useFileTreeStoreContext(), selector);
}

export function useFileTreeActions(): FileTreeActions {
	return useFileTreeStore((state) => state.actions);
}

export function useFileTreeViewState() {
	return useFileTreeStore(
		useShallow((state) => ({
			actions: state.actions,
			currentPath: state.navigation.currentPath,
			directories: state.tree.directories,
			expanded: state.tree.expanded,
			limits: state.limits,
			rootPath: state.source.rootPath,
			selectedPath: state.selection.path,
		})),
	);
}
