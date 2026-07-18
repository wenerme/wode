'use client';

import { useEffect, useRef } from 'react';
import { useWindowManagerApi } from './window-manager-context';
import { isWindowManagerSnapshot } from './window-manager-store';
import type {
	ManagedWindow,
	WindowManagerSnapshot,
	WindowManagerState,
	WindowManagerStorage,
} from './window-manager-types';
import { WINDOW_MANAGER_SNAPSHOT_VERSION } from './window-manager-types';

export type WindowManagerPersistenceProps = {
	debounceMs?: number;
	migrate?: (value: unknown) => WindowManagerSnapshot | undefined;
	onError?: (error: Error) => void;
	restoreMinimized?: boolean;
	serializeData?: (win: ManagedWindow) => unknown;
	storage?: 'local' | 'session' | WindowManagerStorage;
	storageKey?: string;
};

export function WindowManagerPersistence({
	debounceMs = 180,
	migrate,
	onError,
	restoreMinimized = false,
	serializeData,
	storage = 'local',
	storageKey = 'window-manager.layout.v1',
}: WindowManagerPersistenceProps) {
	const store = useWindowManagerApi();
	const optionsRef = useRef({ debounceMs, migrate, onError, restoreMinimized, serializeData });
	optionsRef.current = { debounceMs, migrate, onError, restoreMinimized, serializeData };

	useEffect(() => {
		const target = resolveStorage(storage);
		if (!target) {
			store.getState().actions.setHydration({ status: 'ready' });
			return;
		}
		let timer: ReturnType<typeof setTimeout> | undefined;
		let disposed = false;
		let writesDisabled = false;
		const report = (value: unknown) => {
			const error = value instanceof Error ? value : new Error('Window layout persistence failed');
			store.getState().actions.setHydration({ status: 'error', error: error.message });
			optionsRef.current.onError?.(error);
		};

		store.getState().actions.setHydration({ status: 'hydrating' });
		try {
			const raw = target.getItem(storageKey);
			if (raw) {
				const value: unknown = JSON.parse(raw);
				const snapshot = isWindowManagerSnapshot(value) ? value : optionsRef.current.migrate?.(value);
				if (!snapshot || !isWindowManagerSnapshot(snapshot))
					throw new Error('Stored window layout has an unsupported shape');
				if (
					!store.getState().actions.hydrateLayout(snapshot, { restoreMinimized: optionsRef.current.restoreMinimized })
				) {
					throw new Error('Stored window layout could not be restored');
				}
			} else {
				store.getState().actions.setHydration({ status: 'ready' });
			}
		} catch (error) {
			report(error);
		}

		const save = () => {
			if (disposed || writesDisabled) return;
			try {
				target.setItem(
					storageKey,
					JSON.stringify(
						createWindowManagerSnapshot(store.getState(), { serializeData: optionsRef.current.serializeData }),
					),
				);
			} catch (error) {
				writesDisabled = true;
				report(error);
			}
		};
		const unsubscribe = store.subscribe(() => {
			if (writesDisabled) return;
			if (timer) clearTimeout(timer);
			timer = setTimeout(save, Math.max(0, optionsRef.current.debounceMs));
		});
		return () => {
			disposed = true;
			unsubscribe();
			if (timer) clearTimeout(timer);
		};
	}, [storage, storageKey, store]);

	return null;
}

export function createWindowManagerSnapshot(
	state: WindowManagerState,
	options: { now?: () => number; serializeData?: (win: ManagedWindow) => unknown } = {},
): WindowManagerSnapshot {
	const windows = state.dockOrder.flatMap((id) => {
		const win = state.windows[id];
		if (!win || win.persistence === 'none') return [];
		const data = options.serializeData?.(win);
		return [
			{
				id: win.id,
				key: win.key,
				kind: win.kind,
				title: win.title,
				icon: win.icon,
				bounds: { ...win.bounds },
				size: { ...win.size },
				capabilities: { ...win.capabilities },
				mode: win.mode,
				restoreMode: win.restoreMode,
				fullscreenRestoreMode: win.fullscreenRestoreMode,
				chrome: win.chrome,
				showInDock: win.showInDock,
				persistence: win.persistence,
				pinned: win.pinned,
				...(data === undefined ? {} : { data }),
			},
		];
	});
	const persistentIds = new Set(windows.map((win) => win.id));
	return {
		version: WINDOW_MANAGER_SNAPSHOT_VERSION,
		savedAt: (options.now ?? Date.now)(),
		dock: { ...state.workspace.dock },
		dockOrder: windows.map((win) => win.id),
		order: state.order.filter((id) => persistentIds.has(id)),
		windows,
	};
}

function resolveStorage(storage: WindowManagerPersistenceProps['storage']): WindowManagerStorage | undefined {
	if (typeof storage === 'object') return storage;
	if (typeof window === 'undefined') return undefined;
	return storage === 'session' ? window.sessionStorage : window.localStorage;
}
