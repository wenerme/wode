import type { Meta, StoryObj } from '@storybook/react-vite';
import { Database, Filter, MoreHorizontal, Plus, RefreshCw, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
	DataView,
	DataViewActionBar,
	DataViewDetailGrid,
	DataViewDetailsPanel,
	DataViewEmpty,
	DataViewFooter,
	DataViewHeader,
	DataViewSearch,
	DataViewSidePanelLayout,
	DataViewSummaryPanel,
	DataViewSummarySection,
	DataViewTable,
	DataViewViewHeader,
} from '../../registry/default/blocks/console-data-view';
import { Status } from '../../registry/default/ui/status';
import { type DemoRecord, demoRecords, resourceTypeIcons } from './console-fixtures';
import { ConsoleDataViewDemo } from './data-view-demo';
import { createFakeDemoRecords } from './fake-data-view-records';

const meta = {
	title: 'Console/Data View',
	component: DataView,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'A presentational data workspace. Query state, caching, URL synchronization, and virtualization remain application concerns.',
			},
		},
	},
} satisfies Meta<typeof DataView>;

export default meta;
type Story = StoryObj<typeof meta>;

const largeDataset = createFakeDemoRecords(500);

export const Interactive: Story = {
	render: () => <ConsoleDataViewDemo />,
};

export const LargeDataset: Story = {
	name: 'Large Dataset / Scroll',
	render: () => <ConsoleDataViewDemo records={largeDataset} pageSize={100} />,
	parameters: {
		docs: {
			description: {
				story:
					'500 seeded Faker records with 100 rows per page for vertical, horizontal, sticky-header, and mode-switch scrolling checks.',
			},
		},
	},
};

export const ResourceWorkbench: Story = {
	name: 'Resource Workbench / Side Panels',
	render: () => <ResourceWorkbenchDemo />,
	parameters: {
		docs: {
			description: {
				story:
					'Composes side summary, expanded details, action bar, view header, and detail grid primitives without resource-specific state or routing.',
			},
		},
	},
};

export const Empty: Story = {
	render: () => (
		<main className='p-5'>
			<h1 className='sr-only'>Empty data view</h1>
			<DataView className='h-[32rem]' header={<DataViewHeader title='服务资源' description='当前筛选条件' />}>
				<DataViewEmpty
					icon={<Database className='size-6' />}
					title='没有匹配的资源'
					description='调整搜索词或清除筛选条件后重试。'
					action={
						<button type='button' className='bg-neutral text-neutral-content h-8 rounded-md px-3 text-xs font-medium'>
							清除筛选
						</button>
					}
				/>
			</DataView>
		</main>
	),
};

