import { describe, expect, it, vi } from 'vite-plus/test';
import { createWindowManagerSnapshot } from './window-manager-persistence';
import { createWindowManagerStore, getWindowManagerInvariantErrors } from './window-manager-store';
import { createWindowManagerTestStore } from './window-manager-store.test-support';

describe('window manager lifecycle', () => {
	it('opens, cascades, focuses, and deduplicates keyed windows', () => {
		const store = createWindowManagerTestStore();
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
		const store = createWindowManagerTestStore();
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
		const store = createWindowManagerTestStore();
		const id = store.getState().actions.open({ title: 'Center me', bounds: { x: 0, y: 0, width: 300, height: 200 } });
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
		const store = createWindowManagerTestStore();
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
		const store = createWindowManagerTestStore();
		const id = store.getState().actions.open({ key: 'protected', title: 'Protected', capabilities: { close: false } });
		const replacement = store.getState().actions.open({ key: 'protected', title: 'Replacement', duplicate: 'replace' });

		expect(replacement).toBe(id);
		expect(store.getState().windows[id].title).toBe('Protected');
		expect(store.getState().order).toEqual([id]);
	});

	it('does not partially close keyed windows when replacement is blocked', () => {
		const store = createWindowManagerTestStore();
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
		const source = createWindowManagerTestStore();
		const prototypeId = source.getState().actions.open({ id: '__proto__', title: 'Prototype', duplicate: 'allow' });
		const constructorId = source
			.getState()
			.actions.open({ id: 'constructor', title: 'Constructor', duplicate: 'allow' });
		expect(prototypeId).toBe('__proto__');
		expect(constructorId).toBe('constructor');
		expect(Object.getPrototypeOf(source.getState().windows)).toBeNull();

		const target = createWindowManagerTestStore();
		expect(target.getState().actions.hydrateLayout(createWindowManagerSnapshot(source.getState()))).toBe(true);
		expect(Object.getPrototypeOf(target.getState().windows)).toBeNull();
		expect(Reflect.get(target.getState().windows, '__proto__')).toMatchObject({ title: 'Prototype' });
		expect(Reflect.get(target.getState().windows, 'constructor')).toMatchObject({ title: 'Constructor' });
		expect(getWindowManagerInvariantErrors(target.getState())).toEqual([]);
	});

	it('closes the active window and activates the next visible top window', () => {
		const store = createWindowManagerTestStore();
		const first = store.getState().actions.open({ title: 'First' });
		const second = store.getState().actions.open({ title: 'Second' });
		store.getState().actions.minimize(first);
		expect(store.getState().actions.close(second, { accepted: true })).toBe(true);
		expect(store.getState().activeId).toBeUndefined();
		expect(store.getState().windows[first].mode).toBe('minimized');
	});

	it('honors all capability gates', () => {
		const store = createWindowManagerTestStore();
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

describe('window manager workspace actions', () => {
	it('cycles focus in both directions and skips minimized windows', () => {
		const store = createWindowManagerTestStore();
		const first = store.getState().actions.open({ title: 'First' });
		const second = store.getState().actions.open({ title: 'Second' });
		const third = store.getState().actions.open({ title: 'Third' });
		store.getState().actions.minimize(second);
		store.getState().actions.focus(first);
		expect(store.getState().actions.cycleFocus(1)).toBe(third);
		expect(store.getState().actions.cycleFocus(-1)).toBe(first);
	});

	it('uses task-style toggle semantics', () => {
		const store = createWindowManagerTestStore();
		const id = store.getState().actions.toggle({ key: 'terminal', title: 'Terminal' });
		expect(store.getState().windows[id].mode).toBe('normal');
		store.getState().actions.toggle({ key: 'terminal', title: 'Terminal' });
		expect(store.getState().windows[id].mode).toBe('minimized');
		store.getState().actions.toggle({ key: 'terminal', title: 'Terminal' });
		expect(store.getState().windows[id].mode).toBe('normal');
	});

	it('minimizes and closes all eligible windows while preserving protected windows', () => {
		const store = createWindowManagerTestStore();
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
		const store = createWindowManagerTestStore();
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
		const store = createWindowManagerStore({ initialWindows: [{ title: 'Initial' }], actions: { closeAll } });
		expect(store.getState().order).toHaveLength(1);
		store.getState().actions.closeAll();
		expect(closeAll).toHaveBeenCalledOnce();
	});
});
