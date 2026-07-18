export const WINDOW_MANAGER_SNAPSHOT_VERSION = 1;

export type WindowManagerWindowMode = 'normal' | 'minimized' | 'maximized' | 'fullscreen';
export type WindowManagerRestoreMode = Exclude<WindowManagerWindowMode, 'minimized'>;
export type WindowManagerChrome = 'default' | 'none';
export type WindowManagerDockPosition = 'bottom' | 'left' | 'right';
export type WindowManagerDuplicatePolicy = 'focus-existing' | 'replace' | 'allow';
export type WindowManagerPersistencePolicy = 'layout' | 'none';

export type WindowManagerBounds = {
	height: number;
	width: number;
	x: number;
	y: number;
};

export type WindowManagerSizeConstraints = {
	maxHeight?: number;
	maxWidth?: number;
	minHeight: number;
	minWidth: number;
};

export type WindowManagerCapabilities = {
	close: boolean;
	fullscreen: boolean;
	maximize: boolean;
	minimize: boolean;
	move: boolean;
	resize: boolean;
};

export type ManagedWindow = {
	bounds: WindowManagerBounds;
	capabilities: WindowManagerCapabilities;
	chrome: WindowManagerChrome;
	data?: unknown;
	fullscreenRestoreMode: Exclude<WindowManagerRestoreMode, 'fullscreen'>;
	icon?: string;
	id: string;
	key?: string;
	kind: string;
	mode: WindowManagerWindowMode;
	persistence: WindowManagerPersistencePolicy;
	pinned: boolean;
	restoreMode: WindowManagerRestoreMode;
	showInDock: boolean;
	size: WindowManagerSizeConstraints;
	title: string;
};

export type WindowManagerDockState = {
	position: WindowManagerDockPosition;
	size: number;
	visible: boolean;
};

export type WindowManagerWorkspaceState = {
	dock: WindowManagerDockState;
	height: number;
	width: number;
};

export type WindowManagerHydrationState = {
	error?: string;
	status: 'idle' | 'hydrating' | 'ready' | 'error';
};

export type WindowManagerOpenOptions = {
	bounds?: Partial<WindowManagerBounds>;
	capabilities?: Partial<WindowManagerCapabilities>;
	chrome?: WindowManagerChrome;
	data?: unknown;
	duplicate?: WindowManagerDuplicatePolicy;
	icon?: string;
	id?: string;
	key?: string;
	kind?: string;
	mode?: WindowManagerWindowMode;
	persistence?: WindowManagerPersistencePolicy;
	pinned?: boolean;
	showInDock?: boolean;
	size?: Partial<WindowManagerSizeConstraints>;
	title: string;
};

export type WindowManagerWindowPatch = {
	capabilities?: Partial<WindowManagerCapabilities>;
	data?: unknown;
	icon?: string;
	key?: string;
	showInDock?: boolean;
	title?: string;
};

export type WindowManagerEvent =
	| { type: 'opened'; id: string; window: ManagedWindow }
	| { type: 'closed'; id: string; result?: unknown; window: ManagedWindow }
	| { type: 'focused'; id: string }
	| { type: 'minimized'; id: string }
	| { type: 'maximized'; id: string }
	| { type: 'fullscreen'; id: string }
	| { type: 'pinned'; id: string; pinned: boolean }
	| { type: 'restored'; id: string; mode: WindowManagerRestoreMode }
	| { type: 'moved'; id: string; bounds: WindowManagerBounds }
	| { type: 'resized'; id: string; bounds: WindowManagerBounds }
	| { type: 'updated'; id: string };

export type WindowManagerEventListener = (event: WindowManagerEvent) => void;

export type WindowManagerActions = {
	center: (id: string) => boolean;
	close: (id: string, result?: unknown) => boolean;
	closeAll: () => void;
	cycleFocus: (direction?: 1 | -1) => string | undefined;
	focus: (id: string) => boolean;
	fullscreen: (id: string) => boolean;
	hydrateLayout: (snapshot: WindowManagerSnapshot, options?: { restoreMinimized?: boolean }) => boolean;
	maximize: (id: string) => boolean;
	minimize: (id: string) => boolean;
	minimizeAll: () => void;
	moveBy: (id: string, delta: { x: number; y: number }) => boolean;
	open: (options: WindowManagerOpenOptions) => string;
	resetLayout: () => void;
	resizeBy: (id: string, delta: { height: number; width: number }) => boolean;
	restore: (id: string) => boolean;
	setPinned: (id: string, pinned: boolean) => boolean;
	setBounds: (id: string, bounds: Partial<WindowManagerBounds>, reason?: 'move' | 'resize') => boolean;
	setDock: (dock: Partial<WindowManagerDockState>) => void;
	setHydration: (hydration: WindowManagerHydrationState) => void;
	setWorkspaceSize: (size: { height: number; width: number }) => void;
	toggle: (options: WindowManagerOpenOptions) => string;
	toggleFullscreen: (id: string) => boolean;
	toggleMaximize: (id: string) => boolean;
	togglePinned: (id: string) => boolean;
	update: (id: string, patch: WindowManagerWindowPatch) => boolean;
};

export type WindowManagerState = {
	actions: WindowManagerActions;
	activeId?: string;
	dockOrder: string[];
	hydration: WindowManagerHydrationState;
	order: string[];
	windows: Record<string, ManagedWindow>;
	workspace: WindowManagerWorkspaceState;
};

export type WindowManagerSnapshotWindow = Omit<ManagedWindow, 'data' | 'pinned'> & {
	data?: unknown;
	pinned?: boolean;
};

export type WindowManagerSnapshot = {
	dock: WindowManagerDockState;
	dockOrder?: string[];
	order: string[];
	savedAt: number;
	version: number;
	windows: WindowManagerSnapshotWindow[];
};

export type WindowManagerStorage = {
	getItem: (key: string) => string | null;
	removeItem: (key: string) => void;
	setItem: (key: string, value: string) => void;
};

export type WindowManagerCreateOptions = {
	actions?: Partial<WindowManagerActions>;
	cascadeOffset?: number;
	defaultBounds?: Partial<WindowManagerBounds>;
	defaultCapabilities?: Partial<WindowManagerCapabilities>;
	idFactory?: () => string;
	initialWindows?: readonly WindowManagerOpenOptions[];
	onEvent?: WindowManagerEventListener;
	workspace?: Partial<Omit<WindowManagerWorkspaceState, 'dock'>> & { dock?: Partial<WindowManagerDockState> };
};
