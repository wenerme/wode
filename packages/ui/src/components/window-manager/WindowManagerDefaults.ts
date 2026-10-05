import type { WindowManagerBounds, WindowManagerCapabilities, WindowManagerDockState, WindowManagerWorkspaceState } from './WindowManagerTypes';

export const DEFAULT_BOUNDS: WindowManagerBounds = { x: 64, y: 48, width: 640, height: 420 };
export const DEFAULT_CAPABILITIES: WindowManagerCapabilities = { close: true, fullscreen: true, maximize: true, minimize: true, move: true, resize: true };
export const DEFAULT_DOCK: WindowManagerDockState = { visible: true, position: 'bottom', size: 52 };
export const DEFAULT_WORKSPACE: WindowManagerWorkspaceState = { width: 1280, height: 720, dock: DEFAULT_DOCK };
