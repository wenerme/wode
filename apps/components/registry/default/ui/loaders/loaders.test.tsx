import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { Loader, LoadingIndicator, LoadingOverlay, LoadingRows, PendingButton, Skeleton } from './index';

describe('Loader', () => {
	it('renders accessible and decorative variants with reduced-motion support', () => {
		const accessible = renderToStaticMarkup(
			<Loader className='text-primary' label='同步中' size='lg' variant='bars' />,
		);
		expect(accessible).toContain('role="status"');
		expect(accessible).toContain('aria-label="同步中"');
		expect(accessible).toContain('data-variant="bars"');
		expect(accessible).toContain('loading-bars');
		expect(accessible).toContain('loading-lg');
		expect(accessible).toContain('motion-reduce:animate-none');
		expect(accessible).toContain('text-primary');

		const decorative = renderToStaticMarkup(<Loader decorative variant='dots' />);
		expect(decorative).toContain('aria-hidden="true"');
		expect(decorative).not.toContain('role="status"');
		expect(decorative).not.toContain('aria-label=');
	});
});

describe('LoadingIndicator', () => {
	it('supports inline, section, and page layouts without dropping numeric labels', () => {
		const markup = renderToStaticMarkup(
			<LoadingIndicator data-probe='indicator' description='请稍候' label={0} layout='page' variant='ring' />,
		);
		expect(markup).toContain('data-layout="page"');
		expect(markup).toContain('min-h-[24rem]');
		expect(markup).toContain('aria-busy="true"');
		expect(markup).toContain('loading-ring');
		expect(markup).toContain('>0<');
		expect(markup).toContain('请稍候');
		expect(markup).toContain('data-probe="indicator"');
		expect(renderToStaticMarkup(<LoadingIndicator contentClassName='block' />)).toContain('block');
	});

	it('falls back to an accessible loader label when visible copy is absent', () => {
		for (const label of [null, '', '   ']) {
			const markup = renderToStaticMarkup(<LoadingIndicator label={label} loaderLabel='读取数据中' />);
			expect(markup).toContain('aria-label="读取数据中"');
		}
	});
});

describe('PendingButton', () => {
	it('keeps both labels in layout and exposes controlled pending state', () => {
		const idle = renderToStaticMarkup(<PendingButton pendingLabel='保存中'>保存</PendingButton>);
		expect(idle).toContain('data-pending="false"');
		expect(idle).toContain('保存');
		expect(idle).toContain('保存中');
		expect(idle).not.toContain('disabled=""');
		expect(idle).not.toContain('aria-busy="true"');

		const pending = renderToStaticMarkup(
			<PendingButton className='btn-primary' pending pendingLabel='保存中' type='submit'>
				保存
			</PendingButton>,
		);
		expect(pending).toContain('data-pending="true"');
		expect(pending).toContain('disabled=""');
		expect(pending).toContain('aria-busy="true"');
		expect(pending).toContain('aria-label="保存中"');
		expect(pending).toContain('btn-primary');
		expect(pending).toContain('loading-spinner');

		const complexLabel = renderToStaticMarkup(
			<PendingButton pending pendingAriaLabel='Uploading files' pendingLabel={<strong>Uploading</strong>}>
				Upload
			</PendingButton>,
		);
		expect(complexLabel).toContain('aria-label="Uploading files"');
	});
});

describe('LoadingOverlay', () => {
	it('makes covered content inert only while active', () => {
		const active = renderToStaticMarkup(
			<LoadingOverlay active description='正在获取最新状态'>
				<button type='button'>危险操作</button>
			</LoadingOverlay>,
		);
		expect(active).toContain('data-active="true"');
		expect(active).toContain('inert=""');
		expect(active).toContain('aria-hidden="true"');
		expect(active).toContain('data-slot="loading-overlay-backdrop"');
		expect(active).toContain('正在获取最新状态');

		const idle = renderToStaticMarkup(<LoadingOverlay>内容</LoadingOverlay>);
		expect(idle).toContain('data-active="false"');
		expect(idle).not.toContain('inert=""');
		expect(idle).not.toContain('loading-overlay-backdrop');
	});
});

describe('Skeleton and LoadingRows', () => {
	it('renders shape-aware skeletons with native props', () => {
		const markup = renderToStaticMarkup(<Skeleton className='w-24' data-probe='shape' shape='circle' />);
		expect(markup).toContain('data-shape="circle"');
		expect(markup).toContain('rounded-full');
		expect(markup).toContain('motion-reduce:animate-none');
		expect(markup).toContain('data-probe="shape"');
	});

	it('renders deterministic list and table recipes with bounded row counts', () => {
		const table = renderToStaticMarkup(<LoadingRows columns={3} rows={2} variant='table' />);
		expect(table).toContain('data-rows="2"');
		expect(table).toContain('grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,.75fr)]');
		expect(table.match(/data-slot="skeleton"/g)).toHaveLength(9);

		const minimum = renderToStaticMarkup(<LoadingRows rows={0} showLeading={false} showTrailing={false} />);
		expect(minimum).toContain('data-rows="1"');
		expect(minimum.match(/data-slot="skeleton"/g)).toHaveLength(2);

		const fallback = renderToStaticMarkup(<LoadingRows rows={Number.POSITIVE_INFINITY} />);
		expect(fallback).toContain('data-rows="5"');
	});
});
