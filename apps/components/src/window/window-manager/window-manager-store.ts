import { createStore } from 'zustand/vanilla';
import { mutative } from 'zustand-mutative';
import { createWindowManagerActions } from './window-manager-store-actions';
import {
	cloneWindowManagerWindowRecord,
	createWindowManagerWindowRecord,
	DEFAULT_WINDOW_MANAGER_BOUNDS,
	DEFAULT_WINDOW_MANAGER_CAPABILITIES,
	findTopVisibleWindowId,
	isWindowManagerWindowRecord,
	normalizeManagedWindow,
	normalizeWindowManagerOrder,
	normalizeWindowManagerWorkspace,
} from './window-manager-store-helpers';
import type {
	ManagedWindow,
	WindowManagerCreateOptions,
	WindowManagerEvent,
	WindowManagerEventListener,
	WindowManagerState,
} from './window-manager-types';

export {
	clampWindowManagerBounds,
	getWindowManagerAvailableBounds,
	getWindowManagerInvariantErrors,
	getWindowManagerRenderBounds,
	isWindowManagerSnapshot,
} from './window-manager-store-helpers';

export type WindowManagerStore = ReturnType<typeof createWindowManagerStore>;

export function createWindowManagerStore(options: WindowManagerCreateOptions = {}) {
	let sequence = 0;
	const listeners = new Set<WindowManagerEventListener>();
	if (options.onEvent) listeners.add(options.onEvent);
	const emit = (event: WindowManagerEvent) => {
		for (const listener of listeners) listener(event);
	};
	const idFactory =
		options.idFactory ??
		(() => {
			sequence += 1;
			return `window-${sequence}`;
		});
	const takeUniqueId = (existing: Record<string, ManagedWindow>, preferred?: string) => {
		const baseId = preferred ?? idFactory();
		let id = baseId;
		while (existing[id]) {
			sequence += 1;
			id = `${baseId}-${sequence}`;
		}
		return id;
	};
	const cascadeOffset = Math.max(0, options.cascadeOffset ?? 28);
	const workspace = normalizeWindowManagerWorkspace(options.workspace);
	const defaultBounds = { ...DEFAULT_WINDOW_MANAGER_BOUNDS, ...options.defaultBounds };
	const defaultCapabilities = { ...DEFAULT_WINDOW_MANAGER_CAPABILITIES, ...options.defaultCapabilities };
	const initialWindows = createWindowManagerWindowRecord();
	const initialDockOrder: string[] = [];
	const initialOrder: string[] = [];

	for (const initial of options.initialWindows ?? []) {
		const duplicate = initial.duplicate ?? 'focus-existing';
		const matches = initial.key ? initialOrder.filter((id) => initialWindows[id]?.key === initial.key) : [];
		if (matches.length && duplicate === 'focus-existing') {
			const id = matches.at(-1) as string;
			initialOrder.splice(initialOrder.indexOf(id), 1);
			initialOrder.push(id);
			continue;
		}
		if (matches.length && duplicate === 'replace') {
			const protectedId = matches.find((id) => !initialWindows[id].capabilities.close);
			if (protectedId) {
				initialOrder.splice(initialOrder.indexOf(protectedId), 1);
				initialOrder.push(protectedId);
				continue;
			}
			for (const id of matches) {
				delete initialWindows[id];
				initialDockOrder.splice(initialDockOrder.indexOf(id), 1);
				initialOrder.splice(initialOrder.indexOf(id), 1);
			}
		}
		const id = takeUniqueId(initialWindows, initial.id);
		const offset = cascadeOffset * (initialOrder.length % 8);
		const mode = initial.mode ?? 'normal';
		const win = normalizeManagedWindow(
			{
				id,
				key: initial.key,
				kind: initial.kind ?? 'default',
				title: initial.title,
				icon: initial.icon,
				data: initial.data,
				bounds: {
					...defaultBounds,
					x: (initial.bounds?.x ?? defaultBounds.x ?? DEFAULT_WINDOW_MANAGER_BOUNDS.x) + offset,
					y: (initial.bounds?.y ?? defaultBounds.y ?? DEFAULT_WINDOW_MANAGER_BOUNDS.y) + offset,
					...initial.bounds,
				},
				size: initial.size,
				capabilities: initial.capabilities,
				mode,
				restoreMode: mode === 'minimized' ? 'normal' : mode,
				fullscreenRestoreMode: 'normal',
				chrome: initial.chrome ?? 'default',
				showInDock: initial.showInDock ?? true,
				persistence: initial.persistence ?? 'layout',
				pinned: initial.pinned ?? false,
			},
			workspace,
			defaultBounds,
			defaultCapabilities,
		);
		initialWindows[id] = win;
		initialDockOrder.push(id);
		initialOrder.push(id);
	}

	const initialFullscreenIds = initialOrder.filter((id) => initialWindows[id]?.mode === 'fullscreen');
	for (const id of initialFullscreenIds.slice(0, -1)) {
		const win = initialWindows[id];
		win.mode = win.fullscreenRestoreMode;
		win.restoreMode = win.mode;
	}
	const initialFullscreenId = initialFullscreenIds.at(-1);
	if (initialFullscreenId) {
		initialOrder.splice(initialOrder.indexOf(initialFullscreenId), 1);
		initialOrder.push(initialFullscreenId);
	}
	initialOrder.splice(0, initialOrder.length, ...normalizeWindowManagerOrder(initialOrder, initialWindows));

	const store = createStore(
		mutative<WindowManagerState>(
			(setState, getState) => {
				const actions = createWindowManagerActions({
					cascadeOffset,
					defaultBounds,
					defaultCapabilities,
					emit,
					getState,
					setState,
					takeUniqueId,
				});
				return {
					windows: initialWindows,
					dockOrder: initialDockOrder,
					order: initialOrder,
					activeId: findTopVisibleWindowId({ windows: initialWindows, order: initialOrder }),
					workspace,
					hydration: { status: 'idle' },
					actions: { ...actions, ...options.actions },
				};
			},
			{
				mark: (value) =>
					isWindowManagerWindowRecord(value)
						? () => cloneWindowManagerWindowRecord(value as Record<PropertyKey, unknown>)
						: undefined,
			},
		),
	);

	return Object.assign(store, {
		subscribeEvents(listener: WindowManagerEventListener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
	});
}
