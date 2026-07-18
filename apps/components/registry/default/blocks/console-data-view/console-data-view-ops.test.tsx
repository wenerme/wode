import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import {
	DataViewAttentionItem,
	DataViewAttentionList,
	type DataViewInventoryColumn,
	DataViewInventoryTable,
	DataViewMetricCard,
	DataViewPanel,
} from './console-data-view-ops';

describe('console data view ops primitives', () => {
	it('renders metric slots and forwards native article props', () => {
		const markup = renderToStaticMarkup(
			<DataViewMetricCard
				id='queue-depth'
				title='队列深度指标'
				aria-label='队列深度'
				label='待处理任务'
				value='128'
				icon={<span>Q</span>}
				status={<span>繁忙</span>}
				trend='+12%'
				hint='最近五分钟持续增长'
				actions={<button type='button'>查看</button>}
				tone='warning'
			/>,
		);

		expect(markup).toContain('data-slot="data-view-metric-card"');
		expect(markup).toContain('data-tone="warning"');
		expect(markup).toContain('id="queue-depth"');
		expect(markup).toContain('title="队列深度指标"');
		expect(markup).toContain('aria-label="队列深度"');
		expect(markup).toContain('待处理任务');
		expect(markup).toContain('最近五分钟持续增长');
		expect(markup).toContain('<button type="button">查看</button>');
	});

	it('renders a panel header, body, actions, and footer without owning state', () => {
		const markup = renderToStaticMarkup(
			<DataViewPanel
				aria-label='服务健康'
				eyebrow='Operations'
				title='服务健康'
				description='只读健康快照'
				icon={<span>H</span>}
				status={<span>3 / 4 正常</span>}
				meta='2 分钟前更新'
				actions={<button type='button'>刷新</button>}
				footer={<span>来源：health API</span>}
				tone='success'
			>
				<div>panel body</div>
			</DataViewPanel>,
		);

		expect(markup).toContain('data-slot="data-view-panel"');
		expect(markup).toContain('aria-label="服务健康"');
		expect(markup).toContain('<h2');
		expect(markup).toContain('panel body');
		expect(markup).toContain('<footer');
		expect(markup).toContain('来源：health API');
	});

	it('keeps attention groups semantic and individually composable', () => {
		const markup = renderToStaticMarkup(
			<DataViewAttentionList title='待处理事项' description='按风险优先处理'>
				<DataViewAttentionItem
					title='审计归档延迟'
					description='对象存储已连续 18 分钟未确认写入。'
					meta='Security · ap-singapore'
					status={<span>P1</span>}
					actions={<button type='button'>详情</button>}
					tone='danger'
				/>
				<DataViewAttentionItem title='配置待审核' tone='warning' />
			</DataViewAttentionList>,
		);

		expect(markup).toContain('aria-label="待处理事项"');
		expect(markup).toContain('<h3');
		expect(markup).toContain('<ul');
		expect(markup.match(/<li/g)).toHaveLength(2);
		expect(markup).toContain('data-tone="danger"');
		expect(markup).toContain('对象存储已连续 18 分钟未确认写入。');
		expect(markup).toContain('<button type="button">详情</button>');
	});

	it('preserves numeric zero slots and supports contextual heading levels', () => {
		const metricMarkup = renderToStaticMarkup(
			<DataViewMetricCard label='Metric' value='1' icon={0} status={0} trend={0} hint={0} actions={0} />,
		);
		const panelMarkup = renderToStaticMarkup(
			<DataViewPanel title={0} description={0} icon={0} status={0} meta={0} actions={0} footer={0} headingLevel={4}>
				body
			</DataViewPanel>,
		);
		const attentionMarkup = renderToStaticMarkup(
			<DataViewAttentionList title={0} description={0} status={0} headingLevel={5}>
				<DataViewAttentionItem title='Item' icon={0} description={0} meta={0} status={0} actions={0} />
			</DataViewAttentionList>,
		);

		expect(metricMarkup.match(/>0</g)).toHaveLength(5);
		expect(panelMarkup).toContain('<h4');
		expect(panelMarkup).toContain('>0</h4>');
		expect(panelMarkup).toContain('<footer');
		expect(attentionMarkup).toContain('<h5');
		expect(attentionMarkup).toContain('>0</h5>');
		expect(attentionMarkup).not.toContain('mt-1.5 size-2');
	});

	it('renders a compact empty attention state', () => {
		const markup = renderToStaticMarkup(<DataViewAttentionList aria-label='告警' empty='当前没有告警' />);

		expect(markup).toContain('data-slot="data-view-attention-empty"');
		expect(markup).toContain('当前没有告警');
		expect(markup).not.toContain('<ul');
	});

	it('renders typed inventory columns, stable row keys, and responsive table metadata', () => {
		type ServiceRow = { id: string; name: string; status: string; region: string };
		const rows: ServiceRow[] = [
			{ id: 'svc-1', name: 'API Gateway', status: 'healthy', region: 'cn-shanghai' },
			{ id: 'svc-2', name: 'Audit Archive', status: 'warning', region: 'ap-singapore' },
		];
		const columns: DataViewInventoryColumn<ServiceRow>[] = [
			{ id: 'name', header: '服务', cell: (row) => row.name, cellClassName: 'service-cell' },
			{ id: 'region', header: '区域', cell: (row) => row.region },
			{ id: 'status', header: '状态', cell: (row) => row.status, align: 'end' },
		];
		const markup = renderToStaticMarkup(
			<DataViewInventoryTable
				aria-label='服务库存'
				caption='服务库存快照'
				rows={rows}
				columns={columns}
				getRowKey={(row) => row.id}
				minWidth='48rem'
				rowClassName={(row) => (row.status === 'warning' ? 'needs-attention' : undefined)}
			/>,
		);

		expect(markup).toContain('data-slot="data-view-inventory-table"');
		expect(markup).toContain('<caption class="sr-only">服务库存快照</caption>');
		expect(markup.match(/scope="col"/g)).toHaveLength(3);
		expect(markup).toContain('style="min-width:48rem"');
		expect(markup).toContain('service-cell');
		expect(markup).toContain('needs-attention');
		expect(markup).toContain('text-right');
		expect(markup).toContain('Audit Archive');
	});

	it('uses a full-width empty row when inventory has no records', () => {
		type EmptyRow = { id: string };
		const columns: DataViewInventoryColumn<EmptyRow>[] = [
			{ id: 'name', header: '名称', cell: (row) => row.id },
			{ id: 'status', header: '状态', cell: () => 'unknown' },
		];
		const markup = renderToStaticMarkup(
			<DataViewInventoryTable
				rows={[]}
				columns={columns}
				getRowKey={(row) => row.id}
				caption={0}
				empty='没有匹配的服务'
			/>,
		);

		expect(markup).toContain('<caption class="sr-only">0</caption>');
		expect(markup).toContain('colSpan="2"');
		expect(markup).toContain('没有匹配的服务');
	});
});
