'use client';

import { createContext, type PropsWithChildren, useContext, useState } from 'react';
import { useStore } from 'zustand';
import { createWindowManagerStore, type WindowManagerStore } from './window-manager-store';
import type {
	ManagedWindow,
	WindowManagerActions,
	WindowManagerCreateOptions,
	WindowManagerState,
} from './window-manager-types';

export const WindowManagerContext = createContext<WindowManagerStore | null>(null);

export type WindowManagerProviderProps = PropsWithChildren<{
	options?: WindowManagerCreateOptions;
	store?: WindowManagerStore;
}>;

export function WindowManagerProvider({ children, options, store }: WindowManagerProviderProps) {
	const [localStore] = useState(() => store ?? createWindowManagerStore(options));
	return <WindowManagerContext.Provider value={store ?? localStore}>{children}</WindowManagerContext.Provider>;
}

export function useWindowManagerApi() {
	const store = useContext(WindowManagerContext);
	if (!store) throw new Error('useWindowManagerApi must be used within WindowManagerProvider');
	return store;
}

export function useWindowManager<T>(selector: (state: WindowManagerState) => T): T {
	return useStore(useWindowManagerApi(), selector);
}

export function useWindowManagerActions(): WindowManagerActions {
	return useWindowManager((state) => state.actions);
}

export function useManagedWindow(id: string): ManagedWindow | undefined {
	return useWindowManager((state) => state.windows[id]);
}
