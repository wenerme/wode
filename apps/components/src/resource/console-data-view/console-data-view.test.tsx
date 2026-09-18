import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import {
	DataView,
	DataViewDetailGrid,
	DataViewDetailsPanel,
	DataViewFooter,
	DataViewHeader,
	DataViewSidePanelLayout,
	DataViewSummaryPanel,
	DataViewSummarySection,
} from './console-data-view';
import { DataViewLayout as CompoundDataViewLayout } from './data-view-layout';
import { DataViewLayout as ReexportedDataViewLayout } from './index';

describe('console data view layout', () => {
	it('composes a dense header, content, and footer workspace', () => {
		const markup = renderToStaticMarkup(
			<CompoundDataViewLayout.Composite
				header={
					<CompoundDataViewLayout.Header
						headingLevel={1}
						title='客户'
						search={<span>search control</span>}
						sort={<span>sort control</span>}
						filter={<span>filter control</span>}
						actions={<span>actions control</span>}
						menu={<span>menu control</span>}
					/>
				}
				footer={<CompoundDataViewLayout.Footer info='共 3 条' status='同步完成' />}
				summary={
					<CompoundDataViewLayout.Summary
						title='启明科技'
						description='客户概要'
						tabs={[{ value: 'overview', label: '概要' }]}
						value='overview'
						onClose={() => undefined}
						footerInfo='更新于 2 分钟前'
					>
						summary body
					</CompoundDataViewLayout.Summary>
				}
			>
				<div>customer rows</div>
			</CompoundDataViewLayout.Composite>,
		);

		expect(markup).toContain('<h1 class="shrink-0 truncate text-sm font-semibold">客户</h1>');
		expect(markup).toContain('h-[57px] min-h-[57px]');
		expect(markup.indexOf('search control')).toBeLessThan(markup.indexOf('sort control'));
		expect(markup.indexOf('sort control')).toBeLessThan(markup.indexOf('filter control'));
		expect(markup.indexOf('filter control')).toBeLessThan(markup.indexOf('actions control'));
		expect(markup.indexOf('actions control')).toBeLessThan(markup.indexOf('menu control'));
		expect(markup).toContain('customer rows');
		expect(markup).toContain('data-slot="data-view-layout-summary"');
		expect(markup).toContain('summary body');
		expect(markup).toContain('role="tab"');
		expect(markup).toContain('aria-controls=');
		expect(markup).toContain('role="tabpanel"');
		expect(markup).toContain('aria-label="关闭概要"');
		expect(markup).toContain('<footer');
		expect(markup.indexOf('<header')).toBeLessThan(markup.indexOf('customer rows'));
		expect(markup.indexOf('customer rows')).toBeLessThan(markup.indexOf('<footer'));
	});

	it('preserves the framed flat DataView default', () => {
		const markup = renderToStaticMarkup(<DataView>flat content</DataView>);
		expect(markup).toContain('min-h-[28rem] border');
		expect(markup).not.toContain('h-full min-h-0 border-0');
	});

	it('keeps flat exports available through the compound facade', () => {
		expect(typeof DataViewHeader).toBe('function');
		expect(typeof DataViewFooter).toBe('function');
		expect(CompoundDataViewLayout).toBe(ReexportedDataViewLayout);
	});

	it('composes resource page range, page size, status, and edge navigation in the footer', () => {
		const markup = renderToStaticMarkup(
			<CompoundDataViewLayout.ResourceFooter
				page={2}
				pageSize={25}
				total={45}
				onPageChange={() => undefined}
				onPageSizeChange={() => undefined}
				status={<span>同步完成</span>}
			/>,
		);
		expect(markup).toContain('26-45');
		expect(markup).toContain('总数 45');
		expect(markup).toContain('aria-label="每页数量"');
		expect(markup).toContain('value="25" selected=""');
		expect(markup).toContain('aria-label="第一页"');
		expect(markup).toContain('aria-label="最后一页"');
		expect(markup).toContain('同步完成');
	});

	it('falls back to the first enabled summary tab when the controlled value is invalid', () => {
		const markup = renderToStaticMarkup(
			<CompoundDataViewLayout.Summary
				tabs={[
					{ value: 'disabled', label: '不可用', disabled: true },
					{ value: 'overview', label: '概要' },
				]}
				value='missing'
			>
				body
			</CompoundDataViewLayout.Summary>,
		);
		expect(markup.match(/aria-selected="true"/g)).toHaveLength(1);
		expect(markup.match(/tabindex="0"/g)).toHaveLength(1);
		expect(markup).toContain('aria-labelledby=');
	});
});

