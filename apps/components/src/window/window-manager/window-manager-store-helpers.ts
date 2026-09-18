import type {
	ManagedWindow,
	WindowManagerBounds,
	WindowManagerCapabilities,
	WindowManagerCreateOptions,
	WindowManagerDockState,
	WindowManagerRestoreMode,
	WindowManagerSnapshot,
	WindowManagerState,
	WindowManagerWindowMode,
	WindowManagerWorkspaceState,
} from './window-manager-types';
import { WINDOW_MANAGER_SNAPSHOT_VERSION } from './window-manager-types';

export const DEFAULT_WINDOW_MANAGER_BOUNDS: WindowManagerBounds = { x: 64, y: 48, width: 640, height: 420 };
export const DEFAULT_WINDOW_MANAGER_CAPABILITIES: WindowManagerCapabilities = {
	close: true,
	fullscreen: true,
	maximize: true,
	minimize: true,
	move: true,
	resize: true,
};
const DEFAULT_DOCK: WindowManagerDockState = { visible: true, position: 'bottom', size: 52 };
const DEFAULT_WORKSPACE: WindowManagerWorkspaceState = { width: 1280, height: 720, dock: DEFAULT_DOCK };
const WINDOW_MANAGER_WINDOW_RECORD = Symbol('WindowManagerWindowRecord');

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
				index > 0 &&
				windowManagerOrderRank(state.windows[state.order[index - 1]]) > windowManagerOrderRank(state.windows[id]),
		)
	)
		errors.push('order violates normal, pinned, and fullscreen layers');
	if (state.activeId && !state.windows[state.activeId]) errors.push('activeId references a missing window');
	if (state.activeId && state.windows[state.activeId]?.mode === 'minimized')
		errors.push('activeId references a minimized window');
	const fullscreenIds = ids.filter((id) => state.windows[id]?.mode === 'fullscreen');
	if (fullscreenIds.length > 1) errors.push('multiple fullscreen windows are active');
	if (fullscreenIds.length === 1 && state.activeId !== fullscreenIds[0]) errors.push('fullscreen window is not active');
	for (const win of Object.values(state.windows)) {
		if (!Number.isFinite(win.bounds.x + win.bounds.y + win.bounds.width + win.bounds.height))
			errors.push(`${win.id} has non-finite bounds`);
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
	)
		return false;
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
		)
			return false;
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

export function normalizeWindowManagerWorkspace(
	input: WindowManagerCreateOptions['workspace'],
): WindowManagerWorkspaceState {
	const workspace = {
		width: finitePositive(input?.width, DEFAULT_WORKSPACE.width),
		height: finitePositive(input?.height, DEFAULT_WORKSPACE.height),
		dock: { ...DEFAULT_DOCK, ...input?.dock },
	};
	workspace.dock = normalizeWindowManagerDock(workspace.dock, workspace);
	return workspace;
}

export function normalizeWindowManagerDock(
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

export function normalizeManagedWindow(
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
		bounds: { ...DEFAULT_WINDOW_MANAGER_BOUNDS, ...defaultBounds, ...input.bounds },
		size,
		capabilities: { ...defaultCapabilities, ...input.capabilities },
		mode: normalizeWindowManagerMode(input.mode),
		restoreMode: normalizeWindowManagerRestoreMode(input.restoreMode ?? input.mode),
		fullscreenRestoreMode: input.fullscreenRestoreMode === 'maximized' ? 'maximized' : 'normal',
		chrome: input.chrome === 'none' ? 'none' : 'default',
		showInDock: input.showInDock ?? true,
		persistence: input.persistence === 'none' ? 'none' : 'layout',
		pinned: input.pinned === true,
	};
	win.bounds = clampWindowManagerBounds(win.bounds, win, workspace);
	return win;
}

export function normalizeWindowManagerRestoreMode(mode?: WindowManagerWindowMode): WindowManagerRestoreMode {
	return mode === 'maximized' || mode === 'fullscreen' ? mode : 'normal';
}

export function findTopVisibleWindowId(state: Pick<WindowManagerState, 'order' | 'windows'>) {
	return [...state.order].reverse().find((id) => state.windows[id]?.mode !== 'minimized');
}

export function restoreOtherFullscreenWindows(
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

export function raiseWindowManagerWindow(state: Pick<WindowManagerState, 'order' | 'windows'>, id: string) {
	const win = state.windows[id];
	if (!win) return;
	const rank = windowManagerOrderRank(win);
	const order = normalizeWindowManagerOrder(
		state.order.filter((item) => item !== id),
		state.windows,
	);
	const higherIndex = order.findIndex((item) => windowManagerOrderRank(state.windows[item]) > rank);
	if (higherIndex < 0) order.push(id);
	else order.splice(higherIndex, 0, id);
	state.order = order;
}

export function normalizeWindowManagerOrder(order: readonly string[], windows: Record<string, ManagedWindow>) {
	return [...order].sort(
		(left, right) => windowManagerOrderRank(windows[left]) - windowManagerOrderRank(windows[right]),
	);
}

export function createWindowManagerWindowRecord() {
	const value = Object.create(null) as Record<string, ManagedWindow> & { [WINDOW_MANAGER_WINDOW_RECORD]?: true };
	Object.defineProperty(value, WINDOW_MANAGER_WINDOW_RECORD, { value: true });
	return value;
}

export function cloneWindowManagerWindowRecord(value: Record<PropertyKey, unknown>) {
	const copy = createWindowManagerWindowRecord() as Record<PropertyKey, unknown>;
	for (const key of Reflect.ownKeys(value)) {
		if (key === WINDOW_MANAGER_WINDOW_RECORD) continue;
		const item = value[key];
		copy[key] = isManagedWindowRecordValue(item)
			? { ...item, bounds: { ...item.bounds }, capabilities: { ...item.capabilities }, size: { ...item.size } }
			: item;
	}
	return copy;
}

export function isWindowManagerWindowRecord(
	value: unknown,
): value is Record<string, ManagedWindow> & { [WINDOW_MANAGER_WINDOW_RECORD]: true } {
	return Boolean(
		value &&
			typeof value === 'object' &&
			Object.getPrototypeOf(value) === null &&
			Reflect.get(value, WINDOW_MANAGER_WINDOW_RECORD) === true,
	);
}

export function finitePositive(value: number | undefined, fallback: number) {
	return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeWindowManagerMode(mode?: WindowManagerWindowMode): WindowManagerWindowMode {
	return mode === 'minimized' || mode === 'maximized' || mode === 'fullscreen' ? mode : 'normal';
}

function windowManagerOrderRank(win: ManagedWindow | undefined) {
	if (win?.mode === 'fullscreen') return 2;
	return win?.pinned ? 1 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isManagedWindowRecordValue(value: unknown): value is ManagedWindow {
	return Boolean(
		isRecord(value) &&
			typeof value.id === 'string' &&
			typeof value.title === 'string' &&
			isRecord(value.bounds) &&
			isRecord(value.capabilities) &&
			isRecord(value.size),
	);
}

function isBounds(value: unknown): value is WindowManagerBounds {
	return Boolean(
		isRecord(value) &&
			isFiniteNumber(value.x) &&
			isFiniteNumber(value.y) &&
			isFinitePositive(value.width) &&
			isFinitePositive(value.height),
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

function finiteNumber(value: number | undefined, fallback: number) {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), Math.max(min, max));
}
