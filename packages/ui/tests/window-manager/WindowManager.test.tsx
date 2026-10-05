import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { useWindowManager, WindowManagerProvider } from '../../src/components/window-manager/WindowManagerContext';
import { WindowManagerDock } from '../../src/components/window-manager/WindowManagerDock';
import { WindowManagerHost } from '../../src/components/window-manager/WindowManagerHost';
import { createWindowManagerStore } from '../../src/components/window-manager/WindowManagerStore';
import { WindowOptionProvider } from '../../src/components/window-manager/WindowOption';

function createStore() {
	let id = 0;
	return createWindowManagerStore({
		idFactory: () => `test-${++id}`,
		workspace: { width: 960, height: 640, dock: { position: 'right', size: 58 } },
		initialWindows: [
			{ key: 'documents', kind: 'table', title: 'Documents', icon: 'D', bounds: { x: 40, y: 32 } },
			{ key: 'logs', kind: 'logs', title: 'Logs', icon: 'L', bounds: { x: 280, y: 120 } },
		],
	});
}

test('server renders windows, chrome, content, and dock from one store scope', () => {
	const markup = renderToStaticMarkup(
		<WindowManagerProvider store={createStore()}>
			<WindowManagerHost renderContent={(win) => <div>{win.kind} content</div>} />
		</WindowManagerProvider>,
	);
	expect(markup).toContain('data-window-manager-host="true"');
	expect(markup).toContain('role="dialog"');
	expect(markup).toContain('Documents');
	expect(markup).toContain('table content');
	expect(markup).toContain('aria-label="Window dock"');
	expect(markup).toContain('data-position="right"');
	expect(markup).toContain('pointer-events-auto group/window');
});

test('keeps minimized content mounted and marks the surface inert by default', () => {
	const store = createWindowManagerStore({ initialWindows: [{ id: 'minimized', title: 'Minimized', mode: 'minimized' }] });
	const id = store.getState().order[0]!;
	const markup = renderToStaticMarkup(
		<WindowManagerProvider store={store}>
			<WindowManagerHost renderContent={(win) => <div>Mounted {win.id}</div>} />
		</WindowManagerProvider>,
	);
	expect(markup).toContain(`Mounted ${id}`);
	expect(markup).toContain('inert=""');
	expect(markup).toContain('data-window-mode="minimized"');
	expect(markup).toContain('display:none');
});

test('hides dock while a fullscreen window is active', () => {
	const markup = renderToStaticMarkup(
		<WindowManagerProvider store={createWindowManagerStore({ initialWindows: [{ title: 'Fullscreen', mode: 'fullscreen' }] })}>
			<WindowManagerDock />
		</WindowManagerProvider>,
	);
	expect(markup).toBe('');
});

test('keeps dock item order stable after focusing a window', () => {
	const store = createStore();
	const [documents, logs] = store.getState().dockOrder as [string, string];
	store.getState().actions.focus(documents);
	const markup = renderToStaticMarkup(
		<WindowManagerProvider store={store}>
			<WindowManagerDock />
		</WindowManagerProvider>,
	);
	expect(markup.indexOf('Documents')).toBeLessThan(markup.indexOf('Logs'));
	expect(store.getState().order).toEqual([logs, documents]);
});

test('fails immediately when a window hook is used outside its provider', () => {
	function Consumer() {
		useWindowManager((state) => state.order);
		return null;
	}
	expect(() => renderToStaticMarkup(<Consumer />)).toThrow(/useWindowManagerApi must be used within WindowManagerProvider/);
});

test.each(['system', 'natural', 'macos', 'windows'] as const)('supports the %s frame style', (style) => {
	const markup = renderToStaticMarkup(
		<WindowOptionProvider value={{ style }}>
			<WindowManagerProvider store={createStore()}>
				<WindowManagerHost />
			</WindowManagerProvider>
		</WindowOptionProvider>,
	);
	expect(markup).toContain(`data-window-frame-style="${style === 'system' ? 'natural' : style}"`);
	expect(markup).toContain('aria-label="Window menu"');
});
