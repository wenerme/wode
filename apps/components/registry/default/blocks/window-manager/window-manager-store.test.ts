import { describe, expect, it, vi } from 'vite-plus/test';
import { createWindowManagerSnapshot } from './window-manager-persistence';
import {
	createWindowManagerStore,
	getWindowManagerAvailableBounds,
	getWindowManagerInvariantErrors,
	getWindowManagerRenderBounds,
	isWindowManagerSnapshot,
} from './window-manager-store';

function createTestStore() {
	let id = 0;
	return createWindowManagerStore({
		idFactory: () => `w${++id}`,
		workspace: { width: 800, height: 600, dock: { visible: true, position: 'bottom', size: 50 } },
	});
}

describe('window manager lifecycle', () => {
	it('opens, cascades, focuses, and deduplicates keyed windows', () => {
		const store = createTestStore();
		const first = store.getState().actions.open({ key: 'users', title: 'Users' });
		const second = store.getState().actions.open({ title: 'Logs' });
		const duplicate = store.getState().actions.open({ key: 'users', title: 'Ignored title' });

		expect(first).toBe('w1');
		expect(second).toBe('w2');
		expect(duplicate).toBe(first);
		expect(store.getState().order).toEqual([second, first]);
		expect(store.getState().dockOrder).toEqual([first, second]);
		expect(store.getState().activeId).toBe(first);
		expect(store.getState().windows[second].bounds.x).toBeGreaterThan(store.getState().windows[first].bounds.x);
		expect(Object.keys(store.getState().windows)).toHaveLength(2);
	});

	it('keeps dock order stable while focus and z-order change', () => {
		const store = createTestStore();
		const first = store.getState().actions.open({ title: 'First' });
		const second = store.getState().actions.open({ title: 'Second' });
		const third = store.getState().actions.open({ title: 'Third' });

		expect(store.getState().dockOrder).toEqual([first, second, third]);
		store.getState().actions.focus(first);
		expect(store.getState().order).toEqual([second, third, first]);
		expect(store.getState().dockOrder).toEqual([first, second, third]);

		store.getState().actions.minimize(second);
		store.getState().actions.restore(second);
		expect(store.getState().order).toEqual([third, first, second]);
		expect(store.getState().dockOrder).toEqual([first, second, third]);

		store.getState().actions.close(first);
		expect(store.getState().dockOrder).toEqual([second, third]);
		expect(getWindowManagerInvariantErrors(store.getState())).toEqual([]);
	});

	it('notifies subscribers immediately when programmatic center changes bounds', () => {
		const store = createTestStore();
		const id = store.getState().actions.open({
			title: 'Center me',
			bounds: { x: 0, y: 0, width: 300, height: 200 },
		});
		const before = store.getState();
		const beforeBounds = { ...before.windows[id].bounds };
		let notifications = 0;
		const unsubscribe = store.subscribe(() => {
			notifications += 1;
		});

		expect(store.getState().actions.center(id)).toBe(true);
		unsubscribe();
		const after = store.getState();
		expect(notifications).toBe(1);
		expect(after).not.toBe(before);
		expect(after.windows).not.toBe(before.windows);
		expect(after.windows[id]).not.toBe(before.windows[id]);
		expect(after.windows[id].bounds).not.toBe(before.windows[id].bounds);
		expect(before.windows[id].bounds).toEqual(beforeBounds);
		expect(after.windows[id].bounds).toEqual({ x: 250, y: 175, width: 300, height: 200 });
		expect(Object.getPrototypeOf(after.windows)).toBeNull();
	});

	it('keeps pinned windows above normal windows while preserving focus within each layer', () => {
		const store = createTestStore();
		const first = store.getState().actions.open({ title: 'First' });
		const pinned = store.getState().actions.open({ title: 'Pinned', pinned: true });
		const third = store.getState().actions.open({ title: 'Third' });

		expect(store.getState().order).toEqual([first, third, pinned]);
		store.getState().actions.focus(first);
		expect(store.getState().order).toEqual([third, first, pinned]);
		expect(store.getState().activeId).toBe(first);

		const fourth = store.getState().actions.open({ title: 'Fourth' });
		expect(store.getState().order).toEqual([third, first, fourth, pinned]);
		store.getState().actions.setPinned(first, true);
		expect(store.getState().order).toEqual([third, fourth, pinned, first]);
		store.getState().actions.focus(pinned);
		expect(store.getState().order).toEqual([third, fourth, first, pinned]);

		store.getState().actions.togglePinned(first);
		expect(store.getState().order).toEqual([third, fourth, first, pinned]);
		expect(store.getState().windows[first].pinned).toBe(false);
		expect(getWindowManagerInvariantErrors(store.getState())).toEqual([]);
	});

	it('supports allow and replace duplicate policies without looping on colliding ids', () => {
		const store = createWindowManagerStore({ idFactory: () => 'same' });
		const first = store.getState().actions.open({ key: 'same-key', title: 'First' });
		const second = store.getState().actions.open({ key: 'same-key', title: 'Second', duplicate: 'allow' });
		const replacement = store.getState().actions.open({ key: 'same-key', title: 'Replacement', duplicate: 'replace' });

		expect(first).toBe('same');
		expect(second).toBe('same-1');
		expect(replacement).toBe('same');
		expect(store.getState().windows[second]).toBeUndefined();
		expect(store.getState().windows[replacement].title).toBe('Replacement');
		expect(store.getState().order).toEqual([replacement]);
	});

	it('keeps a non-closable keyed window when replace is requested', () => {
		const store = createTestStore();
		const id = store.getState().actions.open({
			key: 'protected',
			title: 'Protected',
			capabilities: { close: false },
		});
		const replacement = store.getState().actions.open({ key: 'protected', title: 'Replacement', duplicate: 'replace' });

		expect(replacement).toBe(id);
		expect(store.getState().windows[id].title).toBe('Protected');
		expect(store.getState().order).toEqual([id]);
	});

	it('does not partially close keyed windows when replacement is blocked', () => {
		const store = createTestStore();
		const first = store.getState().actions.open({ key: 'mixed', title: 'First', duplicate: 'allow' });
		const protectedId = store.getState().actions.open({
			key: 'mixed',
			title: 'Protected',
			duplicate: 'allow',
			capabilities: { close: false },
		});
		const third = store.getState().actions.open({ key: 'mixed', title: 'Third', duplicate: 'allow' });

		const replacement = store.getState().actions.open({ key: 'mixed', title: 'Replacement', duplicate: 'replace' });
		expect(replacement).toBe(protectedId);
		expect(Object.keys(store.getState().windows)).toEqual(expect.arrayContaining([first, protectedId, third]));
		expect(Object.keys(store.getState().windows)).toHaveLength(3);
		expect(store.getState().activeId).toBe(protectedId);
	});

	it('supports prototype-like ids without corrupting normalized records', () => {
		const source = createTestStore();
		const prototypeId = source.getState().actions.open({ id: '__proto__', title: 'Prototype', duplicate: 'allow' });
		const constructorId = source
			.getState()
			.actions.open({ id: 'constructor', title: 'Constructor', duplicate: 'allow' });
		expect(prototypeId).toBe('__proto__');
		expect(constructorId).toBe('constructor');
		expect(Object.getPrototypeOf(source.getState().windows)).toBeNull();

		const target = createTestStore();
		expect(target.getState().actions.hydrateLayout(createWindowManagerSnapshot(source.getState()))).toBe(true);
		expect(Object.getPrototypeOf(target.getState().windows)).toBeNull();
		expect(Reflect.get(target.getState().windows, '__proto__')).toMatchObject({ title: 'Prototype' });
		expect(Reflect.get(target.getState().windows, 'constructor')).toMatchObject({ title: 'Constructor' });
		expect(getWindowManagerInvariantErrors(target.getState())).toEqual([]);
	});

	it('closes the active window and activates the next visible top window', () => {
		const store = createTestStore();
		const first = store.getState().actions.open({ title: 'First' });
		const second = store.getState().actions.open({ title: 'Second' });
		store.getState().actions.minimize(first);

		expect(store.getState().actions.close(second, { accepted: true })).toBe(true);
		expect(store.getState().activeId).toBeUndefined();
		expect(store.getState().windows[first].mode).toBe('minimized');
	});

	it('honors all capability gates', () => {
		const store = createTestStore();
		const id = store.getState().actions.open({
			title: 'Locked',
			capabilities: { close: false, fullscreen: false, maximize: false, minimize: false, move: false, resize: false },
		});
		const original = store.getState().windows[id].bounds;

		expect(store.getState().actions.close(id)).toBe(false);
		expect(store.getState().actions.minimize(id)).toBe(false);
		expect(store.getState().actions.maximize(id)).toBe(false);
		expect(store.getState().actions.fullscreen(id)).toBe(false);
		expect(store.getState().actions.moveBy(id, { x: 10, y: 10 })).toBe(false);
		expect(store.getState().actions.resizeBy(id, { width: 10, height: 10 })).toBe(false);
		expect(store.getState().windows[id].bounds).toEqual(original);
	});
});