describe('console data view side panel primitives', () => {
	it('renders main, summary, and expanded details regions together', () => {
		const markup = renderToStaticMarkup(
			<DataViewSidePanelLayout
				summary={<DataViewSummaryPanel title='概要'>summary body</DataViewSummaryPanel>}
				details={<DataViewDetailsPanel title='详情'>details body</DataViewDetailsPanel>}
				summaryWidth='18rem'
				detailsWidth='28rem'
			>
				<div>main body</div>
			</DataViewSidePanelLayout>,
		);

		expect(markup).toContain('main body');
		expect(markup).toContain('aria-label="概要"');
		expect(markup).toContain('summary body');
		expect(markup).toContain('aria-label="展开详情"');
		expect(markup).toContain('details body');
		expect(markup).toContain('--data-view-summary-width:18rem');
		expect(markup).toContain('--data-view-details-width:28rem');
	});

	it('omits closed side panels while keeping the main region', () => {
		const markup = renderToStaticMarkup(
			<DataViewSidePanelLayout
				summary={<DataViewSummaryPanel title='概要'>summary body</DataViewSummaryPanel>}
				details={<DataViewDetailsPanel title='详情'>details body</DataViewDetailsPanel>}
				summaryOpen={false}
				detailsOpen={false}
			>
				<div>main body</div>
			</DataViewSidePanelLayout>,
		);

		expect(markup).toContain('main body');
		expect(markup).not.toContain('summary body');
		expect(markup).not.toContain('details body');
	});

	it('renders single-panel layout branches', () => {
		const summaryOnly = renderToStaticMarkup(
			<DataViewSidePanelLayout summary={<DataViewSummaryPanel title='概要'>summary body</DataViewSummaryPanel>}>
				<div>main body</div>
			</DataViewSidePanelLayout>,
		);
		const detailsOnly = renderToStaticMarkup(
			<DataViewSidePanelLayout details={<DataViewDetailsPanel title='详情'>details body</DataViewDetailsPanel>}>
				<div>main body</div>
			</DataViewSidePanelLayout>,
		);

		expect(summaryOnly).toContain('xl:grid-cols-[minmax(0,1fr)_var(--data-view-summary-width)]');
		expect(detailsOnly).toContain('xl:grid-cols-[minmax(0,1fr)_var(--data-view-details-width)]');
	});

	it('renders accessible panel action buttons when handlers are provided', () => {
		const markup = renderToStaticMarkup(
			<>
				<DataViewSummaryPanel title='概要' onClose={() => undefined} onExpand={() => undefined}>
					summary body
				</DataViewSummaryPanel>
				<DataViewDetailsPanel title='详情' onClose={() => undefined}>
					details body
				</DataViewDetailsPanel>
			</>,
		);

		expect(markup).toContain('aria-label="展开详情"');
		expect(markup).toContain('aria-label="关闭概要"');
		expect(markup).toContain('aria-label="关闭详情"');
	});

	it('renders collapsible summary sections and detail grids without app state', () => {
		const markup = renderToStaticMarkup(
			<>
				<DataViewSummarySection title='运行状态' description='最近一次同步结果' meta='warning' open>
					同步延迟 3 分钟
				</DataViewSummarySection>
				<DataViewDetailGrid columns={3}>
					<div>owner</div>
					<div>region</div>
					<div>updated</div>
				</DataViewDetailGrid>
			</>,
		);

		expect(markup).toContain('<details');
		expect(markup).toContain('open=""');
		expect(markup).toContain('运行状态');
		expect(markup).toContain('同步延迟 3 分钟');
		expect(markup).toContain('xl:grid-cols-3');
	});
});
