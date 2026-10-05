import { expect, test } from 'vitest';
import { createWindowManagerSnapshot } from '../../src/components/window-manager/WindowManagerPersistence';
import { createWindowManagerStore, getWindowManagerInvariantErrors, isWindowManagerSnapshot } from '../../src/components/window-manager/WindowManagerStore';

function createTestStore() {
	let id = 0;
	return createWindowManagerStore({
		idFactory: () => `w${++id}`,
		workspace: { width: 800, height: 600, dock: { visible: true, position: 'bottom', size: 50 } },
	});
}

test('opens windows with cascaded bounds, focus, and stable key deduplication', () => {
	const store = createTestStore();
	const first = store.getState().actions.open({ key: 'documents', title: 'Documents' });
	const second = store.getState().actions.open({ title: 'Logs' });
	const duplicate = store.getState().actions.open({ key: 'documents', title: 'Ignored title' });

	expect(first).toBe('w1');
	expect(second).toBe('w2');
	expect(duplicate).toBe(first);
	expect(store.getState().order).toEqual([second, first]);
	expect(store.getState().dockOrder).toEqual([first, second]);
	expect(store.getState().activeId).toBe(first);
	expect(Object.keys(store.getState().windows)).toHaveLength(2);
});

test('replaces duplicate windows while protecting non closable windows', () => {
	const store = createTestStore();
	const protectedId = store.getState().actions.open({ key: 'shell', title: 'Protected', capabilities: { close: false } });
	store.getState().actions.open({ key: 'shell', title: 'Second', duplicate: 'replace' });
	const replaced = store.getState().actions.open({ key: 'shell', title: 'Third', duplicate: 'replace' });

	expect(replaced).toBe(protectedId);
	expect(Object.keys(store.getState().windows)).toHaveLength(1);
});

test('keeps all windows when duplicate policy allows duplicates', () => {
	const store = createTestStore();
	store.getState().actions.open({ key: 'notes', title: 'First note', duplicate: 'allow' });
	store.getState().actions.open({ key: 'notes', title: 'Second note', duplicate: 'allow' });

	expect(Object.keys(store.getState().windows)).toHaveLength(2);
});

test('keeps dock order stable while focus, minimize, restore, and close update stacking order', () => {
	const store = createTestStore();
	const first = store.getState().actions.open({ title: 'First' });
	const second = store.getState().actions.open({ title: 'Second' });
	const third = store.getState().actions.open({ title: 'Third' });

	expect(store.getState().dockOrder).toEqual([first, second, third]);
	store.getState().actions.focus(first);
	expect(store.getState().order).toEqual([second, third, first]);
	expect(store.getState().actions.minimize(second)).toBe(true);
	store.getState().actions.restore(second);
	expect(store.getState().order).toEqual([third, first, second]);
	store.getState().actions.close(first);
	expect(store.getState().dockOrder).toEqual([second, third]);
	expect(getWindowManagerInvariantErrors(store.getState())).toEqual([]);
});

test('clears activeId when minimizing the active window and restores it on restore', () => {
	const store = createTestStore();
	const id = store.getState().actions.open({ title: 'Only window' });
	store.getState().actions.minimize(id);
	expect(store.getState().activeId).toBeUndefined();
	store.getState().actions.restore(id);
	expect(store.getState().activeId).toBe(id);
});

test('maintains hidden dock entries in the manager state', () => {
	const store = createTestStore();
	const hidden = store.getState().actions.open({ title: 'Hidden from dock', showInDock: false });
	expect(store.getState().windows[hidden]?.showInDock).toBe(false);
	expect(store.getState().dockOrder).toContain(hidden);
});

test('enforces capabilities and only allows one fullscreen window', () => {
	const store = createTestStore();
	const first = store.getState().actions.open({ title: 'First' });
	const second = store.getState().actions.open({ title: 'Second' });

	expect(store.getState().actions.fullscreen(first)).toBe(true);
	expect(store.getState().actions.fullscreen(second)).toBe(true);
	expect(store.getState().windows[first]?.mode).toBe('normal');
	expect(store.getState().windows[second]?.mode).toBe('fullscreen');
	const nonMaximizable = store.getState().actions.open({ title: 'No maximize', capabilities: { maximize: false } });
	expect(store.getState().actions.maximize(nonMaximizable)).toBe(false);
});

test('clamps bounds to the available workspace', () => {
	const store = createTestStore();
	const id = store.getState().actions.open({ title: 'Constrained', bounds: { x: 0, y: 0, width: 300, height: 200 } });
	expect(store.getState().actions.setBounds(id, { x: 10_000, y: 10_000 }, 'move')).toBe(true);
	const bounds = store.getState().windows[id]!.bounds;
	expect(bounds.x + bounds.width).toBeLessThanOrEqual(800);
	expect(bounds.y + bounds.height).toBeLessThanOrEqual(550);
});

test('normalizes invalid size constraints to finite ordered positive values', () => {
	const store = createTestStore();
	const id = store.getState().actions.open({ title: 'Invalid size', size: { minWidth: Number.NaN, minHeight: Number.POSITIVE_INFINITY, maxWidth: 100, maxHeight: Number.NEGATIVE_INFINITY } });
	expect(store.getState().windows[id]?.size).toEqual({ minWidth: 240, minHeight: 160, maxWidth: 240, maxHeight: 160 });
	expect(getWindowManagerInvariantErrors(store.getState())).toEqual([]);
});

test('keeps invariants valid through a long mixed operation sequence', () => {
	const store = createTestStore();
	for (let index = 0; index < 120; index += 1) {
		if (index % 6 === 0 || store.getState().order.length === 0) {
			store.getState().actions.open({ title: `Window ${index}`, duplicate: 'allow' });
		} else {
			const ids = store.getState().order;
			const id = ids[index % ids.length]!;
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

test('restores valid snapshots and rejects corrupt snapshots', () => {
	const store = createTestStore();
	const id = store.getState().actions.open({ title: 'Saved window' });
	const valid = createWindowManagerSnapshot(store.getState());
	expect(isWindowManagerSnapshot(valid)).toBe(true);
	const corrupt = structuredClone(valid) as { windows: Array<{ bounds: { width: number } }> };
	corrupt.windows[0]!.bounds.width = Number.NaN;
	expect(isWindowManagerSnapshot(corrupt)).toBe(false);
	expect(store.getState().actions.hydrateLayout(corrupt as never)).toBe(false);
	expect(store.getState().order).toEqual([id]);
	const restored = createTestStore();
	expect(restored.getState().actions.hydrateLayout(valid)).toBe(true);
	expect(restored.getState().windows[id]?.title).toBe('Saved window');
});
