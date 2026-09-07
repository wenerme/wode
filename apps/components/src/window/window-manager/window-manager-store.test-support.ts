import { createWindowManagerStore } from './window-manager-store';

export function createWindowManagerTestStore() {
	let id = 0;
	return createWindowManagerStore({
		idFactory: () => `w${++id}`,
		workspace: { width: 800, height: 600, dock: { visible: true, position: 'bottom', size: 50 } },
	});
}
