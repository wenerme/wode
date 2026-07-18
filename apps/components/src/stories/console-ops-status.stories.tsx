import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	Activity,
	AlertTriangle,
	Boxes,
	CheckCircle2,
	Clock3,
	Database,
	MoreHorizontal,
	RefreshCw,
	Server,
} from 'lucide-react';
import {
	DataViewAttentionItem,
	DataViewAttentionList,
	type DataViewInventoryColumn,
	DataViewInventoryTable,
	DataViewMetricCard,
	DataViewPanel,
} from '../../registry/default/blocks/console-data-view';
import { Status } from '../../registry/default/ui/status';

const meta = {
	title: 'Console/Data View/Ops Status',
	component: DataViewPanel,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'Presentational operations primitives for metrics, framed tools, attention queues, and typed inventory tables.',
			},
		},
	},
} satisfies Meta<typeof DataViewPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

type ServiceInventoryRow = {
	id: string;
	name: string;
	kind: string;
	region: string;
	owner: string;
	status: 'healthy' | 'warning' | 'offline';
	updatedAt: string;
};

const serviceRows: ServiceInventoryRow[] = [
	{
		id: 'svc-pg-primary',
		name: 'core-postgres',
		kind: 'PostgreSQL',
		region: 'cn-shanghai',
		owner: 'Platform',
		status: 'healthy',
		updatedAt: '2 分钟前',
	},
	{
		id: 'svc-audit-archive',
		name: 'audit-archive',
		kind: 'Object Storage',
		region: 'ap-singapore',
		owner: 'Security',
		status: 'warning',
		updatedAt: '18 分钟前',
	},
	{
		id: 'svc-events-primary',
		name: 'events-primary',
		kind: 'Message Queue',
		region: 'ap-singapore',
		owner: 'Runtime',
		status: 'healthy',
		updatedAt: '24 分钟前',
	},
	{
		id: 'svc-analytics-replica',
		name: 'analytics-replica',
		kind: 'PostgreSQL',
		region: 'us-west',
		owner: 'Data',
		status: 'offline',
		updatedAt: '1 小时前',
	},
];

const inventoryColumns: DataViewInventoryColumn<ServiceInventoryRow>[] = [
	{
		id: 'service',
		header: '服务',
		cell: (row) => (
			<div className='min-w-44'>
				<div className='font-medium'>{row.name}</div>
				<div className='text-base-content/45 mt-0.5 font-mono text-xs'>{row.id}</div>
			</div>
		),
	},
	{
		id: 'kind',
		header: '类型',
		cell: (row) => <span className='text-base-content/65'>{row.kind}</span>,
	},
	{
		id: 'status',
		header: '状态',
		cell: (row) => <ServiceStatus status={row.status} />,
	},
	{
		id: 'owner',
		header: '负责人',
		cell: (row) => <span className='text-base-content/65'>{row.owner}</span>,
	},
	{
		id: 'region',
		header: '区域',
		cell: (row) => <span className='text-base-content/65 font-mono text-xs'>{row.region}</span>,
	},
	{
		id: 'updated',
		header: '最近更新',
		cell: (row) => <span className='text-base-content/55 whitespace-nowrap'>{row.updatedAt}</span>,
	},
	{
		id: 'actions',
		header: <span className='sr-only'>操作</span>,
		align: 'end',
		cell: (row) => (
			<button
				type='button'
				aria-label={`${row.name} 操作`}
				title='更多操作'
				className='hover:bg-base-200 grid size-7 place-items-center rounded'
			>
				<MoreHorizontal className='size-4' />
			</button>
		),
	},
];

export const OperationsOverview: Story = {
	render: () => <OperationsOverviewDemo rows={serviceRows} />,
};

export const ClearAttentionQueue: Story = {
	render: () => (
		<main className='p-3 md:p-5'>
			<h1 className='sr-only'>运维待处理状态</h1>
			<DataViewPanel
				className='mx-auto max-w-2xl'
				aria-label='待处理事项'
				title='待处理事项'
				description='生产环境风险队列'
				icon={<CheckCircle2 className='size-4' />}
				status={<Status tone='success'>正常</Status>}
				tone='success'
			>
				<DataViewAttentionList aria-label='风险队列' empty='当前没有需要处理的告警或审核事项' />
			</DataViewPanel>
		</main>
	),
};

