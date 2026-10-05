'use client';
import type { ReactNode } from 'react';
import type { WindowManagerStore } from './WindowManagerStore';
import type { ManagedWindow, WindowManagerOpenOptions } from './WindowManagerTypes';
export type ShowWindowOptions = Omit<WindowManagerOpenOptions, 'data' | 'kind' | 'icon' | 'persistence'> & { icon?: ReactNode; render: () => ReactNode };
export type ShownWindow = { id: string; close: (result?: unknown) => boolean; focus: () => boolean; minimize: () => boolean; maximize: () => boolean; restore: () => boolean; center: () => boolean };
export type RootWindow = { open: (options: ShowWindowOptions) => ShownWindow };
const roots = new Map<symbol, RootWindow>();
export function registerRootWindow(store: WindowManagerStore): () => void { const key = Symbol('root-window'); roots.set(key, { open({ render, icon, ...options }) { const { actions } = store.getState(); const id = actions.open({ ...options, kind: 'render-window', persistence: 'none', data: { render, icon } }); return { id, close: (result) => actions.close(id, result), focus: () => actions.focus(id), minimize: () => actions.minimize(id), maximize: () => actions.maximize(id), restore: () => actions.restore(id), center: () => actions.center(id) }; } }); return () => { roots.delete(key); }; }
export function getRootWindow(): RootWindow { const root = [...roots.values()].at(-1); if (!root) throw new Error('showWindow requires a mounted root WindowManagerProvider'); return root; }
export function showWindow(options: ShowWindowOptions): ShownWindow { return getRootWindow().open(options); }
export function getWindowRenderData(win: ManagedWindow): Pick<ShowWindowOptions, 'render' | 'icon'> | undefined { if (win.kind !== 'render-window') return undefined; const data = win.data as Partial<ShowWindowOptions> | undefined; return typeof data?.render === 'function' ? { render: data.render, icon: data.icon } : undefined; }
