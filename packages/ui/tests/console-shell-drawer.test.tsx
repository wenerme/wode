// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConsoleModuleNavigationDrawer, type ConsoleNavigationLinkComponent } from '../src/components/console-shell';

const items = [
	{ title: '工作区' },
	{ href: '/documents', label: '文档', active: true },
	{ href: '/settings', label: '设置' },
];
const brand = { label: '文档空间' };

function viewport(initial: boolean) {
	const listeners = new Set<() => void>();
	const query = {
		matches: initial,
		media: '(max-width: 767.98px)',
		addEventListener: (_: string, listener: () => void) => listeners.add(listener),
		removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
	};
	vi.stubGlobal(
		'matchMedia',
		vi.fn(() => query),
	);
	return (narrow: boolean) => {
		query.matches = narrow;
		act(() => {
			for (const listener of listeners) listener();
		});
	};
}
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe('响应式模块抽屉', () => {
	it('窄屏显示当前页面，导航通过注入 Link 完成并关闭抽屉', async () => {
		viewport(true);
		const navigate = vi.fn();
		const Link: ConsoleNavigationLinkComponent = ({ href, onClick, ...props }) => (
			<a
				{...props}
				href={href}
				onClick={(event) => {
					event.preventDefault();
					navigate(href);
					onClick?.(event);
				}}
			/>
		);
		const view = render(<ConsoleModuleNavigationDrawer brand={brand} items={items} linkComponent={Link} />);
		fireEvent.click(view.getByRole('button', { name: '模块导航：文档空间 / 文档' }));
		const dialog = await view.findByRole('dialog', { name: '文档空间' });
		expect(within(dialog).getByRole('link', { name: '文档' }).getAttribute('aria-current')).toBe('page');
		fireEvent.click(within(dialog).getByRole('link', { name: '设置' }));
		expect(navigate).toHaveBeenCalledWith('/settings');
		await waitFor(() => expect(view.queryByRole('dialog')).toBeNull());
	});

	it('关闭按钮和 Escape 均关闭抽屉', async () => {
		viewport(true);
		const view = render(<ConsoleModuleNavigationDrawer brand={brand} items={items} />);
		const trigger = view.getByRole('button', { name: /^模块导航：/ });
		fireEvent.click(trigger);
		fireEvent.click(await view.findByRole('button', { name: '关闭模块导航' }));
		await waitFor(() => expect(view.queryByRole('dialog')).toBeNull());
		fireEvent.click(trigger);
		const dialog = await view.findByRole('dialog');
		fireEvent.keyDown(dialog, { key: 'Escape' });
		await waitFor(() => expect(view.queryByRole('dialog')).toBeNull());
	});

	it('实时响应视口变化，桌面和 SSR 不输出抽屉入口', () => {
		const resize = viewport(false);
		const content = <ConsoleModuleNavigationDrawer brand={brand} items={items} />;
		const view = render(content);
		expect(view.container.innerHTML).toBe('');
		resize(true);
		expect(view.getByRole('button', { name: /^模块导航：/ })).toBeTruthy();
		// 服务端 snapshot 必须与浏览器视口无关。
		expect(renderToString(content)).toBe('');
		resize(false);
		expect(view.container.innerHTML).toBe('');
	});

	it('没有 matchMedia 时仍可安全渲染', () => {
		vi.stubGlobal('matchMedia', undefined);
		const view = render(<ConsoleModuleNavigationDrawer brand={brand} items={items} />);
		expect(view.container.innerHTML).toBe('');
	});
});