describe('window manager modes and geometry', () => {
	it('preserves the complete maximize, fullscreen, minimize, and restore chain', () => {
		const store = createTestStore();
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
		const store = createTestStore();
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
		const store = createTestStore();
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
		const store = createTestStore();
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
		const store = createTestStore();
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
		const store = createTestStore();
		const first = store.getState().actions.open({ title: 'First' });
		store.getState().actions.maximize(first);
		store.getState().actions.minimize(first);
		expect(store.getState().activeId).toBeUndefined();

		store.getState().actions.focus(first);
		expect(store.getState().windows[first].mode).toBe('maximized');
		expect(store.getState().activeId).toBe(first);
	});

	it('clamps oversized, off-screen, and non-finite bounds into the available workspace', () => {
		const store = createTestStore();
		const id = store.getState().actions.open({
			title: 'Large',
			bounds: { x: -500, y: Number.NaN, width: 5000, height: 5000 },
		});

		expect(store.getState().windows[id].bounds).toEqual({ x: 0, y: 0, width: 800, height: 550 });
		store.getState().actions.setBounds(id, { x: 9999, y: 9999, width: 300, height: 200 }, 'resize');
		expect(store.getState().windows[id].bounds).toEqual({ x: 500, y: 350, width: 300, height: 200 });
	});

	it('reconciles windows after workspace and dock changes', () => {
		const store = createTestStore();
		const id = store
			.getState()
			.actions.open({ title: 'Inspector', bounds: { x: 400, y: 300, width: 400, height: 250 } });
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
		const store = createTestStore();
		const before = store.getState();
		store.getState().actions.setWorkspaceSize({ width: 800, height: 600 });
		expect(store.getState()).toBe(before);
	});

	it('centers, moves, and resizes normal windows', () => {
		const store = createTestStore();
		const id = store.getState().actions.open({ title: 'Tool', bounds: { width: 300, height: 200 } });
		store.getState().actions.center(id);
		expect(store.getState().windows[id].bounds).toEqual({ x: 250, y: 175, width: 300, height: 200 });
		store.getState().actions.moveBy(id, { x: 20, y: -25 });
		store.getState().actions.resizeBy(id, { width: 40, height: 30 });
		expect(store.getState().windows[id].bounds).toEqual({ x: 270, y: 150, width: 340, height: 230 });
	});
});

