import { DEFAULT_BOUNDS, DEFAULT_CAPABILITIES } from './WindowManagerDefaults';
import { normalizeManagedWindow, normalizeWorkspace } from './WindowManagerLayout';
import { finiteNonNegative, finiteNumber, finitePositive } from './WindowManagerNumberGuards';
import { findTopVisibleId, normalizeWindowManagerOrder } from './WindowManagerOrdering';
import { createWindowManagerWindowRecord } from './WindowManagerRecord';
import type { ManagedWindow, WindowManagerBounds, WindowManagerCapabilities, WindowManagerCreateOptions, WindowManagerState } from './WindowManagerTypes';

export type WindowManagerIdAllocator = { take: (existing: Record<string, ManagedWindow>, preferred?: string) => string };
export type WindowManagerInitialization = { cascadeOffset: number; defaultBounds: WindowManagerBounds; defaultCapabilities: WindowManagerCapabilities; initialState: Pick<WindowManagerState, 'activeId' | 'dockOrder' | 'order' | 'windows' | 'workspace'> };
export function createWindowManagerIdAllocator(idFactory?: () => string): WindowManagerIdAllocator {
	let sequence = 0; const createId = idFactory ?? (() => { sequence += 1; return `window-${sequence}`; });
	return { take(existing, preferred) { const baseId = preferred ?? createId(); let id = baseId; while (existing[id]) { sequence += 1; id = `${baseId}-${sequence}`; } return id; } };
}
export function initializeWindowManager(options: WindowManagerCreateOptions, ids: WindowManagerIdAllocator): WindowManagerInitialization {
	const cascadeOffset = finiteNonNegative(options.cascadeOffset, 28); const workspace = normalizeWorkspace(options.workspace);
	const defaultBounds = { x: finiteNumber(options.defaultBounds?.x, DEFAULT_BOUNDS.x), y: finiteNumber(options.defaultBounds?.y, DEFAULT_BOUNDS.y), width: finitePositive(options.defaultBounds?.width, DEFAULT_BOUNDS.width), height: finitePositive(options.defaultBounds?.height, DEFAULT_BOUNDS.height) };
	const defaultCapabilities = { ...DEFAULT_CAPABILITIES, ...options.defaultCapabilities }; const windows = createWindowManagerWindowRecord(); const dockOrder: string[] = []; const order: string[] = [];
	for (const initial of options.initialWindows ?? []) {
		const duplicate = initial.duplicate ?? 'focus-existing'; const matches = initial.key ? order.filter((id) => windows[id]?.key === initial.key) : [];
		if (matches.length && duplicate === 'focus-existing') { raiseInitialOrder(order, matches.at(-1)!); continue; }
		if (matches.length && duplicate === 'replace') { const protectedId = matches.find((id) => !windows[id]!.capabilities.close); if (protectedId) { raiseInitialOrder(order, protectedId); continue; } for (const id of matches) { delete windows[id]; removeInitialId(dockOrder, id); removeInitialId(order, id); } }
		const id = ids.take(windows, initial.id); const offset = cascadeOffset * (order.length % 8); const mode = initial.mode ?? 'normal';
		windows[id] = normalizeManagedWindow({ id, key: initial.key, kind: initial.kind ?? 'default', title: initial.title, icon: initial.icon, data: initial.data, bounds: { ...defaultBounds, x: (initial.bounds?.x ?? defaultBounds.x) + offset, y: (initial.bounds?.y ?? defaultBounds.y) + offset, ...initial.bounds }, size: initial.size, capabilities: initial.capabilities, mode, restoreMode: mode === 'minimized' ? 'normal' : mode, fullscreenRestoreMode: 'normal', chrome: initial.chrome ?? 'default', showInDock: initial.showInDock ?? true, persistence: initial.persistence ?? 'layout', pinned: initial.pinned ?? false }, workspace, defaultBounds, defaultCapabilities);
		dockOrder.push(id); order.push(id);
	}
	normalizeInitialFullscreenWindows(order, windows); order.splice(0, order.length, ...normalizeWindowManagerOrder(order, windows));
	return { cascadeOffset, defaultBounds, defaultCapabilities, initialState: { windows, dockOrder, order, activeId: findTopVisibleId({ windows, order }), workspace } };
}
function normalizeInitialFullscreenWindows(order: string[], windows: Record<string, ManagedWindow>) { const fullscreenIds = order.filter((id) => windows[id]?.mode === 'fullscreen'); for (const id of fullscreenIds.slice(0, -1)) { const win = windows[id]!; win.mode = win.fullscreenRestoreMode; win.restoreMode = win.mode; } const fullscreenId = fullscreenIds.at(-1); if (fullscreenId) raiseInitialOrder(order, fullscreenId); }
function raiseInitialOrder(order: string[], id: string) { removeInitialId(order, id); order.push(id); }
function removeInitialId(order: string[], id: string) { const index = order.indexOf(id); if (index >= 0) order.splice(index, 1); }
