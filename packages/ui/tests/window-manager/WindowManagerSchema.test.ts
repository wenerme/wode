import { expect, test } from 'vitest';
import { createWindowManagerSnapshot } from '../../src/components/window-manager/WindowManagerPersistence';
import { createWindowManagerStore, isWindowManagerSnapshot } from '../../src/components/window-manager/WindowManagerStore';

test('snapshot schema preserves serializable data and rejects invalid window id sets', () => {
	const store = createWindowManagerStore({ idFactory: () => 'window-1' });
	store.getState().actions.open({ title: 'Persistent window', data: { filter: 'active' } });
	const snapshot = createWindowManagerSnapshot(store.getState(), { serializeData: (win) => win.data });

	expect(isWindowManagerSnapshot(snapshot)).toBe(true);
	expect(snapshot.windows[0]?.data).toEqual({ filter: 'active' });
	expect(isWindowManagerSnapshot({ ...snapshot, order: [] })).toBe(false);
	expect(isWindowManagerSnapshot({ ...snapshot, dockOrder: ['missing'] })).toBe(false);
});
