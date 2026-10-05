import type { WindowManagerIdAllocator } from './WindowManagerInitialization';
import { normalizeDock, normalizeManagedWindow } from './WindowManagerLayout';
import { findTopVisibleId, normalizeWindowManagerOrder } from './WindowManagerOrdering';
import { createWindowManagerWindowRecord } from './WindowManagerRecord';
import type { WindowManagerBounds, WindowManagerCapabilities, WindowManagerSnapshot, WindowManagerState } from './WindowManagerTypes';

export function createHydratedWindowManagerState({ currentState, defaultBounds, defaultCapabilities, ids, restoreMinimized, snapshot }: { currentState: WindowManagerState; defaultBounds: WindowManagerBounds; defaultCapabilities: WindowManagerCapabilities; ids: WindowManagerIdAllocator; restoreMinimized: boolean; snapshot: WindowManagerSnapshot }): Pick<WindowManagerState, 'activeId' | 'dockOrder' | 'order' | 'windows' | 'workspace'> {
	const workspace = { ...currentState.workspace, dock: normalizeDock(snapshot.dock, currentState.workspace) }; const windows = createWindowManagerWindowRecord();
	const ephemeralOrder = currentState.order.filter((id) => currentState.windows[id]?.persistence === 'none');
	for (const id of ephemeralOrder) { const win = currentState.windows[id]; if (win) windows[id] = normalizeManagedWindow(win, workspace, defaultBounds, defaultCapabilities); }
	const hydratedIds = new Map<string, string>(); const hydratedOrder: string[] = [];
	for (const item of snapshot.windows) {
		if (item.persistence === 'none' || hasEphemeralKeyConflict(windows, item.key)) continue;
		const id = windows[item.id] ? ids.take(windows, item.id) : item.id; const mode = !restoreMinimized && item.mode === 'minimized' ? item.restoreMode : item.mode;
		windows[id] = normalizeManagedWindow({ ...item, id, mode, data: item.data }, workspace, defaultBounds, defaultCapabilities); hydratedIds.set(item.id, id); hydratedOrder.push(id);
	}
	const order = remapSnapshotOrder(snapshot.order, hydratedIds); appendMissing(order, hydratedOrder); appendMissing(order, ephemeralOrder);
	const dockOrder = remapSnapshotOrder(snapshot.dockOrder ?? snapshot.order, hydratedIds); appendMissing(dockOrder, hydratedOrder); appendMissing(dockOrder, currentState.dockOrder.filter((id) => windows[id]?.persistence === 'none')); appendMissing(dockOrder, ephemeralOrder);
	normalizeFullscreenWindows(order, windows); const rankedOrder = normalizeWindowManagerOrder(order, windows);
	return { windows, dockOrder, order: rankedOrder, activeId: findTopVisibleId({ windows, order: rankedOrder }), workspace };
}
function hasEphemeralKeyConflict(windows: WindowManagerState['windows'], key: string | undefined): boolean { return Boolean(key && Object.values(windows).some((win) => win.persistence === 'none' && win.key === key)); }
function remapSnapshotOrder(order: readonly string[], ids: ReadonlyMap<string, string>): string[] { return order.flatMap((id) => { const hydratedId = ids.get(id); return hydratedId ? [hydratedId] : []; }); }
function appendMissing(target: string[], values: readonly string[]) { for (const id of values) if (!target.includes(id)) target.push(id); }
function normalizeFullscreenWindows(order: string[], windows: WindowManagerState['windows']) { const fullscreenIds = order.filter((id) => windows[id]?.mode === 'fullscreen'); for (const id of fullscreenIds.slice(0, -1)) { const win = windows[id]!; win.mode = win.fullscreenRestoreMode; win.restoreMode = win.mode; } const fullscreenId = fullscreenIds.at(-1); if (fullscreenId) { order.splice(order.indexOf(fullscreenId), 1); order.push(fullscreenId); } }
