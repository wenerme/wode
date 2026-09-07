import { describe, expect, it } from 'vite-plus/test';
import {
	createWindowManagerStore,
	getWindowManagerAvailableBounds,
	getWindowManagerInvariantErrors,
	getWindowManagerRenderBounds,
} from './window-manager-store';
import { createWindowManagerTestStore } from './window-manager-store.test-support';

describe('window manager modes and geometry', () => {
	it('preserves the complete maximize, fullscreen, minimize, and restore chain', () => {
		const store = createWindowManagerTestStore();
		const id = store.getState().actions.open({ title: 'Editor', bounds: { x: 91, y: 73, width: 500, height: 330 } });
		const normal = store.getState().windows[id].bounds;

		expect(store.getState().actions.maximize(id)).toBe(true);
		expect(getWindowManagerRenderBounds(store.getState().windows[id], store.getState().workspace)).toEqual({
			x: 0,
			y: 0,
			width: 800,
			height: 550,
		});
		expect(store.getState().actions.fullscreen(id)).toBe(true);
		expect(getWindowManagerRenderBounds(store.getState().windows[id], store.getState().workspace)).toEqual({
			x: 0,
			y: 0,
			width: 800,
			height: 600,
		});
		store.getState().actions.minimize(id);
		store.getState().actions.restore(id);
		expect(store.getState().windows[id].mode).toBe('fullscreen');
		store.getState().actions.restore(id);
		expect(store.getState().windows[id].mode).toBe('maximized');
		store.getState().actions.restore(id);
		expect(store.getState().windows[id].mode).toBe('normal');
		expect(store.getState().windows[id].bounds).toEqual(normal);
	});

	it('keeps workspace fullscreen exclusive across focus, cycling, and opening', () => {
		const store = createWindowManagerTestStore();
		const first = store.getState().actions.open({ title: 'First' });
		const second = store.getState().actions.open({ title: 'Second' });
		store.getState().actions.maximize(first);
		store.getState().actions.fullscreen(first);
		expect(store.getState().actions.cycleFocus()).toBe(first);
		expect(store.getState().windows[first].mode).toBe('fullscreen');
		store.getState().actions.focus(second);
		expect(store.getState().windows[first].mode).toBe('maximized');
		expect(store.getState().activeId).toBe(second);
		store.getState().actions.fullscreen(second);
		const third = store.getState().actions.open({ title: 'Third' });
		expect(store.getState().windows[second].mode).toBe('normal');
		expect(store.getState().activeId).toBe(third);
		expect(getWindowManagerInvariantErrors(store.getState())).toEqual([]);
	});

	it('renders workspace fullscreen above pinned windows and restores its previous layer', () => {
		const store = createWindowManagerTestStore();
		const pinned = store.getState().actions.open({ title: 'Pinned', pinned: true });
		const fullscreen = store.getState().actions.open({ title: 'Fullscreen' });
		store.getState().actions.fullscreen(fullscreen);
		expect(store.getState().order).toEqual([pinned, fullscreen]);
		store.getState().actions.restore(fullscreen);
		expect(store.getState().order).toEqual([fullscreen, pinned]);
		store.getState().actions.fullscreen(fullscreen);
		store.getState().actions.resetLayout();
		expect(store.getState().order).toEqual([fullscreen, pinned]);
		expect(store.getState().windows[fullscreen].mode).toBe('normal');
		expect(getWindowManagerInvariantErrors(store.getState())).toEqual([]);
	});

	it('reorders fullscreen windows when minimize changes their layer', () => {
		const store = createWindowManagerTestStore();
		const pinned = store.getState().actions.open({ title: 'Pinned', pinned: true });
		const fullscreen = store.getState().actions.open({ title: 'Fullscreen' });
		store.getState().actions.fullscreen(fullscreen);
		store.getState().actions.minimize(fullscreen);
		expect(store.getState().order).toEqual([fullscreen, pinned]);
		expect(store.getState().activeId).toBe(pinned);
		expect(getWindowManagerInvariantErrors(store.getState())).toEqual([]);
		store.getState().actions.restore(fullscreen);
		expect(store.getState().order).toEqual([pinned, fullscreen]);
		store.getState().actions.minimizeAll();
		expect(store.getState().order).toEqual([fullscreen, pinned]);
		expect(store.getState().activeId).toBeUndefined();
		expect(getWindowManagerInvariantErrors(store.getState())).toEqual([]);
	});

	it('restores a minimized maximized window after entering fullscreen', () => {
		const store = createWindowManagerTestStore();
		const id = store.getState().actions.open({ title: 'Editor' });
		store.getState().actions.maximize(id);
		store.getState().actions.minimize(id);
		expect(store.getState().actions.fullscreen(id)).toBe(true);
		expect(store.getState().windows[id].mode).toBe('fullscreen');
		store.getState().actions.restore(id);
		expect(store.getState().windows[id].mode).toBe('maximized');
	});

	it('normalizes multiple initial fullscreen windows to the topmost declaration', () => {
		const store = createWindowManagerStore({
			initialWindows: [
				{ id: 'first', title: 'First', mode: 'fullscreen' },
				{ id: 'normal', title: 'Normal' },
				{ id: 'second', title: 'Second', mode: 'fullscreen' },
			],
		});
		expect(store.getState().windows.first.mode).toBe('normal');
		expect(store.getState().windows.second.mode).toBe('fullscreen');
		expect(store.getState().order.at(-1)).toBe('second');
		expect(store.getState().activeId).toBe('second');
		expect(getWindowManagerInvariantErrors(store.getState())).toEqual([]);
	});

	it('restores a minimized window when it is focused', () => {
		const store = createWindowManagerTestStore();
		const first = store.getState().actions.open({ title: 'First' });
		store.getState().actions.maximize(first);
		store.getState().actions.minimize(first);
		expect(store.getState().activeId).toBeUndefined();
		store.getState().actions.focus(first);
		expect(store.getState().windows[first].mode).toBe('maximized');
		expect(store.getState().activeId).toBe(first);
	});

	it('clamps oversized, off-screen, and non-finite bounds into the available workspace', () => {
		const store = createWindowManagerTestStore();
		const id = store.getState().actions.open({
			title: 'Large',
			bounds: { x: -500, y: Number.NaN, width: 5000, height: 5000 },
		});
		expect(store.getState().windows[id].bounds).toEqual({ x: 0, y: 0, width: 800, height: 550 });
		store.getState().actions.setBounds(id, { x: 9999, y: 9999, width: 300, height: 200 }, 'resize');
		expect(store.getState().windows[id].bounds).toEqual({ x: 500, y: 350, width: 300, height: 200 });
	});

	it('reconciles windows after workspace and dock changes', () => {
		const store = createWindowManagerTestStore();
		const id = store.getState().actions.open({
			title: 'Inspector',
			bounds: { x: 400, y: 300, width: 400, height: 250 },
		});
		store.getState().actions.setDock({ position: 'left', size: 80 });
		expect(getWindowManagerAvailableBounds(store.getState().workspace)).toEqual({
			x: 80,
			y: 0,
			width: 720,
			height: 600,
		});
		expect(store.getState().windows[id].bounds.x).toBeGreaterThanOrEqual(80);
		store.getState().actions.setWorkspaceSize({ width: 320, height: 240 });
		expect(store.getState().windows[id].bounds).toEqual({ x: 80, y: 0, width: 240, height: 240 });
	});

	it('does not publish a new state for an unchanged workspace size', () => {
		const store = createWindowManagerTestStore();
		const before = store.getState();
		store.getState().actions.setWorkspaceSize({ width: 800, height: 600 });
		expect(store.getState()).toBe(before);
	});

	it('centers, moves, and resizes normal windows', () => {
		const store = createWindowManagerTestStore();
		const id = store.getState().actions.open({ title: 'Tool', bounds: { width: 300, height: 200 } });
		store.getState().actions.center(id);
		expect(store.getState().windows[id].bounds).toEqual({ x: 250, y: 175, width: 300, height: 200 });
		store.getState().actions.moveBy(id, { x: 20, y: -25 });
		store.getState().actions.resizeBy(id, { width: 40, height: 30 });
		expect(store.getState().windows[id].bounds).toEqual({ x: 270, y: 150, width: 340, height: 230 });
	});
});
