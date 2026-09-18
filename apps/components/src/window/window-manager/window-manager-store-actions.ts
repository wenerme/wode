import {
	clampWindowManagerBounds,
	createWindowManagerWindowRecord,
	DEFAULT_WINDOW_MANAGER_BOUNDS,
	findTopVisibleWindowId,
	finitePositive,
	getWindowManagerAvailableBounds,
	isWindowManagerSnapshot,
	normalizeManagedWindow,
	normalizeWindowManagerDock,
	normalizeWindowManagerOrder,
	normalizeWindowManagerRestoreMode,
	raiseWindowManagerWindow,
	restoreOtherFullscreenWindows,
} from './window-manager-store-helpers';
import type {
	ManagedWindow,
	WindowManagerActions,
	WindowManagerBounds,
	WindowManagerCapabilities,
	WindowManagerEvent,
	WindowManagerRestoreMode,
	WindowManagerState,
} from './window-manager-types';

type CreateWindowManagerActionsOptions = {
	cascadeOffset: number;
	defaultBounds: Partial<WindowManagerBounds>;
	defaultCapabilities: WindowManagerCapabilities;
	emit: (event: WindowManagerEvent) => void;
	getState: () => WindowManagerState;
	setState: (updater: (state: WindowManagerState) => void) => void;
	takeUniqueId: (existing: Record<string, ManagedWindow>, preferred?: string) => string;
};

export function createWindowManagerActions({
	cascadeOffset,
	defaultBounds,
	defaultCapabilities,
	emit,
	getState,
	setState,
	takeUniqueId,
}: CreateWindowManagerActionsOptions): WindowManagerActions {
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
		)
			return true;
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
				if (state.activeId === id) state.activeId = findTopVisibleWindowId(state);
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
				dock: normalizeWindowManagerDock(snapshot.dock, currentWorkspace),
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
				state.activeId = findTopVisibleWindowId(state);
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
				win.restoreMode = normalizeWindowManagerRestoreMode(win.mode);
				win.mode = 'minimized';
				state.order = normalizeWindowManagerOrder(state.order, state.windows);
				if (state.activeId === id) state.activeId = findTopVisibleWindowId(state);
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
					win.restoreMode = normalizeWindowManagerRestoreMode(win.mode);
					win.mode = 'minimized';
					minimized.push(id);
				}
				state.order = normalizeWindowManagerOrder(state.order, state.windows);
				state.activeId = findTopVisibleWindowId(state);
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
				for (const candidate of existingWindows) actions.close(candidate.id);
			}
			const id = takeUniqueId(getState().windows, openOptions.id);
			const state = getState();
			const offset = cascadeOffset * (state.order.length % 8);
			const bounds: WindowManagerBounds = {
				x: (openOptions.bounds?.x ?? defaultBounds.x ?? DEFAULT_WINDOW_MANAGER_BOUNDS.x) + offset,
				y: (openOptions.bounds?.y ?? defaultBounds.y ?? DEFAULT_WINDOW_MANAGER_BOUNDS.y) + offset,
				width: openOptions.bounds?.width ?? defaultBounds.width ?? DEFAULT_WINDOW_MANAGER_BOUNDS.width,
				height: openOptions.bounds?.height ?? defaultBounds.height ?? DEFAULT_WINDOW_MANAGER_BOUNDS.height,
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
							x: (defaultBounds.x ?? DEFAULT_WINDOW_MANAGER_BOUNDS.x) + cascadeOffset * (index % 8),
							y: (defaultBounds.y ?? DEFAULT_WINDOW_MANAGER_BOUNDS.y) + cascadeOffset * (index % 8),
							width: defaultBounds.width ?? DEFAULT_WINDOW_MANAGER_BOUNDS.width,
							height: defaultBounds.height ?? DEFAULT_WINDOW_MANAGER_BOUNDS.height,
						},
						win,
						state.workspace,
					);
				});
				state.order = normalizeWindowManagerOrder(state.order, state.windows);
				state.activeId = findTopVisibleWindowId(state);
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
				state.workspace.dock = normalizeWindowManagerDock({ ...state.workspace.dock, ...dock }, state.workspace);
				for (const win of Object.values(state.windows))
					win.bounds = clampWindowManagerBounds(win.bounds, win, state.workspace);
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
				state.workspace.dock = normalizeWindowManagerDock(state.workspace.dock, state.workspace);
				for (const win of Object.values(state.windows))
					win.bounds = clampWindowManagerBounds(win.bounds, win, state.workspace);
			});
		},
		toggle: (openOptions) => {
			const existing = openOptions.key
				? Object.values(getState().windows).find((win) => win.key === openOptions.key)
				: undefined;
			if (!existing) return actions.open(openOptions);
			if (existing.mode === 'minimized') actions.restore(existing.id);
			else if (getState().activeId === existing.id && existing.capabilities.minimize) actions.minimize(existing.id);
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

	return actions;
}
