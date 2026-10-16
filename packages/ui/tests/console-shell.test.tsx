// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	ConsoleMainHeader,
	ConsoleMainLayout,
	ConsoleModuleLayout,
	ConsoleModuleLink,
	ConsoleModuleTitle,
	type ConsoleNavigationLinkComponent,
	ConsoleNavigationModule,
	ConsoleNavigationRail,
	ConsoleShellLayout,
} from '../src/components/console-shell';

const brand = { label: '文档空间', icon: <span aria-hidden>D</span> };
const items = [
	{ title: '工作区' },
	{ href: '/documents', label: '文档', active: true, badge: '3', icon: <span aria-hidden>D</span> },
];

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	window.localStorage.clear();
});

describe('控制台布局和导航', () => {
	it('SSR 组合实际布局并透传宿主 Link、引用、激活状态与点击事件', () => {
		const linkRef = { current: null as HTMLAnchorElement | null };
		const clicked = vi.fn();
		const Link: ConsoleNavigationLinkComponent = (props) => <a data-host-link {...props} />;
		const content = (
			<ConsoleShellLayout>
				<ConsoleModuleLayout brand={brand}>
					<ConsoleModuleTitle>工作区</ConsoleModuleTitle>
					<ConsoleModuleLink
						href='/documents'
						label='文档'
						active
						ref={linkRef}
						linkComponent={Link}
						onClick={(event) => {
							event.preventDefault();
							clicked();
						}}
					/>
				</ConsoleModuleLayout>
				<ConsoleMainLayout header={<ConsoleMainHeader title='文档列表' />}>
					<input aria-label='搜索' />
				</ConsoleMainLayout>
			</ConsoleShellLayout>
		);
		const markup = renderToString(content);
		expect(markup).toContain('data-slot="console-main-content"');
		expect(markup).toContain('aria-current="page"');
		const view = render(content);
		const link = view.getByRole('link', { name: '文档' });
		expect(linkRef.current).toBe(link);
		expect(link.getAttribute('href')).toBe('/documents');
		expect(link.hasAttribute('data-host-link')).toBe(true);
		fireEvent.click(link);
		expect(clicked).toHaveBeenCalledOnce();
	});

	it('直接使用 ModuleLayout 时受控点击仅请求变更，宿主更新后才折叠', () => {
		const changed = vi.fn();
		const view = render(<ConsoleModuleLayout brand={brand} collapsed={false} onCollapsedChange={changed} />);
		fireEvent.click(view.getByRole('button', { name: '收起模块导航' }));
		expect(changed).toHaveBeenCalledWith(true);
		expect(view.getByRole('button').getAttribute('aria-expanded')).toBe('true');
		view.rerender(<ConsoleModuleLayout brand={brand} collapsed onCollapsedChange={changed} />);
		expect(view.getByRole('button', { name: '展开模块导航' }).getAttribute('aria-expanded')).toBe('false');
	});

	it('非受控初始折叠及双向切换会通知宿主，并隐藏分组标题和徽章', () => {
		const changed = vi.fn();
		const view = render(
			<ConsoleModuleLayout brand={brand} defaultCollapsed onCollapsedChange={changed}>
				<ConsoleModuleTitle>工作区</ConsoleModuleTitle>
				<ConsoleModuleLink href='/documents' label='文档' badge='3' icon={<span>D</span>} />
			</ConsoleModuleLayout>,
		);
		expect(view.queryByText('工作区')).toBeNull();
		expect(view.queryByText('3')).toBeNull();
		expect(view.getByRole('link', { name: '文档' }).hasAttribute('data-tip')).toBe(false);
		fireEvent.click(view.getByRole('button', { name: '展开模块导航' }));
		expect(changed).toHaveBeenLastCalledWith(false);
		expect(view.getByText('工作区')).toBeTruthy();
		expect(view.getByText('3')).toBeTruthy();
		fireEvent.click(view.getByRole('button', { name: '收起模块导航' }));
		expect(changed).toHaveBeenLastCalledWith(true);
		expect(view.queryByText('工作区')).toBeNull();
	});

	it('Rail 的顶部、主要和底部导航保留顺序并使用注入 Link', () => {
		const Link: ConsoleNavigationLinkComponent = (props) => <a data-host-link {...props} />;
		const item = (id: string) => ({ id, href: `/${id}`, label: id, icon: <span>{id[0]}</span> });
		const view = render(
			<ConsoleNavigationRail
				brand={<span>品牌</span>}
				top={[item('home')]}
				items={[{ ...item('documents'), active: true }]}
				bottom={[item('settings')]}
				linkComponent={Link}
			/>,
		);
		expect(view.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
			'/home',
			'/documents',
			'/settings',
		]);
		expect(view.container.querySelectorAll('a[data-host-link]')).toHaveLength(3);
		expect(view.getByRole('link', { name: 'documents' }).getAttribute('aria-current')).toBe('page');
	});

	it('切换 storageKey 后恢复各自偏好，不把上一模块状态写入新模块', () => {
		localStorage.setItem('a', 'true');
		localStorage.setItem('b', 'false');
		const view = render(<ConsoleNavigationModule brand={brand} items={items} storageKey='a' />);
		expect(view.getByRole('button', { name: '展开模块导航' })).toBeTruthy();
		view.rerender(<ConsoleNavigationModule brand={brand} items={items} storageKey='b' />);
		fireEvent.click(view.getByRole('button', { name: '收起模块导航' }));
		expect(localStorage.getItem('b')).toBe('true');
		view.rerender(<ConsoleNavigationModule brand={brand} items={items} storageKey='a' />);
		fireEvent.click(view.getByRole('button', { name: '展开模块导航' }));
		expect(localStorage.getItem('a')).toBe('false');
		expect(localStorage.getItem('b')).toBe('true');
		view.rerender(<ConsoleNavigationModule brand={brand} items={items} storageKey='new' />);
		expect(view.getByRole('button', { name: '收起模块导航' })).toBeTruthy();
		expect(localStorage.getItem('new')).toBeNull();
	});

	it('受控导航只在宿主接受变更后写入存储', () => {
		const changed = vi.fn();
		const view = render(
			<ConsoleNavigationModule
				brand={brand}
				items={items}
				storageKey='controlled'
				collapsed={false}
				onCollapsedChange={changed}
			/>,
		);
		fireEvent.click(view.getByRole('button', { name: '收起模块导航' }));
		expect(changed).toHaveBeenCalledWith(true);
		expect(localStorage.getItem('controlled')).toBe('false');
		view.rerender(
			<ConsoleNavigationModule
				brand={brand}
				items={items}
				storageKey='controlled'
				collapsed
				onCollapsedChange={changed}
			/>,
		);
		expect(localStorage.getItem('controlled')).toBe('true');
	});

	it('存储访问被禁止仍可折叠和展开', () => {
		vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
			throw new DOMException('Blocked', 'SecurityError');
		});
		const view = render(<ConsoleNavigationModule brand={brand} items={items} storageKey='blocked' />);
		fireEvent.click(view.getByRole('button', { name: '收起模块导航' }));
		fireEvent.click(view.getByRole('button', { name: '展开模块导航' }));
		expect(view.getByText('工作区')).toBeTruthy();
	});

	it('SSR hydration 首先匹配默认状态，挂载后再恢复持久化偏好', async () => {
		localStorage.setItem('hydration', 'true');
		const content = <ConsoleNavigationModule brand={brand} items={items} storageKey='hydration' />;
		const container = document.createElement('div');
		container.innerHTML = renderToString(content);
		expect(within(container).getByRole('button').getAttribute('aria-expanded')).toBe('true');
		document.body.append(container);
		const onRecoverableError = vi.fn();
		const root = hydrateRoot(container, content, { onRecoverableError });
		try {
			await act(async () => {});
			expect(onRecoverableError).not.toHaveBeenCalled();
			expect(within(container).getByRole('button').getAttribute('aria-expanded')).toBe('false');
		} finally {
			await act(async () => root.unmount());
			container.remove();
		}
	});
});
