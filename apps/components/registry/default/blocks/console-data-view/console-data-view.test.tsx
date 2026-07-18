import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import {
	DataViewDetailGrid,
	DataViewDetailsPanel,
	DataViewSidePanelLayout,
	DataViewSummaryPanel,
	DataViewSummarySection,
} from './console-data-view';

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