function ResourceWorkbenchDemo() {
	const [query, setQuery] = useState('');
	const [selectedId, setSelectedId] = useState(demoRecords[0]?.id ?? '');
	const [summaryOpen, setSummaryOpen] = useState(true);
	const [detailsOpen, setDetailsOpen] = useState(true);
	const filtered = useMemo(() => {
		const value = query.trim().toLowerCase();
		if (!value) return demoRecords;
		return demoRecords.filter((record) =>
			`${record.name} ${record.type} ${record.owner} ${record.region}`.toLowerCase().includes(value),
		);
	}, [query]);
	const selected = filtered.find((record) => record.id === selectedId) ?? filtered[0];

	return (
		<main className='p-3 md:p-5'>
			<h1 className='sr-only'>Resource workbench data view</h1>
			<DataView
				className='h-[min(50rem,calc(100vh-2rem))]'
				header={
					<DataViewHeader
						title='资源工作台'
						description='跨环境数据源、队列和对象存储的运维视图。'
						status={<Status tone='info'>只读</Status>}
						actions={
							<>
								<button
									type='button'
									aria-label='刷新资源'
									title='刷新资源'
									className='hover:bg-base-200 grid size-8 place-items-center rounded-md'
								>
									<RefreshCw className='size-4' />
								</button>
								<button
									type='button'
									className='bg-neutral text-neutral-content inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium'
								>
									<Plus className='size-4' />
									新建资源
								</button>
							</>
						}
					/>
				}
				toolbar={
					<DataViewActionBar
						aria-label='资源操作'
						leading={<span className='text-base-content/65 text-xs font-medium'>平台资源 · 生产 / 预发 / 开发</span>}
						secondary={
							<>
								<button
									type='button'
									className='btn btn-ghost btn-xs'
									onClick={() => setSummaryOpen((value) => !value)}
								>
									{summaryOpen ? '隐藏概要' : '显示概要'}
								</button>
								<button
									type='button'
									className='btn btn-ghost btn-xs'
									onClick={() => setDetailsOpen((value) => !value)}
								>
									{detailsOpen ? '隐藏详情' : '显示详情'}
								</button>
							</>
						}
					/>
				}
				footer={<DataViewFooter info={`显示 ${filtered.length} / ${demoRecords.length} 个资源`} />}
			>
				<DataViewSidePanelLayout
					className='xl:h-full'
					summaryOpen={summaryOpen}
					detailsOpen={detailsOpen}
					summary={
						selected ? (
							<WorkbenchSummary
								record={selected}
								onClose={() => setSummaryOpen(false)}
								onExpand={() => setDetailsOpen(true)}
							/>
						) : undefined
					}
					details={selected ? <WorkbenchDetails record={selected} onClose={() => setDetailsOpen(false)} /> : undefined}
				>
					<div className='flex min-h-full flex-col'>
						<DataViewViewHeader
							title='资源列表'
							description='按名称、负责人、区域和状态快速定位基础资源。'
							meta={`${filtered.length} matched`}
							controls={
								<>
									<DataViewSearch
										value={query}
										placeholder='搜索资源、负责人或区域'
										onChange={(event) => setQuery(event.target.value)}
										onClear={() => setQuery('')}
									/>
									<button type='button' className='btn btn-outline btn-sm rounded-md'>
										<Filter className='size-4' />
										筛选
									</button>
								</>
							}
						/>
						{filtered.length ? (
							<DataViewTable containerClassName='min-h-0 flex-1'>
								<thead className='bg-base-200 text-base-content/65 sticky top-0 z-10 text-xs'>
									<tr className='border-base-300 border-b'>
										<th className='px-3 py-2 font-medium'>名称</th>
										<th className='px-3 py-2 font-medium'>类型</th>
										<th className='px-3 py-2 font-medium'>状态</th>
										<th className='px-3 py-2 font-medium'>负责人</th>
										<th className='px-3 py-2 font-medium'>区域</th>
										<th className='w-10 px-3 py-2'>
											<span className='sr-only'>操作</span>
										</th>
									</tr>
								</thead>
								<tbody className='divide-base-300 divide-y'>
									{filtered.map((record) => (
										<tr
											key={record.id}
											className={selected?.id === record.id ? 'bg-primary/10' : 'hover:bg-base-200/45'}
										>
											<td className='px-3 py-2.5'>
												<button
													type='button'
													className='hover:text-primary font-medium'
													onClick={() => setSelectedId(record.id)}
												>
													{record.name}
												</button>
												<div className='text-base-content/45 mt-0.5 font-mono text-xs'>{record.id}</div>
											</td>
											<td className='text-base-content/65 px-3 py-2.5'>{record.type}</td>
											<td className='px-3 py-2.5'>
												<StoryResourceStatus status={record.status} />
											</td>
											<td className='text-base-content/65 px-3 py-2.5'>{record.owner}</td>
											<td className='text-base-content/65 px-3 py-2.5'>{record.region}</td>
											<td className='px-3 py-2.5'>
												<button
													type='button'
													aria-label={`${record.name} 操作`}
													title='更多操作'
													className='hover:bg-base-300/60 grid size-7 place-items-center rounded'
												>
													<MoreHorizontal className='size-4' />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</DataViewTable>
						) : (
							<DataViewEmpty
								icon={<SearchX className='size-6' />}
								title='没有匹配的资源'
								description='清除搜索后恢复完整列表。'
								action={
									<button type='button' className='btn btn-sm' onClick={() => setQuery('')}>
										清除搜索
									</button>
								}
							/>
						)}
					</div>
				</DataViewSidePanelLayout>
			</DataView>
		</main>
	);
}

function WorkbenchSummary({
	record,
	onClose,
	onExpand,
}: {
	record: DemoRecord;
	onClose: () => void;
	onExpand: () => void;
}) {
	const Icon = resourceTypeIcons[record.type];
	return (
		<DataViewSummaryPanel
			eyebrow='Summary'
			title={record.name}
			description={`${record.type} · ${record.region}`}
			status={<StoryResourceStatus status={record.status} />}
			onClose={onClose}
			onExpand={onExpand}
			footer={
				<button type='button' className='btn btn-primary btn-sm w-full rounded-md' onClick={onExpand}>
					打开资源详情
				</button>
			}
		>
			<div className='border-base-300 mb-3 flex items-center gap-3 border-b pb-3'>
				<span className='bg-primary/10 text-primary grid size-10 place-items-center rounded-md'>
					<Icon className='size-5' />
				</span>
				<div className='min-w-0'>
					<div className='truncate text-sm font-medium'>{record.owner}</div>
					<div className='text-base-content/55 text-xs'>最近更新 {record.updatedAt}</div>
				</div>
			</div>
			<div className='space-y-3'>
				<DataViewSummarySection title='基本信息' description='常用资源字段' open>
					<StoryFacts
						rows={[
							['负责人', record.owner],
							['区域', record.region],
							['类型', record.type],
						]}
					/>
				</DataViewSummarySection>
				<DataViewSummarySection
					title='运行状态'
					description='用于快速判断是否需要展开详情'
					meta={<StoryResourceStatus status={record.status} size='xs' variant='soft' />}
					open={record.status !== 'healthy'}
				>
					<StoryFacts
						rows={[
							['状态', record.status],
							['最近同步', record.updatedAt],
							['连接策略', 'Private network'],
						]}
					/>
				</DataViewSummarySection>
			</div>
		</DataViewSummaryPanel>
	);
}

function WorkbenchDetails({ record, onClose }: { record: DemoRecord; onClose: () => void }) {
	return (
		<DataViewDetailsPanel
			title={`${record.name} 详情`}
			description='资源字段、审计摘要和关系视图。'
			status={<StoryResourceStatus status={record.status} />}
			onClose={onClose}
		>
			<DataViewDetailGrid columns={2}>
				<StoryDetailTile label='Resource ID' value={record.id} />
				<StoryDetailTile label='Owner' value={record.owner} />
				<StoryDetailTile label='Region' value={record.region} />
				<StoryDetailTile label='Updated' value={record.updatedAt} />
			</DataViewDetailGrid>
			<div className='border-base-300 bg-base-200/40 text-base-content/70 mt-4 rounded-md border p-3 text-sm leading-6'>
				最近一次审计没有发现高风险变更，连接策略仍为私网访问。
			</div>
		</DataViewDetailsPanel>
	);
}

function StoryFacts({ rows }: { rows: Array<[string, string]> }) {
	return (
		<dl className='space-y-2 text-xs'>
			{rows.map(([label, value]) => (
				<div key={label} className='grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2'>
					<dt className='text-base-content/55'>{label}</dt>
					<dd className='font-medium break-words'>{value}</dd>
				</div>
			))}
		</dl>
	);
}

function StoryDetailTile({ label, value }: { label: string; value: string }) {
	return (
		<div className='border-base-300 bg-base-100 rounded-md border p-3'>
			<div className='text-base-content/45 text-xs font-medium uppercase'>{label}</div>
			<div className='mt-1 font-mono text-sm break-words'>{value}</div>
		</div>
	);
}

function StoryResourceStatus({
	status,
	size = 'sm',
	variant = 'soft',
}: {
	status: DemoRecord['status'];
	size?: 'xs' | 'sm' | 'md';
	variant?: 'soft' | 'solid' | 'outline';
}) {
	const config = {
		healthy: ['正常', 'success'],
		warning: ['警告', 'warning'],
		offline: ['离线', 'danger'],
	} as const;
	const [label, tone] = config[status];
	return (
		<Status tone={tone} variant={variant} size={size} dot>
			{label}
		</Status>
	);
}