function OperationsOverviewDemo({ rows }: { rows: ServiceInventoryRow[] }) {
	return (
		<main className='space-y-3 p-3 md:space-y-4 md:p-5'>
			<header className='flex flex-wrap items-start gap-3'>
				<div className='min-w-0 flex-1'>
					<h1 className='text-base font-semibold'>平台运行概览</h1>
					<p className='text-base-content/60 mt-1 text-xs'>生产环境 · 7 个区域 · 更新于 10:42:18</p>
				</div>
				<Status tone='success' variant='outline'>
					核心链路正常
				</Status>
				<button
					type='button'
					aria-label='刷新运行概览'
					title='刷新'
					className='border-base-300 hover:bg-base-200 grid size-8 place-items-center rounded-md border'
				>
					<RefreshCw className='size-4' />
				</button>
			</header>

			<section aria-label='核心指标' className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
				<DataViewMetricCard
					label='服务资源'
					value='128'
					icon={<Boxes className='size-4' />}
					status={
						<Status tone='success' size='xs'>
							正常
						</Status>
					}
					hint='124 个在线，4 个需要关注'
					tone='info'
				/>
				<DataViewMetricCard
					label='数据库连接'
					value='96.8%'
					icon={<Database className='size-4' />}
					trend='+0.4%'
					hint='连接池利用率 61%'
					tone='success'
				/>
				<DataViewMetricCard
					label='活跃任务'
					value='42'
					icon={<Activity className='size-4' />}
					status={
						<Status tone='warning' size='xs'>
							3 个延迟
						</Status>
					}
					hint='最长排队 2 分 18 秒'
					tone='warning'
				/>
				<DataViewMetricCard
					label='主机在线率'
					value='23 / 24'
					icon={<Server className='size-4' />}
					status={
						<Status tone='danger' size='xs'>
							1 个离线
						</Status>
					}
					hint='us-west 分析节点失联'
					tone='danger'
				/>
			</section>

			<div className='grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]'>
				<DataViewPanel
					aria-label='待处理事项'
					title='待处理事项'
					description='按影响范围和持续时间排序'
					icon={<AlertTriangle className='size-4' />}
					status={
						<Status tone='warning' variant='soft' size='xs'>
							3 项
						</Status>
					}
					tone='warning'
				>
					<DataViewAttentionList aria-label='生产风险队列'>
						<DataViewAttentionItem
							title='analytics-replica 离线'
							description='us-west 只读副本最近一次心跳在 1 小时前。'
							meta='Data · 持续 1 小时'
							status={
								<Status tone='danger' size='xs'>
									P1
								</Status>
							}
							tone='danger'
						/>
						<DataViewAttentionItem
							title='audit-archive 写入确认延迟'
							description='归档对象已写入，但异地副本尚未确认。'
							meta='Security · 持续 18 分钟'
							status={
								<Status tone='warning' size='xs'>
									P2
								</Status>
							}
							tone='warning'
						/>
						<DataViewAttentionItem
							title='访问策略等待审核'
							description='生产消息队列新增只读消费角色。'
							meta='Platform · 2 分钟前'
							status={
								<Status tone='info' size='xs'>
									审核
								</Status>
							}
							tone='info'
						/>
					</DataViewAttentionList>
				</DataViewPanel>

				<DataViewPanel
					aria-label='同步窗口'
					title='同步窗口'
					description='最近一次平台目录同步'
					icon={<Clock3 className='size-4' />}
					status={
						<Status tone='success' size='xs'>
							完成
						</Status>
					}
					tone='success'
				>
					<dl className='divide-base-300 divide-y text-xs'>
						<OpsFact label='开始时间' value='10:40:02' />
						<OpsFact label='处理资源' value='128' />
						<OpsFact label='新增 / 更新' value='2 / 7' />
						<OpsFact label='失败' value='0' />
						<OpsFact label='耗时' value='4.8 秒' />
					</dl>
				</DataViewPanel>
			</div>

			<DataViewPanel
				aria-label='服务库存'
				title='服务库存'
				description='按服务、区域和负责人核对运行状态'
				icon={<Server className='size-4' />}
				status={
					<Status tone='info' size='xs'>
						{rows.length} 项
					</Status>
				}
				contentClassName='p-0'
			>
				<DataViewInventoryTable
					aria-label='服务库存表'
					caption='生产环境服务库存'
					rows={rows}
					columns={inventoryColumns}
					getRowKey={(row) => row.id}
					containerClassName='rounded-none border-0'
					rowClassName={(row) => (row.status === 'offline' ? 'bg-error/4' : undefined)}
				/>
			</DataViewPanel>
		</main>
	);
}

function OpsFact({ label, value }: { label: string; value: string }) {
	return (
		<div className='grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2.5 first:pt-0 last:pb-0'>
			<dt className='text-base-content/55'>{label}</dt>
			<dd className='font-mono font-medium'>{value}</dd>
		</div>
	);
}

function ServiceStatus({ status }: { status: ServiceInventoryRow['status'] }) {
	const config = {
		healthy: ['正常', 'success'],
		warning: ['警告', 'warning'],
		offline: ['离线', 'danger'],
	} as const;
	const [label, tone] = config[status];
	return <Status tone={tone}>{label}</Status>;
}