describe('window manager workspace actions', () => {
	it('cycles focus in both directions and skips minimized windows', () => {
		const store = createTestStore();
		const first = store.getState().actions.open({ title: 'First' });
		const second = store.getState().actions.open({ title: 'Second' });
		const third = store.getState().actions.open({ title: 'Third' });
		store.getState().actions.minimize(second);
		store.getState().actions.focus(first);

		expect(store.getState().actions.cycleFocus(1)).toBe(third);
		expect(store.getState().actions.cycleFocus(-1)).toBe(first);
	});

	it('uses task-style toggle semantics', () => {
		const store = createTestStore();
		const id = store.getState().actions.toggle({ key: 'terminal', title: 'Terminal' });
		expect(store.getState().windows[id].mode).toBe('normal');
		store.getState().actions.toggle({ key: 'terminal', title: 'Terminal' });
		expect(store.getState().windows[id].mode).toBe('minimized');
		store.getState().actions.toggle({ key: 'terminal', title: 'Terminal' });
		expect(store.getState().windows[id].mode).toBe('normal');
	});

	it('minimizes and closes all eligible windows while preserving protected windows', () => {
		const store = createTestStore();
		const normal = store.getState().actions.open({ title: 'Normal' });
		const protectedId = store.getState().actions.open({
			title: 'Protected',
			capabilities: { close: false, minimize: false },
		});
		store.getState().actions.minimizeAll();
		expect(store.getState().windows[normal].mode).toBe('minimized');
		expect(store.getState().windows[protectedId].mode).toBe('normal');
		store.getState().actions.closeAll();
		expect(Object.keys(store.getState().windows)).toEqual([protectedId]);
	});

	it('updates serializable metadata without mutating unrelated fields', () => {
		const store = createTestStore();
		const id = store.getState().actions.open({ title: 'Before', data: { count: 1 } });
		const bounds = store.getState().windows[id].bounds;
		store.getState().actions.update(id, {
			title: 'After',
			icon: 'A',
			data: { count: 2 },
			capabilities: { resize: false },
		});
		expect(store.getState().windows[id]).toMatchObject({
			title: 'After',
			icon: 'A',
			data: { count: 2 },
			capabilities: { resize: false },
			bounds,
		});
	});

	it('supports initial windows and action overrides', () => {
		const closeAll = vi.fn();
		const store = createWindowManagerStore({
			initialWindows: [{ title: 'Initial' }],
			actions: { closeAll },
		});
		expect(store.getState().order).toHaveLength(1);
		store.getState().actions.closeAll();
		expect(closeAll).toHaveBeenCalledOnce();
	});
});

