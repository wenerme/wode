import { createStore } from 'zustand/vanilla';
import { mutative } from 'zustand-mutative';
import type {
	ManagedWindow,
	WindowManagerActions,
	WindowManagerBounds,
	WindowManagerCapabilities,
	WindowManagerCreateOptions,
	WindowManagerDockState,
	WindowManagerEvent,
	WindowManagerEventListener,
	WindowManagerRestoreMode,
	WindowManagerSnapshot,
	WindowManagerState,
	WindowManagerWindowMode,
	WindowManagerWorkspaceState,
} from './window-manager-types';
import { WINDOW_MANAGER_SNAPSHOT_VERSION } from './window-manager-types';

const DEFAULT_BOUNDS: WindowManagerBounds = { x: 64, y: 48, width: 640, height: 420 };
const DEFAULT_CAPABILITIES: WindowManagerCapabilities = {
	close: true,
	fullscreen: true,
	maximize: true,
	minimize: true,
	move: true,
	resize: true,
};
const DEFAULT_DOCK: WindowManagerDockState = { visible: true, position: 'bottom', size: 52 };
const WINDOW_MANAGER_WINDOW_RECORD = Symbol('WindowManagerWindowRecord');
const DEFAULT_WORKSPACE: WindowManagerWorkspaceState = { width: 1280, height: 720, dock: DEFAULT_DOCK };

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
	const cascadeOffset = Math.max(0, options.cascadeOffset ?? 28);
	const workspace = normalizeWorkspace(options.workspace);
	const defaultBounds = { ...DEFAULT_BOUNDS, ...options.defaultBounds };
	const defaultCapabilities = { ...DEFAULT_CAPABILITIES, ...options.defaultCapabilities };
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
					x: (initial.bounds?.x ?? defaultBounds.x ?? DEFAULT_BOUNDS.x) + offset,
					y: (initial.bounds?.y ?? defaultBounds.y ?? DEFAULT_BOUNDS.y) + offset,
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

	function takeUniqueId(existing: Record<string, ManagedWindow>, preferred?: string) {
		const baseId = preferred ?? idFactory();
		let id = baseId;
		while (existing[id]) {
			sequence += 1;
			id = `${baseId}-${sequence}`;
		}
		return id;
	}

	const store = createStore(
		mutative<WindowManagerState>(
			(setState, getState) => {
				const focus = (id: string) => {
					const currentState = getState();
					const current = currentState.windows[id];
					if (!current) return false;
					const hasOtherFullscreen = Object.values(currentState.windows).some(
						(win) => win.id !== id && win.mode === 'fullscreen',
					);
					if (
						!hasOtherFullscreen &&
						current.mode !== 'minimized' &&
						currentState.activeId === id &&
						currentState.order.at(-1) === id
					) {
						return true;
					}
					let restoredMode: WindowManagerRestoreMode | undefined;
					let forcedRestores: Array<{ id: string; mode: WindowManagerRestoreMode }> = [];
					setState((state) => {
						forcedRestores = restoreOtherFullscreenWindows(state, id);
						const win = state.windows[id];
						if (!win) return;
						if (win.mode === 'minimized') {
							restoredMode = win.restoreMode;
							win.mode = win.restoreMode;
						}
						raiseWindowManagerWindow(state, id);
						state.activeId = id;
					});
					for (const restored of forcedRestores) emit({ type: 'restored', ...restored });
					if (restoredMode) emit({ type: 'restored', id, mode: restoredMode });
					emit({ type: 'focused', id });
					return true;
				};

				const actions: WindowManagerActions = {
					center: (id) => {
						const current = getState().windows[id];
						if (!current || current.mode !== 'normal' || !current.capabilities.move) return false;
						const area = getWindowManagerAvailableBounds(getState().workspace);
						return actions.setBounds(
							id,
							{
								x: area.x + Math.max(0, (area.width - current.bounds.width) / 2),
								y: area.y + Math.max(0, (area.height - current.bounds.height) / 2),
							},
							'move',
						);
					},
					close: (id, result) => {
						const current = getState().windows[id];
						if (!current?.capabilities.close) return false;
						setState((state) => {
							delete state.windows[id];
							state.dockOrder = state.dockOrder.filter((item) => item !== id);
							state.order = state.order.filter((item) => item !== id);
							if (state.activeId === id) state.activeId = findTopVisibleId(state);
						});
						emit({ type: 'closed', id, result, window: current });
						return true;
					},
					closeAll: () => {
						for (const id of [...getState().order].reverse()) actions.close(id);
					},
					cycleFocus: (direction = 1) => {
						const state = getState();
						const active = state.activeId ? state.windows[state.activeId] : undefined;
						if (active?.mode === 'fullscreen') return active.id;
						const visible = state.order.filter((id) => state.windows[id]?.mode !== 'minimized');
						if (!visible.length) return undefined;
						const currentIndex = state.activeId ? visible.indexOf(state.activeId) : -1;
						const nextIndex =
							currentIndex < 0
								? direction > 0
									? 0
									: visible.length - 1
								: (currentIndex + direction + visible.length) % visible.length;
						const id = visible[nextIndex];
						focus(id);
						return id;
					},
					focus,
					fullscreen: (id) => setWindowMode(id, 'fullscreen', 'fullscreen'),
					hydrateLayout: (snapshot, hydrateOptions) => {
						if (!isWindowManagerSnapshot(snapshot)) return false;
						const currentWorkspace = getState().workspace;
						const hydratedWorkspace = {
							...currentWorkspace,
							dock: normalizeDock(snapshot.dock, currentWorkspace),
						};
						const nextWindows = createWindowManagerWindowRecord();
						const nextOrder: string[] = [];
						for (const item of snapshot.windows) {
							if (item.persistence === 'none' || nextWindows[item.id]) continue;
							const mode =
								hydrateOptions?.restoreMinimized === false && item.mode === 'minimized' ? item.restoreMode : item.mode;
							nextWindows[item.id] = normalizeManagedWindow(
								{ ...item, mode, data: item.data },
								hydratedWorkspace,
								defaultBounds,
								defaultCapabilities,
							);
							nextOrder.push(item.id);
						}
						const ordered = snapshot.order.filter((id) => nextWindows[id]);
						for (const id of nextOrder) if (!ordered.includes(id)) ordered.push(id);
						const dockOrdered = (snapshot.dockOrder ?? nextOrder).filter((id) => nextWindows[id]);
						for (const id of nextOrder) if (!dockOrdered.includes(id)) dockOrdered.push(id);
						const fullscreenIds = ordered.filter((id) => nextWindows[id]?.mode === 'fullscreen');
						for (const id of fullscreenIds.slice(0, -1)) {
							const win = nextWindows[id];
							win.mode = win.fullscreenRestoreMode;
							win.restoreMode = win.mode;
						}
						const fullscreenId = fullscreenIds.at(-1);
						if (fullscreenId) {
							ordered.splice(ordered.indexOf(fullscreenId), 1);
							ordered.push(fullscreenId);
						}
						const rankedOrder = normalizeWindowManagerOrder(ordered, nextWindows);
						setState((state) => {
							state.windows = nextWindows;
							state.dockOrder = dockOrdered;
							state.order = rankedOrder;
							state.activeId = findTopVisibleId(state);
							state.workspace.dock = hydratedWorkspace.dock;
							state.hydration = { status: 'ready' };
						});
						return true;
					},
					maximize: (id) => setWindowMode(id, 'maximized', 'maximized'),
					minimize: (id) => {
						const current = getState().windows[id];
						if (!current || current.mode === 'minimized' || !current.capabilities.minimize) return false;
						setState((state) => {
							const win = state.windows[id];
							if (!win) return;
							win.restoreMode = normalizeRestoreMode(win.mode);
							win.mode = 'minimized';
							state.order = normalizeWindowManagerOrder(state.order, state.windows);
							if (state.activeId === id) state.activeId = findTopVisibleId(state);
						});
						emit({ type: 'minimized', id });
						return true;
					},
					minimizeAll: () => {
						const minimized: string[] = [];
						setState((state) => {
							for (const id of state.order) {
								const win = state.windows[id];
								if (!win || win.mode === 'minimized' || !win.capabilities.minimize) continue;
								win.restoreMode = normalizeRestoreMode(win.mode);
								win.mode = 'minimized';
								minimized.push(id);
							}
							state.order = normalizeWindowManagerOrder(state.order, state.windows);
							state.activeId = findTopVisibleId(state);
						});
						for (const id of minimized) emit({ type: 'minimized', id });
					},
					moveBy: (id, delta) => {
						const current = getState().windows[id];
						if (!current) return false;
						return actions.setBounds(id, { x: current.bounds.x + delta.x, y: current.bounds.y + delta.y }, 'move');
					},
					open: (openOptions) => {
						const duplicate = openOptions.duplicate ?? 'focus-existing';
						const existingWindows = openOptions.key
							? [...getState().order]
									.reverse()
									.flatMap((id) => (getState().windows[id]?.key === openOptions.key ? [getState().windows[id]] : []))
							: [];
						const existing = existingWindows[0];
						if (existing && duplicate === 'focus-existing') {
							focus(existing.id);
							return existing.id;
						}
						if (duplicate === 'replace') {
							const protectedWindow = existingWindows.find((candidate) => !candidate.capabilities.close);
							if (protectedWindow) {
								focus(protectedWindow.id);
								return protectedWindow.id;
							}
							for (const candidate of existingWindows) {
								actions.close(candidate.id);
							}
						}
						const id = takeUniqueId(getState().windows, openOptions.id);
						const state = getState();
						const offset = cascadeOffset * (state.order.length % 8);
						const bounds = {
							...defaultBounds,
							x: (openOptions.bounds?.x ?? defaultBounds.x ?? DEFAULT_BOUNDS.x) + offset,
							y: (openOptions.bounds?.y ?? defaultBounds.y ?? DEFAULT_BOUNDS.y) + offset,
							...openOptions.bounds,
						};
						const mode = openOptions.mode ?? 'normal';
						const win = normalizeManagedWindow(
							{
								id,
								key: openOptions.key,
								kind: openOptions.kind ?? 'default',
								title: openOptions.title,
								icon: openOptions.icon,
								data: openOptions.data,
								bounds,
								size: openOptions.size,
								capabilities: openOptions.capabilities,
								mode,
								restoreMode: mode === 'minimized' ? 'normal' : mode,
								fullscreenRestoreMode: 'normal',
								chrome: openOptions.chrome ?? 'default',
								showInDock: openOptions.showInDock ?? true,
								persistence: openOptions.persistence ?? 'layout',
								pinned: openOptions.pinned ?? false,
							},
							state.workspace,
							defaultBounds,
							defaultCapabilities,
						);
						let forcedRestores: Array<{ id: string; mode: WindowManagerRestoreMode }> = [];
						setState((draft) => {
							forcedRestores = restoreOtherFullscreenWindows(draft, id);
							draft.windows[id] = win;
							draft.dockOrder.push(id);
							draft.order.push(id);
							raiseWindowManagerWindow(draft, id);
							draft.activeId = id;
						});
						for (const restored of forcedRestores) emit({ type: 'restored', ...restored });
						emit({ type: 'opened', id, window: win });
						return id;
					},
					resetLayout: () => {
						setState((state) => {
							state.dockOrder.forEach((id, index) => {
								const win = state.windows[id];
								if (!win) return;
								win.mode = 'normal';
								win.restoreMode = 'normal';
								win.fullscreenRestoreMode = 'normal';
								win.bounds = clampWindowManagerBounds(
									{
										...defaultBounds,
										x: (defaultBounds.x ?? DEFAULT_BOUNDS.x) + cascadeOffset * (index % 8),
										y: (defaultBounds.y ?? DEFAULT_BOUNDS.y) + cascadeOffset * (index % 8),
									},
									win,
									state.workspace,
								);
							});
							state.order = normalizeWindowManagerOrder(state.order, state.windows);
							state.activeId = findTopVisibleId(state);
						});
					},
					resizeBy: (id, delta) => {
						const current = getState().windows[id];
						if (!current) return false;
						return actions.setBounds(
							id,
							{ width: current.bounds.width + delta.width, height: current.bounds.height + delta.height },
							'resize',
						);
					},
					restore: (id) => {
						const current = getState().windows[id];
						if (!current || current.mode === 'normal') return false;
						const mode =
							current.mode === 'minimized'
								? current.restoreMode
								: current.mode === 'fullscreen'
									? current.fullscreenRestoreMode
									: 'normal';
						let forcedRestores: Array<{ id: string; mode: WindowManagerRestoreMode }> = [];
						setState((state) => {
							forcedRestores = restoreOtherFullscreenWindows(state, id);
							const win = state.windows[id];
							if (!win) return;
							win.mode = mode;
							win.restoreMode = mode;
							raiseWindowManagerWindow(state, id);
							state.activeId = id;
						});
						for (const restored of forcedRestores) emit({ type: 'restored', ...restored });
						emit({ type: 'restored', id, mode });
						return true;
					},
					setBounds: (id, patch, reason = 'move') => {
						const current = getState().windows[id];
						if (!current || current.mode !== 'normal') return false;
						if (reason === 'move' && !current.capabilities.move) return false;
						if (reason === 'resize' && !current.capabilities.resize) return false;
						let next: WindowManagerBounds | undefined;
						setState((state) => {
							const win = state.windows[id];
							if (!win) return;
							next = clampWindowManagerBounds({ ...win.bounds, ...patch }, win, state.workspace);
							win.bounds = next;
						});
						if (!next) return false;
						emit({ type: reason === 'resize' ? 'resized' : 'moved', id, bounds: next });
						return true;
					},
					setDock: (dock) => {
						setState((state) => {
							state.workspace.dock = normalizeDock({ ...state.workspace.dock, ...dock }, state.workspace);
							for (const win of Object.values(state.windows)) {
								win.bounds = clampWindowManagerBounds(win.bounds, win, state.workspace);
							}
						});
					},
					setHydration: (hydration) => setState((state) => void (state.hydration = hydration)),
					setPinned: (id, pinned) => {
						const current = getState().windows[id];
						if (!current) return false;
						if (current.pinned === pinned) return true;
						setState((state) => {
							const win = state.windows[id];
							if (!win) return;
							win.pinned = pinned;
							raiseWindowManagerWindow(state, id);
						});
						emit({ type: 'pinned', id, pinned });
						return true;
					},
					setWorkspaceSize: (size) => {
						const current = getState().workspace;
						const width = finitePositive(size.width, current.width);
						const height = finitePositive(size.height, current.height);
						if (width === current.width && height === current.height) return;
						setState((state) => {
							state.workspace.width = width;
							state.workspace.height = height;
							state.workspace.dock = normalizeDock(state.workspace.dock, state.workspace);
							for (const win of Object.values(state.windows)) {
								win.bounds = clampWindowManagerBounds(win.bounds, win, state.workspace);
							}
						});
					},
					toggle: (openOptions) => {
						const existing = openOptions.key
							? Object.values(getState().windows).find((win) => win.key === openOptions.key)
							: undefined;
						if (!existing) return actions.open(openOptions);
						if (existing.mode === 'minimized') actions.restore(existing.id);
						else if (getState().activeId === existing.id && existing.capabilities.minimize)
							actions.minimize(existing.id);
						else actions.focus(existing.id);
						return existing.id;
					},
					toggleFullscreen: (id) => {
						const current = getState().windows[id];
						return current?.mode === 'fullscreen' ? actions.restore(id) : actions.fullscreen(id);
					},
					toggleMaximize: (id) => {
						const current = getState().windows[id];
						return current?.mode === 'maximized' ? actions.restore(id) : actions.maximize(id);
					},
					togglePinned: (id) => {
						const current = getState().windows[id];
						return current ? actions.setPinned(id, !current.pinned) : false;
					},
					update: (id, patch) => {
						if (!getState().windows[id]) return false;
						setState((state) => {
							const win = state.windows[id];
							if (!win) return;
							if (patch.title !== undefined) win.title = patch.title;
							if (patch.icon !== undefined) win.icon = patch.icon;
							if (patch.key !== undefined) win.key = patch.key;
							if (patch.data !== undefined) win.data = patch.data;
							if (patch.showInDock !== undefined) win.showInDock = patch.showInDock;
							if (patch.capabilities) Object.assign(win.capabilities, patch.capabilities);
						});
						emit({ type: 'updated', id });
						return true;
					},
				};

				function setWindowMode(id: string, mode: 'maximized' | 'fullscreen', eventType: 'maximized' | 'fullscreen') {
					const current = getState().windows[id];
					const capability = mode === 'maximized' ? current?.capabilities.maximize : current?.capabilities.fullscreen;
					if (!current || !capability || current.mode === mode) return false;
					let forcedRestores: Array<{ id: string; mode: WindowManagerRestoreMode }> = [];
					setState((state) => {
						forcedRestores = restoreOtherFullscreenWindows(state, id);
						const win = state.windows[id];
						if (!win) return;
						if (mode === 'fullscreen') {
							const previousMode = win.mode === 'minimized' ? win.restoreMode : win.mode;
							win.fullscreenRestoreMode = previousMode === 'maximized' ? 'maximized' : 'normal';
						}
						win.mode = mode;
						win.restoreMode = mode;
						raiseWindowManagerWindow(state, id);
						state.activeId = id;
					});
					for (const restored of forcedRestores) emit({ type: 'restored', ...restored });
					emit({ type: eventType, id } as WindowManagerEvent);
					return true;
				}

				return {
					windows: initialWindows,
					dockOrder: initialDockOrder,
					order: initialOrder,
					activeId: findTopVisibleId({ windows: initialWindows, order: initialOrder }),
					workspace,
					hydration: { status: 'idle' },
					actions: { ...actions, ...options.actions },
				};
			},
			{
				mark: (value) =>
					isWindowManagerWindowRecord(value)
						? () => cloneNullPrototypeRecord(value as Record<PropertyKey, unknown>)
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

export function getWindowManagerAvailableBounds(workspace: WindowManagerWorkspaceState): WindowManagerBounds {
	let x = 0;
	let y = 0;
	let width = Math.max(1, workspace.width);
	let height = Math.max(1, workspace.height);
	if (!workspace.dock.visible) return { x, y, width, height };
	const size = Math.max(0, workspace.dock.size);
	if (workspace.dock.position === 'left') {
		x = Math.min(size, width - 1);
		width = Math.max(1, width - size);
	} else if (workspace.dock.position === 'right') {
		width = Math.max(1, width - size);
	} else {
		height = Math.max(1, height - size);
	}
	return { x, y, width, height };
}

export function getWindowManagerRenderBounds(win: ManagedWindow, workspace: WindowManagerWorkspaceState) {
	if (win.mode === 'fullscreen') return { x: 0, y: 0, width: workspace.width, height: workspace.height };
	if (win.mode === 'maximized') return getWindowManagerAvailableBounds(workspace);
	return win.bounds;
}

export function clampWindowManagerBounds(
	bounds: WindowManagerBounds,
	win: Pick<ManagedWindow, 'size'>,
	workspace: WindowManagerWorkspaceState,
) {
	const area = getWindowManagerAvailableBounds(workspace);
	const minWidth = Math.min(Math.max(1, win.size.minWidth), area.width);
	const minHeight = Math.min(Math.max(1, win.size.minHeight), area.height);
	const maxWidth = Math.min(Math.max(minWidth, win.size.maxWidth ?? area.width), area.width);
	const maxHeight = Math.min(Math.max(minHeight, win.size.maxHeight ?? area.height), area.height);
	const width = clamp(finitePositive(bounds.width, minWidth), minWidth, maxWidth);
	const height = clamp(finitePositive(bounds.height, minHeight), minHeight, maxHeight);
	return {
		x: clamp(finiteNumber(bounds.x, area.x), area.x, area.x + area.width - width),
		y: clamp(finiteNumber(bounds.y, area.y), area.y, area.y + area.height - height),
		width,
		height,
	};
}

export function getWindowManagerInvariantErrors(state: WindowManagerState) {
	const errors: string[] = [];
	const ids = Object.keys(state.windows);
	if (new Set(state.dockOrder).size !== state.dockOrder.length) errors.push('dockOrder contains duplicate ids');
	if (state.dockOrder.some((id) => !state.windows[id])) errors.push('dockOrder references missing windows');
	if (ids.some((id) => !state.dockOrder.includes(id))) errors.push('windows contains ids missing from dockOrder');
	if (new Set(state.order).size !== state.order.length) errors.push('order contains duplicate ids');
	if (state.order.some((id) => !state.windows[id])) errors.push('order references missing windows');
	if (ids.some((id) => !state.order.includes(id))) errors.push('windows contains ids missing from order');
	if (
		state.order.some(
			(id, index) =>
				index > 0 && windowOrderRank(state.windows[state.order[index - 1]]) > windowOrderRank(state.windows[id]),
		)
	) {
		errors.push('order violates normal, pinned, and fullscreen layers');
	}
	if (state.activeId && !state.windows[state.activeId]) errors.push('activeId references a missing window');
	if (state.activeId && state.windows[state.activeId]?.mode === 'minimized')
		errors.push('activeId references a minimized window');
	const fullscreenIds = ids.filter((id) => state.windows[id]?.mode === 'fullscreen');
	if (fullscreenIds.length > 1) errors.push('multiple fullscreen windows are active');
	if (fullscreenIds.length === 1 && state.activeId !== fullscreenIds[0]) {
		errors.push('fullscreen window is not active');
	}
	for (const win of Object.values(state.windows)) {
		if (!Number.isFinite(win.bounds.x + win.bounds.y + win.bounds.width + win.bounds.height)) {
			errors.push(`${win.id} has non-finite bounds`);
		}
		if (win.bounds.width <= 0 || win.bounds.height <= 0) errors.push(`${win.id} has non-positive size`);
	}
	return errors;
}

export function isWindowManagerSnapshot(value: unknown): value is WindowManagerSnapshot {
	if (!isRecord(value) || value.version !== WINDOW_MANAGER_SNAPSHOT_VERSION) return false;
	if (!Number.isFinite(value.savedAt) || !Array.isArray(value.windows) || !Array.isArray(value.order)) return false;
	if (!isRecord(value.dock)) return false;
	if (
		typeof value.dock.visible !== 'boolean' ||
		!['bottom', 'left', 'right'].includes(String(value.dock.position)) ||
		!isFiniteNonNegative(value.dock.size)
	) {
		return false;
	}
	if (!value.order.every((id): id is string => typeof id === 'string')) return false;
	if (new Set(value.order).size !== value.order.length) return false;
	if (value.dockOrder !== undefined) {
		if (!Array.isArray(value.dockOrder)) return false;
		if (!value.dockOrder.every((id): id is string => typeof id === 'string')) return false;
		if (new Set(value.dockOrder).size !== value.dockOrder.length) return false;
	}
	const ids = new Set<string>();
	for (const item of value.windows) {
		if (!isRecord(item) || typeof item.id !== 'string' || !item.id || ids.has(item.id)) return false;
		ids.add(item.id);
		if (typeof item.title !== 'string' || typeof item.kind !== 'string') return false;
		if (item.key !== undefined && typeof item.key !== 'string') return false;
		if (item.icon !== undefined && typeof item.icon !== 'string') return false;
		if (!isBounds(item.bounds) || !isRecord(item.size) || !isRecord(item.capabilities)) return false;
		if (!isFinitePositive(item.size.minWidth) || !isFinitePositive(item.size.minHeight)) return false;
		if (item.size.maxWidth !== undefined && !isFinitePositive(item.size.maxWidth)) return false;
		if (item.size.maxHeight !== undefined && !isFinitePositive(item.size.maxHeight)) return false;
		const capabilities = item.capabilities;
		if (
			!['close', 'fullscreen', 'maximize', 'minimize', 'move', 'resize'].every(
				(key) => typeof capabilities[key] === 'boolean',
			)
		) {
			return false;
		}
		if (!['normal', 'minimized', 'maximized', 'fullscreen'].includes(String(item.mode))) return false;
		if (!['normal', 'maximized', 'fullscreen'].includes(String(item.restoreMode))) return false;
		if (!['normal', 'maximized'].includes(String(item.fullscreenRestoreMode))) return false;
		if (!['default', 'none'].includes(String(item.chrome))) return false;
		if (item.pinned !== undefined && typeof item.pinned !== 'boolean') return false;
		if (typeof item.showInDock !== 'boolean' || item.persistence !== 'layout') return false;
	}
	if (!value.order.every((id) => ids.has(id)) || ids.size !== value.order.length) return false;
	return (
		value.dockOrder === undefined || (value.dockOrder.every((id) => ids.has(id)) && ids.size === value.dockOrder.length)
	);
}

function normalizeWorkspace(input: WindowManagerCreateOptions['workspace']): WindowManagerWorkspaceState {
	const workspace = {
		width: finitePositive(input?.width, DEFAULT_WORKSPACE.width),
		height: finitePositive(input?.height, DEFAULT_WORKSPACE.height),
		dock: { ...DEFAULT_DOCK, ...input?.dock },
	};
	workspace.dock = normalizeDock(workspace.dock, workspace);
	return workspace;
}

function normalizeDock(
	input: Partial<WindowManagerDockState>,
	workspace: Pick<WindowManagerWorkspaceState, 'width' | 'height'>,
): WindowManagerDockState {
	const position: WindowManagerDockState['position'] =
		input.position === 'left' || input.position === 'right' ? input.position : 'bottom';
	const maxSize = Math.max(0, (position === 'bottom' ? workspace.height : workspace.width) - 1);
	return {
		visible: input.visible ?? true,
		position,
		size: clamp(finiteNumber(input.size, DEFAULT_DOCK.size), 0, maxSize),
	};
}

function normalizeManagedWindow(
	input: Omit<Partial<ManagedWindow>, 'capabilities' | 'size'> &
		Pick<ManagedWindow, 'id' | 'title'> & {
			capabilities?: Partial<ManagedWindow['capabilities']>;
			size?: Partial<ManagedWindow['size']>;
		},
	workspace: WindowManagerWorkspaceState,
	defaultBounds: Partial<WindowManagerBounds>,
	defaultCapabilities: WindowManagerCapabilities,
): ManagedWindow {
	const size = {
		minWidth: Math.max(1, input.size?.minWidth ?? 240),
		minHeight: Math.max(1, input.size?.minHeight ?? 160),
		maxWidth: input.size?.maxWidth,
		maxHeight: input.size?.maxHeight,
	};
	const win: ManagedWindow = {
		id: input.id,
		key: input.key,
		kind: input.kind ?? 'default',
		title: input.title,
		icon: input.icon,
		data: input.data,
		bounds: { ...DEFAULT_BOUNDS, ...defaultBounds, ...input.bounds },
		size,
		capabilities: { ...defaultCapabilities, ...input.capabilities },
		mode: normalizeMode(input.mode),
		restoreMode: normalizeRestoreMode(input.restoreMode ?? input.mode),
		fullscreenRestoreMode: input.fullscreenRestoreMode === 'maximized' ? 'maximized' : 'normal',
		chrome: input.chrome === 'none' ? 'none' : 'default',
		showInDock: input.showInDock ?? true,
		persistence: input.persistence === 'none' ? 'none' : 'layout',
		pinned: input.pinned === true,
	};
	win.bounds = clampWindowManagerBounds(win.bounds, win, workspace);
	return win;
}

function normalizeMode(mode?: WindowManagerWindowMode): WindowManagerWindowMode {
	return mode === 'minimized' || mode === 'maximized' || mode === 'fullscreen' ? mode : 'normal';
}

function normalizeRestoreMode(mode?: WindowManagerWindowMode): WindowManagerRestoreMode {
	return mode === 'maximized' || mode === 'fullscreen' ? mode : 'normal';
}

function findTopVisibleId(state: Pick<WindowManagerState, 'order' | 'windows'>) {
	return [...state.order].reverse().find((id) => state.windows[id]?.mode !== 'minimized');
}

function restoreOtherFullscreenWindows(
	state: Pick<WindowManagerState, 'order' | 'windows'>,
	targetId: string,
): Array<{ id: string; mode: WindowManagerRestoreMode }> {
	const restored: Array<{ id: string; mode: WindowManagerRestoreMode }> = [];
	for (const win of Object.values(state.windows)) {
		if (win.id === targetId || win.mode !== 'fullscreen') continue;
		win.mode = win.fullscreenRestoreMode;
		win.restoreMode = win.mode;
		restored.push({ id: win.id, mode: win.mode });
	}
	state.order = normalizeWindowManagerOrder(state.order, state.windows);
	return restored;
}

function raiseWindowManagerWindow(state: Pick<WindowManagerState, 'order' | 'windows'>, id: string) {
	const win = state.windows[id];
	if (!win) return;
	const rank = windowOrderRank(win);
	const order = normalizeWindowManagerOrder(
		state.order.filter((item) => item !== id),
		state.windows,
	);
	const higherIndex = order.findIndex((item) => windowOrderRank(state.windows[item]) > rank);
	if (higherIndex < 0) order.push(id);
	else order.splice(higherIndex, 0, id);
	state.order = order;
}

function normalizeWindowManagerOrder(order: readonly string[], windows: Record<string, ManagedWindow>) {
	return [...order].sort((left, right) => windowOrderRank(windows[left]) - windowOrderRank(windows[right]));
}

function windowOrderRank(win: ManagedWindow | undefined) {
	if (win?.mode === 'fullscreen') return 2;
	return win?.pinned ? 1 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function cloneNullPrototypeRecord(value: Record<PropertyKey, unknown>) {
	const copy = createWindowManagerWindowRecord() as Record<PropertyKey, unknown>;
	for (const key of Reflect.ownKeys(value)) {
		if (key === WINDOW_MANAGER_WINDOW_RECORD) continue;
		const item = value[key];
		copy[key] = isManagedWindowRecordValue(item)
			? {
					...item,
					bounds: { ...item.bounds },
					capabilities: { ...item.capabilities },
					size: { ...item.size },
				}
			: item;
	}
	return copy;
}

function createWindowManagerWindowRecord() {
	const value = Object.create(null) as Record<string, ManagedWindow> & { [WINDOW_MANAGER_WINDOW_RECORD]?: true };
	Object.defineProperty(value, WINDOW_MANAGER_WINDOW_RECORD, { value: true });
	return value;
}

function isWindowManagerWindowRecord(
	value: unknown,
): value is Record<string, ManagedWindow> & { [WINDOW_MANAGER_WINDOW_RECORD]: true } {
	return Boolean(
		value &&
			typeof value === 'object' &&
			Object.getPrototypeOf(value) === null &&
			Reflect.get(value, WINDOW_MANAGER_WINDOW_RECORD) === true,
	);
}

function isManagedWindowRecordValue(value: unknown): value is ManagedWindow {
	return (
		isRecord(value) &&
		typeof value.id === 'string' &&
		typeof value.title === 'string' &&
		isRecord(value.bounds) &&
		isRecord(value.capabilities) &&
		isRecord(value.size)
	);
}

function isBounds(value: unknown): value is WindowManagerBounds {
	return (
		isRecord(value) &&
		isFiniteNumber(value.x) &&
		isFiniteNumber(value.y) &&
		isFinitePositive(value.width) &&
		isFinitePositive(value.height)
	);
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

function isFiniteNonNegative(value: unknown): value is number {
	return isFiniteNumber(value) && value >= 0;
}

function isFinitePositive(value: unknown): value is number {
	return isFiniteNumber(value) && value > 0;
}

function finitePositive(value: number | undefined, fallback: number) {
	return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function finiteNumber(value: number | undefined, fallback: number) {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), Math.max(min, max));
}
