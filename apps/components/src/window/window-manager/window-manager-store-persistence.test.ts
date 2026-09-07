import { describe, expect, it } from 'vite-plus/test';
import { createWindowManagerSnapshot } from './window-manager-persistence';
import { getWindowManagerInvariantErrors, isWindowManagerSnapshot } from './window-manager-store';
import { createWindowManagerTestStore } from './window-manager-store.test-support';

describe('window manager events and persistence', () => {
	it('emits lifecycle events and allows listener cleanup', () => {
		const events: string[] = [];
		const store = createWindowManagerTestStore();
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
		const store = createWindowManagerTestStore();
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
		const source = createWindowManagerTestStore();
		const first = source.getState().actions.open({ title: 'First', data: { page: 2 } });
		const second = source.getState().actions.open({ title: 'Second' });
		source.getState().actions.minimize(second);
		source.getState().actions.focus(first);
		source.getState().actions.setPinned(first, true);
		expect(source.getState().order).toEqual([second, first]);
		expect(source.getState().dockOrder).toEqual([first, second]);
		source.getState().actions.setDock({ position: 'right', size: 72 });
		const snapshot = createWindowManagerSnapshot(source.getState(), { serializeData: (win) => win.data });
		const target = createWindowManagerTestStore();
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
		const store = createWindowManagerTestStore();
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
		const store = createWindowManagerTestStore();
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
