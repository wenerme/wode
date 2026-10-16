// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataViewLayout } from '../src/components/console-data-view';

let containerWidth = 900;
const observers = new Set<() => void>();

beforeEach(() => {
	containerWidth = 900;
	// JSDOM 没有布局；v4 按元素 offset 排序动态注册的面板，因此提供真实 DOM 顺序。
	for (const axis of ['offsetLeft', 'offsetTop'] as const) {
		vi.spyOn(HTMLElement.prototype, axis, 'get').mockImplementation(function (this: HTMLElement) {
			return this.parentElement ? Array.from(this.parentElement.children).indexOf(this) * 200 : 0;
		});
	}
	vi.stubGlobal(
		'ResizeObserver',
		class {
			private notify: () => void;
			constructor(callback: ResizeObserverCallback) {
				this.notify = () => callback([], this as unknown as ResizeObserver);
			}
			observe() {
				observers.add(this.notify);
			}
			unobserve() {}
			disconnect() {
				observers.delete(this.notify);
			}
		},
	);
	const originalRect = HTMLElement.prototype.getBoundingClientRect;
	vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
		if (this.dataset.slot !== 'data-view-layout') return originalRect.call(this);
		return {
			width: containerWidth,
			height: 800,
			top: 0,
			left: 0,
			right: containerWidth,
			bottom: 800,
			x: 0,
			y: 0,
			toJSON() {},
		};
	});
});
afterEach(() => {
	cleanup();
	observers.clear();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('数据视图布局', () => {
	it('透传 ref，按容器宽度切换方向，并在卸载时清理观察者', () => {
		const ref = { current: null as HTMLElement | null };
		const view = render(
			<DataViewLayout.Root ref={ref} leftPanel={<aside>筛选</aside>} rightPanel={<aside>详情</aside>}>
				内容
			</DataViewLayout.Root>,
		);
		expect(ref.current).toBe(view.container.querySelector('section'));
		const panels = view.container.querySelector('[data-slot="data-view-layout-panels"]');
		expect(panels?.getAttribute('data-layout')).toBe('desktop');
		expect(view.getAllByRole('separator')).toHaveLength(2);
		containerWidth = 420;
		act(() => {
			for (const notify of observers) notify();
		});
		expect(panels?.getAttribute('data-layout')).toBe('mobile');
		expect(view.getByRole('separator', { name: '调整右侧面板大小' }).getAttribute('aria-orientation')).toBe(
			'horizontal',
		);
		view.unmount();
		expect(ref.current).toBeNull();
		expect(observers.size).toBe(0);
	});

	it('左右辅助面板动态增删和响应式切换均保留主内容 DOM 与输入', () => {
		function Example() {
			const [left, setLeft] = useState(false);
			const [right, setRight] = useState(false);
			return (
				<DataViewLayout.Root
					leftPanel={left ? <aside>筛选</aside> : undefined}
					rightPanel={right ? <aside>详情</aside> : undefined}
				>
					<input aria-label='笔记' defaultValue='' />
					<button type='button' onClick={() => setLeft(!left)}>
						筛选开关
					</button>
					<button type='button' onClick={() => setRight(!right)}>
						详情开关
					</button>
				</DataViewLayout.Root>
			);
		}
		const view = render(<Example />);
		const input = view.getByRole('textbox', { name: '笔记' }) as HTMLInputElement;
		fireEvent.change(input, { target: { value: '保留值' } });
		for (const name of ['详情开关', '筛选开关', '详情开关', '筛选开关']) {
			fireEvent.click(view.getByRole('button', { name }));
			expect(view.getByRole('textbox', { name: '笔记' })).toBe(input);
			expect(input.value).toBe('保留值');
		}
		containerWidth = 360;
		act(() => {
			for (const notify of observers) notify();
		});
		expect(view.getByRole('textbox', { name: '笔记' })).toBe(input);
		expect(input.value).toBe('保留值');
	});

	it('SSR 不依赖 ResizeObserver，保留所有布局插槽与可访问分隔条', () => {
		vi.stubGlobal('ResizeObserver', undefined);
		const markup = renderToString(
			<DataViewLayout.Root
				header={<DataViewLayout.Header title='文档' description='文档目录' search={<input aria-label='搜索' />} />}
				footer={<DataViewLayout.Footer pageInfo='共 3 条' status='已保存' />}
				rightPanel={<aside>详情</aside>}
			>
				<DataViewLayout.Body>主内容</DataViewLayout.Body>
			</DataViewLayout.Root>,
		);
		expect(markup).toContain('data-layout="mobile"');
		expect(markup).toContain('aria-label="调整右侧面板大小"');
		expect(markup).toContain('共 3 条');
		expect(markup).toContain('文档目录');
	});

	it('初始窄容器使用纵向布局', () => {
		containerWidth = 360;
		const view = render(<DataViewLayout.Root>内容</DataViewLayout.Root>);
		expect(view.container.querySelector('[data-layout]')?.getAttribute('data-layout')).toBe('mobile');
	});
});
