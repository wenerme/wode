import { DEFAULT_BOUNDS, DEFAULT_DOCK, DEFAULT_WORKSPACE } from './WindowManagerDefaults';
import { finiteNumber, finitePositive } from './WindowManagerNumberGuards';
import type { ManagedWindow, WindowManagerBounds, WindowManagerCreateOptions, WindowManagerDockState, WindowManagerRestoreMode, WindowManagerWindowMode, WindowManagerWorkspaceState } from './WindowManagerTypes';

function clamp(value: number, min: number, max: number) { return Math.min(Math.max(value, min), Math.max(min, max)); }
export function getWindowManagerAvailableBounds(workspace: WindowManagerWorkspaceState): WindowManagerBounds {
	let x = 0; let y = 0; let width = Math.max(1, workspace.width); let height = Math.max(1, workspace.height);
	if (!workspace.dock.visible) return { x, y, width, height };
	const size = Math.max(0, workspace.dock.size);
	if (workspace.dock.position === 'left') { x = Math.min(size, width - 1); width = Math.max(1, width - size); }
	else if (workspace.dock.position === 'right') width = Math.max(1, width - size);
	else height = Math.max(1, height - size);
	return { x, y, width, height };
}
export function getWindowManagerRenderBounds(win: ManagedWindow, workspace: WindowManagerWorkspaceState) { if (win.mode === 'fullscreen') return { x: 0, y: 0, width: workspace.width, height: workspace.height }; if (win.mode === 'maximized') return getWindowManagerAvailableBounds(workspace); return win.bounds; }
export function clampWindowManagerBounds(bounds: WindowManagerBounds, win: Pick<ManagedWindow, 'size'>, workspace: WindowManagerWorkspaceState) {
	const area = getWindowManagerAvailableBounds(workspace);
	const minWidth = Math.min(Math.max(1, win.size.minWidth), area.width); const minHeight = Math.min(Math.max(1, win.size.minHeight), area.height);
	const maxWidth = Math.min(Math.max(minWidth, win.size.maxWidth ?? area.width), area.width); const maxHeight = Math.min(Math.max(minHeight, win.size.maxHeight ?? area.height), area.height);
	const width = clamp(finitePositive(bounds.width, minWidth), minWidth, maxWidth); const height = clamp(finitePositive(bounds.height, minHeight), minHeight, maxHeight);
	return { x: clamp(finiteNumber(bounds.x, area.x), area.x, area.x + area.width - width), y: clamp(finiteNumber(bounds.y, area.y), area.y, area.y + area.height - height), width, height };
}
export function normalizeWorkspace(input: WindowManagerCreateOptions['workspace']): WindowManagerWorkspaceState {
	const workspace = { width: finitePositive(input?.width, DEFAULT_WORKSPACE.width), height: finitePositive(input?.height, DEFAULT_WORKSPACE.height), dock: { ...DEFAULT_DOCK, ...input?.dock } };
	workspace.dock = normalizeDock(workspace.dock, workspace); return workspace;
}
export function normalizeDock(input: Partial<WindowManagerDockState>, workspace: Pick<WindowManagerWorkspaceState, 'width' | 'height'>): WindowManagerDockState {
	const position: WindowManagerDockState['position'] = input.position === 'left' || input.position === 'right' ? input.position : 'bottom';
	const maxSize = Math.max(0, (position === 'bottom' ? workspace.height : workspace.width) - 1);
	return { visible: input.visible ?? true, position, size: clamp(finiteNumber(input.size, DEFAULT_DOCK.size), 0, maxSize) };
}
export function normalizeManagedWindow(input: Omit<Partial<ManagedWindow>, 'capabilities' | 'size'> & Pick<ManagedWindow, 'id' | 'title'> & { capabilities?: Partial<ManagedWindow['capabilities']>; size?: Partial<ManagedWindow['size']> }, workspace: WindowManagerWorkspaceState, defaultBounds: Partial<WindowManagerBounds>, defaultCapabilities: ManagedWindow['capabilities']): ManagedWindow {
	const minWidth = finitePositive(input.size?.minWidth, 240); const minHeight = finitePositive(input.size?.minHeight, 160);
	const size = { minWidth, minHeight, maxWidth: normalizeMaximumSize(input.size?.maxWidth, minWidth), maxHeight: normalizeMaximumSize(input.size?.maxHeight, minHeight) };
	const win: ManagedWindow = { id: input.id, key: input.key, kind: input.kind ?? 'default', title: input.title, icon: input.icon, data: input.data, bounds: { ...DEFAULT_BOUNDS, ...defaultBounds, ...input.bounds }, size, capabilities: { ...defaultCapabilities, ...input.capabilities }, mode: normalizeMode(input.mode), restoreMode: normalizeRestoreMode(input.restoreMode ?? input.mode), fullscreenRestoreMode: input.fullscreenRestoreMode === 'maximized' ? 'maximized' : 'normal', chrome: input.chrome === 'none' ? 'none' : 'default', showInDock: input.showInDock ?? true, persistence: input.persistence === 'none' ? 'none' : 'layout', pinned: input.pinned === true };
	win.bounds = clampWindowManagerBounds(win.bounds, win, workspace); return win;
}
function normalizeMaximumSize(value: number | undefined, minimum: number): number | undefined { return value === undefined ? undefined : Math.max(minimum, finitePositive(value, minimum)); }
function normalizeMode(mode?: WindowManagerWindowMode): WindowManagerWindowMode { return mode === 'minimized' || mode === 'maximized' || mode === 'fullscreen' ? mode : 'normal'; }
export function normalizeRestoreMode(mode?: WindowManagerWindowMode): WindowManagerRestoreMode { return mode === 'maximized' || mode === 'fullscreen' ? mode : 'normal'; }