describe('window manager events and persistence', () => {
	it('emits lifecycle events and allows listener cleanup', () => {
		const events: string[] = [];
		const store = createTestStore();
		const unsubscribe = store.subscribeEvents((event) => events.push(event.type));
		const id = store.getState().actions.open({ title: 'Events' });
		store.getState().actions.maximize(id);
		store.getState().actions.togglePinned(id);
		store.getState().actions.minimize(id);
		store.getState().actions.restore(id);
		store.getState().actions.close(id);
		unsubscribe();
		store.getState().actions.open({ title: 'Ignored' });

		expect(events).toEqual(['opened', 'maximized', 'pinned', 'minimized', 'restored', 'closed']);
	});

	it('creates versioned snapshots without data by default and excludes ephemeral windows', () => {
		const store = createTestStore();
		const persistent = store.getState().actions.open({ title: 'Persistent', data: { secret: 'hidden', value: 7 } });
		store.getState().actions.open({ title: 'Ephemeral', persistence: 'none' });
		const plain = createWindowManagerSnapshot(store.getState(), { now: () => 42 });
		const withData = createWindowManagerSnapshot(store.getState(), {
			now: () => 43,
			serializeData: (win) => ({ value: (win.data as { value?: number })?.value }),
		});

		expect(plain.savedAt).toBe(42);
		expect(plain.order).toEqual([persistent]);
		expect(plain.dockOrder).toEqual([persistent]);
		expect(plain.windows[0].data).toBeUndefined();
		expect(withData.windows[0].data).toEqual({ value: 7 });
		expect(isWindowManagerSnapshot(plain)).toBe(true);
	});

	it('hydrates order, dock, data, and minimized policy through validation', () => {
		const source = createTestStore();
		const first = source.getState().actions.open({ title: 'First', data: { page: 2 } });
		const second = source.getState().actions.open({ title: 'Second' });
		source.getState().actions.minimize(second);
		source.getState().actions.focus(first);
		source.getState().actions.setPinned(first, true);
		expect(source.getState().order).toEqual([second, first]);
		expect(source.getState().dockOrder).toEqual([first, second]);
		source.getState().actions.setDock({ position: 'right', size: 72 });
		const snapshot = createWindowManagerSnapshot(source.getState(), { serializeData: (win) => win.data });
		const target = createTestStore();

		expect(target.getState().actions.hydrateLayout(snapshot, { restoreMinimized: false })).toBe(true);
		expect(target.getState().order).toEqual([second, first]);
		expect(target.getState().dockOrder).toEqual([first, second]);
		expect(target.getState().workspace.dock).toEqual({ visible: true, position: 'right', size: 72 });
		expect(target.getState().windows[first].data).toEqual({ page: 2 });
		expect(target.getState().windows[first].pinned).toBe(true);
		expect(target.getState().windows[second].mode).toBe('normal');
		expect(target.getState().hydration.status).toBe('ready');
	});

	it('rejects corrupt or unsupported snapshots without changing state', () => {
		const store = createTestStore();
		const id = store.getState().actions.open({ title: 'Keep' });
		const valid = createWindowManagerSnapshot(store.getState());
		const legacy = structuredClone(valid);
		delete legacy.dockOrder;
		for (const win of legacy.windows) delete win.pinned;
		const corrupt = structuredClone(valid) as unknown as { windows: Array<{ bounds: { width: number } }> };
		corrupt.windows[0].bounds.width = Number.NaN;

		expect(isWindowManagerSnapshot({ ...valid, version: 99 })).toBe(false);
		expect(isWindowManagerSnapshot(legacy)).toBe(true);
		expect(
			isWindowManagerSnapshot({ ...valid, windows: valid.windows.map((win) => ({ ...win, pinned: 'yes' })) }),
		).toBe(false);
		expect(isWindowManagerSnapshot(corrupt)).toBe(false);
		expect(store.getState().actions.hydrateLayout(corrupt as never)).toBe(false);
		expect(store.getState().order).toEqual([id]);
	});

	it('preserves invariants across a long mixed action sequence', () => {
		const store = createTestStore();
		for (let index = 0; index < 120; index += 1) {
			if (index % 6 === 0 || store.getState().order.length === 0) {
				store.getState().actions.open({ title: `Window ${index}`, duplicate: 'allow' });
			} else {
				const ids = store.getState().order;
				const id = ids[index % ids.length];
				const operation = index % 9;
				if (operation === 0) store.getState().actions.focus(id);
				if (operation === 1) store.getState().actions.minimize(id);
				if (operation === 2) store.getState().actions.restore(id);
				if (operation === 3) store.getState().actions.maximize(id);
				if (operation === 4) store.getState().actions.fullscreen(id);
				if (operation === 5) store.getState().actions.moveBy(id, { x: 17, y: -13 });
				if (operation === 6) store.getState().actions.resizeBy(id, { width: -31, height: 19 });
				if (operation === 7) store.getState().actions.close(id);
				if (operation === 8) store.getState().actions.togglePinned(id);
			}
			store.getState().actions.setWorkspaceSize({ width: 280 + (index % 5) * 130, height: 220 + (index % 4) * 100 });
			expect(getWindowManagerInvariantErrors(store.getState())).toEqual([]);
		}
	});
});
