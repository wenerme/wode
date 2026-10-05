import { windowOrderRank } from './WindowManagerOrdering';
import type { WindowManagerState } from './WindowManagerTypes';

/** Development/test-time consistency check for the window manager state machine. */
export function getWindowManagerInvariantErrors(state: WindowManagerState) {
	const errors: string[] = [];
	const ids = Object.keys(state.windows);
	if (new Set(state.dockOrder).size !== state.dockOrder.length) errors.push('dockOrder contains duplicate ids');
	if (state.dockOrder.some((id) => !state.windows[id])) errors.push('dockOrder references missing windows');
	if (ids.some((id) => !state.dockOrder.includes(id))) errors.push('windows contains ids missing from dockOrder');
	if (new Set(state.order).size !== state.order.length) errors.push('order contains duplicate ids');
	if (state.order.some((id) => !state.windows[id])) errors.push('order references missing windows');
	if (ids.some((id) => !state.order.includes(id))) errors.push('windows contains ids missing from order');
	if (state.order.some((id, index) => index > 0 && windowOrderRank(state.windows[state.order[index - 1]!]) > windowOrderRank(state.windows[id]))) errors.push('order violates normal, pinned, and fullscreen layers');
	if (state.activeId && !state.windows[state.activeId]) errors.push('activeId references a missing window');
	if (state.activeId && state.windows[state.activeId]?.mode === 'minimized') errors.push('activeId references a minimized window');
	const fullscreenIds = ids.filter((id) => state.windows[id]?.mode === 'fullscreen');
	if (fullscreenIds.length > 1) errors.push('multiple fullscreen windows are active');
	if (fullscreenIds.length === 1 && state.activeId !== fullscreenIds[0]) errors.push('fullscreen window is not active');
	for (const win of Object.values(state.windows)) {
		if (!Number.isFinite(win.bounds.x + win.bounds.y + win.bounds.width + win.bounds.height)) errors.push(`${win.id} has non-finite bounds`);
		if (win.bounds.width <= 0 || win.bounds.height <= 0) errors.push(`${win.id} has non-positive size`);
	}
	return errors;
}
