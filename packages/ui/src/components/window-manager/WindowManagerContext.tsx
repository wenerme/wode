'use client';
import { createContext, type PropsWithChildren, useContext, useLayoutEffect, useState } from 'react';
import { useStore } from 'zustand';
import { registerRootWindow } from './showWindow';
import { createWindowManagerStore, type WindowManagerStore } from './WindowManagerStore';
import type { ManagedWindow, WindowManagerActions, WindowManagerCreateOptions, WindowManagerState } from './WindowManagerTypes';
export const WindowManagerContext = createContext<WindowManagerStore | null>(null);
export type WindowManagerProviderProps = PropsWithChildren<{ options?: WindowManagerCreateOptions; root?: boolean; store?: WindowManagerStore }>;
export function WindowManagerProvider({ children, options, root = false, store }: WindowManagerProviderProps) { const [localStore] = useState(() => store ?? createWindowManagerStore(options)); const currentStore = store ?? localStore; useLayoutEffect(() => (root ? registerRootWindow(currentStore) : undefined), [currentStore, root]); return <WindowManagerContext.Provider value={currentStore}>{children}</WindowManagerContext.Provider>; }
export function useWindowManagerApi() { const store = useContext(WindowManagerContext); if (!store) throw new Error('useWindowManagerApi must be used within WindowManagerProvider'); return store; }
export function useWindowManager<T>(selector: (state: WindowManagerState) => T): T { return useStore(useWindowManagerApi(), selector); }
export function useWindowManagerActions(): WindowManagerActions { return useWindowManager((state) => state.actions); }
export function useManagedWindow(id: string): ManagedWindow | undefined { return useWindowManager((state) => state.windows[id]); }
