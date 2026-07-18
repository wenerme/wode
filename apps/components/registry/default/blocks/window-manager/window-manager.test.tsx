import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { WindowManagerControls, WindowManagerFrame, WindowManagerTitleBar } from './window-manager-chrome';
import { useWindowManager, WindowManagerProvider } from './window-manager-context';
import { WindowManagerDock } from './window-manager-dock';
import { WindowManagerHost, WindowManagerPortalHost } from './window-manager-host';
import { createWindowManagerStore } from './window-manager-store';

function createStore() {
	let id = 0;
	return createWindowManagerStore({
		idFactory: () => `test-${++id}`,
		workspace: { width: 960, height: 640, dock: { size: 48 } },
		initialWindows: [
			{ key: 'users', kind: 'table', title: 'User directory', icon: 'U', bounds: { x: 40, y: 32 } },
			{ key: 'logs', kind: 'logs', title: 'Audit logs', icon: 'L', bounds: { x: 280, y: 120 } },
		],
	});
}

describe('window manager rendering', () => {
	it('renders managed windows, chrome, content, and dock from one scoped store', () => {
		const store = createStore();
		const markup = renderToStaticMarkup(
			<WindowManagerProvider store={store}>
				<WindowManagerHost
					renderContent={(win) => <div>{win.kind} content</div>}
					renderToolbar={(win) => <button type='button'>{win.title} action</button>}
					renderStatusBar={(win) => <span>{win.mode}</span>}
				/>
			</WindowManagerProvider>,
		);

		expect(markup).toContain('data-window-manager-host="true"');
		expect(markup).toContain('role="dialog"');
		expect(markup).toContain('User directory');
		expect(markup).toContain('table content');
		expect(markup).toContain('Audit logs action');
		expect(markup).toContain('aria-label="窗口停靠栏"');
		expect(markup).toContain('aria-label="窗口管理"');
		expect(markup).not.toContain('aria-label="显示桌面"');
		expect(markup).not.toContain('aria-label="关闭全部窗口"');
		expect(markup).toContain('aria-label="窗口菜单"');
		expect(markup.indexOf('aria-label="窗口菜单"')).toBeLessThan(markup.indexOf('aria-label="最小化"'));
		expect(markup).toContain('aria-label="最大化"');
		expect(markup).toContain('aria-label="工作区全屏"');
		expect(markup).toContain('aria-label="关闭"');
	});

	it('keeps minimized content mounted by default and marks its surface inert', () => {
		const store = createWindowManagerStore({
			initialWindows: [{ id: 'minimized', title: 'Minimized', mode: 'minimized' }],
		});
		const id = store.getState().order[0];
		const markup = renderToStaticMarkup(
			<WindowManagerProvider store={store}>
				<WindowManagerHost renderContent={(win) => <div>mounted {win.id}</div>} />
			</WindowManagerProvider>,
		);

		expect(markup).toContain(`mounted ${id}`);
		expect(markup).toContain('inert=""');
		expect(markup).toContain('data-window-mode="minimized"');
		expect(markup).toContain('display:none');
	});

	it('supports frameless windows and complete custom frame rendering', () => {
		const store = createWindowManagerStore({
			initialWindows: [{ title: 'Frameless', chrome: 'none', kind: 'canvas' }],
		});
		const frameless = renderToStaticMarkup(
			<WindowManagerProvider store={store}>
				<WindowManagerHost renderContent={() => <canvas>scene</canvas>} dock={false} />
			</WindowManagerProvider>,
		);
		const custom = renderToStaticMarkup(
			<WindowManagerProvider store={store}>
				<WindowManagerHost
					dock={false}
					renderFrame={({ active, content, dragHandleProps, titleId, win }) => (
						<article data-custom-frame data-active={active}>
							<h2 id={titleId} {...dragHandleProps}>
								{win.title}
							</h2>
							{content}
						</article>
					)}
					renderContent={() => 'custom content'}
				/>
			</WindowManagerProvider>,
		);

		expect(frameless).toContain('<canvas>scene</canvas>');
		expect(frameless).toContain('aria-label="Frameless"');
		expect(frameless).toContain('window-manager-drag-handle');
		expect(frameless).not.toContain('aria-label="最大化"');
		expect(custom).toContain('data-custom-frame="true"');
		expect(custom).toContain('data-window-drag-handle="true"');
		expect(custom).toContain('custom content');
	});

	it('does not reserve invisible dock space when dock rendering is disabled', () => {
		const store = createWindowManagerStore({
			workspace: { width: 800, height: 600, dock: { visible: true, size: 50 } },
			initialWindows: [{ title: 'Maximized', mode: 'maximized' }],
		});
		const markup = renderToStaticMarkup(
			<WindowManagerProvider store={store}>
				<WindowManagerHost dock={false} />
			</WindowManagerProvider>,
		);
		expect(markup).toContain('width:800px;height:600px');
		expect(markup).not.toContain('aria-label="窗口停靠栏"');
	});

	it('hides the dock while the active window covers the full workspace', () => {
		const store = createWindowManagerStore({
			initialWindows: [{ title: 'Fullscreen', mode: 'fullscreen' }],
		});
		const markup = renderToStaticMarkup(
			<WindowManagerProvider store={store}>
				<WindowManagerDock />
			</WindowManagerProvider>,
		);
		expect(markup).toBe('');
	});

	it('derives fullscreen layering from the configured z-index base', () => {
		const store = createWindowManagerStore({
			initialWindows: [
				{ id: 'pinned', title: 'Pinned', pinned: true },
				{ id: 'fullscreen', title: 'Fullscreen', mode: 'fullscreen' },
			],
		});
		const markup = renderToStaticMarkup(
			<WindowManagerProvider store={store}>
				<WindowManagerHost dock={false} zIndexBase={12_000} />
			</WindowManagerProvider>,
		);
		expect(markup).toContain('z-index:12000');
		expect(markup).toContain('z-index:12001');
		expect(markup).not.toContain('z-index:10000');
	});

	it('keeps dock items in stable order after focusing a window', () => {
		const store = createStore();
		const [users, logs] = store.getState().dockOrder;
		store.getState().actions.focus(users);
		expect(store.getState().order).toEqual([logs, users]);
		const markup = renderToStaticMarkup(
			<WindowManagerProvider store={store}>
				<WindowManagerDock />
			</WindowManagerProvider>,
		);
		expect(markup.indexOf('User directory')).toBeLessThan(markup.indexOf('Audit logs'));
	});

	it('renders configured signed-in and signed-out Dock user controls', () => {
		const store = createStore();
		const signedIn = renderToStaticMarkup(
			<WindowManagerProvider store={store}>
				<WindowManagerHost dockProps={{ user: { displayName: '林舟', loginName: 'linzhou', hasNotification: true } }} />
			</WindowManagerProvider>,
		);
		const signedOut = renderToStaticMarkup(
			<WindowManagerProvider store={store}>
				<WindowManagerHost dockProps={{ user: { onSignIn: () => undefined } }} />
			</WindowManagerProvider>,
		);
		const initialsOnly = renderToStaticMarkup(
			<WindowManagerProvider store={store}>
				<WindowManagerHost dockProps={{ user: { initials: '👩‍💻' } }} />
			</WindowManagerProvider>,
		);
		const emptyUser = renderToStaticMarkup(
			<WindowManagerProvider store={store}>
				<WindowManagerHost dockProps={{ user: {} }} />
			</WindowManagerProvider>,
		);

		expect(signedIn).toContain('aria-label="账户菜单，有新通知"');
		expect(signedIn).toContain('title="林舟"');
		expect(signedIn).toContain('>林舟<');
		expect(signedOut).toContain('aria-label="登录"');
		expect(signedOut).toContain('title="未登录"');
		expect(initialsOnly).toContain('aria-label="账户菜单"');
		expect(initialsOnly).toContain('👩‍💻');
		expect(emptyUser).not.toContain('aria-label="账户菜单"');
		expect(emptyUser).not.toContain('aria-label="登录"');
	});

	it('renders portal hosts as an SSR-safe empty boundary', () => {
		const store = createStore();
		const markup = renderToStaticMarkup(
			<WindowManagerProvider store={store}>
				<WindowManagerPortalHost />
			</WindowManagerProvider>,
		);
		expect(markup).toBe('');
	});
});

describe('window manager composition and context guards', () => {
	it('exposes composable chrome primitives with fixed accessible controls', () => {
		const markup = renderToStaticMarkup(
			<WindowManagerFrame active mode='maximized'>
				<WindowManagerTitleBar
					title='Composed window'
					controls={<WindowManagerControls mode='maximized' onClose={() => undefined} onMaximize={() => undefined} />}
				/>
			</WindowManagerFrame>,
		);
		expect(markup).toContain('data-mode="maximized"');
		expect(markup).toContain('Composed window');
		expect(markup).toContain('aria-label="还原"');
		expect(markup).toContain('aria-label="关闭"');
		expect(markup).toContain('aria-label="最小化" title="最小化" disabled=""');
	});

	it('fails fast when hooks are used outside a provider', () => {
		function Consumer() {
			useWindowManager((state) => state.order);
			return null;
		}
		expect(() => renderToStaticMarkup(<Consumer />)).toThrow(
			'useWindowManagerApi must be used within WindowManagerProvider',
		);
	});
});
