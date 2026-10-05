import type { ManagedWindow, WindowManagerRestoreMode, WindowManagerState } from './WindowManagerTypes';

export function findTopVisibleId(state: Pick<WindowManagerState, 'order' | 'windows'>) { return [...state.order].reverse().find((id) => state.windows[id]?.mode !== 'minimized'); }
export function restoreOtherFullscreenWindows(state: Pick<WindowManagerState, 'order' | 'windows'>, targetId: string): Array<{ id: string; mode: WindowManagerRestoreMode }> {
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
export function raiseWindowManagerWindow(state: Pick<WindowManagerState, 'order' | 'windows'>, id: string) {
	const win = state.windows[id];
	if (!win) return;
	const rank = windowOrderRank(win);
	const order = normalizeWindowManagerOrder(state.order.filter((item) => item !== id), state.windows);
	const higherIndex = order.findIndex((item) => windowOrderRank(state.windows[item]) > rank);
	if (higherIndex < 0) order.push(id); else order.splice(higherIndex, 0, id);
	state.order = order;
}
export function normalizeWindowManagerOrder(order: readonly string[], windows: Record<string, ManagedWindow>) { return [...order].sort((left, right) => windowOrderRank(windows[left]) - windowOrderRank(windows[right])); }
export function windowOrderRank(win: ManagedWindow | undefined) { if (win?.mode === 'fullscreen') return 2; return win?.pinned ? 1 : 0; }
