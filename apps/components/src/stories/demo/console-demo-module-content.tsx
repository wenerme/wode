import {
	ArrowUpRight,
	Building2,
	ContactRound,
	FileInput,
	Handshake,
	ListTodo,
	MoreHorizontal,
	Plus,
	Target,
	Users,
} from 'lucide-react';
import { type MouseEvent, useState } from 'react';
import { DataViewLayout, DataViewSearch, type DataViewColumn } from '@/resource/console-data-view';
import { ConsolePage } from '@/console/console-shell';
import { Status } from '@/ui/status';
import { CONSOLE_DEMO_COUNTS } from './console-demo-dataset';
import { type DataListPage, isDataListPage, type DemoPage } from './console-demo-navigation';
import { type ConsoleDemoResourceListRow, getConsoleDemoResourcePageData } from './console-demo-resource-presenter';

const pageDetails = {
	account: ['客户', '管理客户档案、分层状态与最近往来。', []],
	contact: ['联系人', '维护客户联系人、岗位和沟通记录。', []],
	order: ['订单', '跟踪订单状态、金额与交付进度。', []],
	opportunity: ['商机', '管理销售阶段、预计收入和下一步行动。', []],
	lead: ['线索', '处理线索来源、评分与转化状态。', []],
	form: ['表单', '配置业务表单、发布状态与回收数据。', []],
	'admin-user': ['系统用户', '管理当前系统中的用户、角色与登录状态。', []],
	'admin-settings': ['系统设置', '配置认证、通知、数据保留与运行参数。', ['身份认证', '通知策略', '数据保留']],
	'meta-tenant': ['租户', '管理平台租户、套餐与启用状态。', []],
	'meta-user': ['平台用户', '跨租户查看用户身份与平台级状态。', []],
} as const;

export type RoutedModulePage = keyof typeof pageDetails;

export function isRoutedModulePage(page: DemoPage): page is RoutedModulePage {
	return Object.hasOwn(pageDetails, page);
}

const pageIcons = {
	account: Building2,
	contact: ContactRound,
	order: ListTodo,
	opportunity: Handshake,
	lead: Target,
	form: FileInput,
	'admin-user': Users,
	'admin-settings': ListTodo,
	'meta-tenant': Building2,
	'meta-user': Users,
} as const;

export function ConsoleRoutedHomeContent({
	counts,
	hrefForPage,
	onNavigate,
}: {
	counts?: Partial<Record<DataListPage, number>>;
	hrefForPage: (page: DemoPage) => string;
	onNavigate: (page: DemoPage) => void;
}) {
	const entries = [
		{
			page: 'account' as const,
			label: '客户',
			value: String(counts?.account ?? CONSOLE_DEMO_COUNTS.customers),
			hint: '本月新增 12',
			icon: Building2,
		},
		{
			page: 'contact' as const,
			label: '联系人',
			value: String(counts?.contact ?? CONSOLE_DEMO_COUNTS.contacts),
			hint: '待跟进 24',
			icon: ContactRound,
		},
		{
			page: 'order' as const,
			label: '订单',
			value: String(counts?.order ?? CONSOLE_DEMO_COUNTS.orders),
			hint: '待交付 6',
			icon: ListTodo,
		},
		{
			page: 'opportunity' as const,
			label: '商机',
			value: String(counts?.opportunity ?? CONSOLE_DEMO_COUNTS.opportunities),
			hint: '预计 ¥2.4M',
			icon: Handshake,
		},
	];
	return (
		<ConsolePage title='首页' description='客户、销售与交付工作的统一入口。'>
			<div className='border-base-300 bg-base-300 grid gap-px overflow-hidden border-y sm:grid-cols-2 xl:grid-cols-4'>
				{entries.map((entry) => (
					<a
						key={entry.page}
						href={hrefForPage(entry.page)}
						className='bg-base-100 hover:bg-base-200 p-4 text-left'
						onClick={(event) => handleNavigation(event, entry.page, onNavigate)}
					>
						<div className='flex items-center gap-2 text-sm font-medium'>
							<entry.icon className='size-4' />
							{entry.label}
						</div>
						<div className='mt-4 text-2xl font-semibold'>{entry.value}</div>
						<div className='text-base-content/55 mt-1 text-xs'>{entry.hint}</div>
					</a>
				))}
			</div>
			<div className='mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]'>
				<section aria-labelledby='console-demo-today-heading' className='border-base-300 border-y py-4'>
					<h2 id='console-demo-today-heading' className='text-sm font-semibold'>
						今日工作
					</h2>
					<div className='divide-base-300 mt-3 divide-y'>
						{['跟进启明科技续约商机', '确认 ORD-2026-0188 交付计划', '处理 6 条高意向线索'].map((item, index) => (
							<div key={item} className='flex items-center gap-3 py-3 text-sm'>
								<Status tone={index === 0 ? 'warning' : 'neutral'} size='xs'>
									{index === 0 ? '优先' : '待办'}
								</Status>
								<span className='flex-1'>{item}</span>
								<ArrowUpRight className='text-base-content/45 size-4' />
							</div>
						))}
					</div>
				</section>
				<section aria-labelledby='console-demo-pipeline-heading' className='border-base-300 border-y py-4'>
					<h2 id='console-demo-pipeline-heading' className='text-sm font-semibold'>
						销售漏斗
					</h2>
					<dl className='mt-3 space-y-3 text-sm'>
						{[
							['线索', String(counts?.lead ?? CONSOLE_DEMO_COUNTS.leads)],
							['商机', String(counts?.opportunity ?? CONSOLE_DEMO_COUNTS.opportunities)],
							['待签约', '7'],
						].map(([label, value]) => (
							<div key={label} className='flex'>
								<dt className='text-base-content/60 flex-1'>{label}</dt>
								<dd className='font-medium'>{value}</dd>
							</div>
						))}
					</dl>
				</section>
			</div>
		</ConsolePage>
	);
}

function handleNavigation(event: MouseEvent<HTMLAnchorElement>, page: DemoPage, onNavigate: (page: DemoPage) => void) {
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
	event.preventDefault();
	onNavigate(page);
}

export function ConsoleRoutedModuleContent({ page }: { page: RoutedModulePage }) {
	const [fallbackTitle, fallbackDescription, settingsRows] = pageDetails[page];
	const [query, setQuery] = useState('');
	const [activeId, setActiveId] = useState<string>();
	const [summaryTab, setSummaryTab] = useState<'overview' | 'activity'>('overview');
	const [pageNumber, setPageNumber] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const Icon = pageIcons[page];
	if (!isDataListPage(page)) {
		return (
			<ConsolePage title={fallbackTitle} description={fallbackDescription}>
				<div className='border-base-300 divide-base-300 divide-y border-y'>
					{settingsRows.map((row) => (
						<div key={row} className='flex items-center gap-3 px-3 py-3 text-sm'>
							<Icon className='text-base-content/55 size-4' />
							<span>{row}</span>
						</div>
					))}
				</div>
			</ConsolePage>
		);
	}

	const {
		title,
		description,
		relationColumn,
		ownerColumn,
		detailColumn,
		rows: dataRows,
	} = getConsoleDemoResourcePageData(page);
	const normalizedQuery = query.trim().toLocaleLowerCase('zh-CN');
	const visibleRows = normalizedQuery
		? dataRows.filter((row) =>
				`${row.name} ${row.owner} ${row.relation} ${row.detail}`.toLocaleLowerCase('zh-CN').includes(normalizedQuery),
			)
		: dataRows;
	const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
	const currentPage = Math.min(pageNumber, pageCount);
	const pageRows = visibleRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
	const active = dataRows.find((row) => row.id === activeId);
	const columns: readonly DataViewColumn<ConsoleDemoResourceListRow>[] = [
		{
			id: 'name',
			label: '名称',
			hideable: false,
			width: '16rem',
			cell: (row) => (
				<span className='flex min-w-0 items-center gap-2 font-medium'>
					<Icon className='text-base-content/45 size-4 shrink-0' />
					<span className='truncate'>{row.name}</span>
				</span>
			),
		},
		{
			id: 'relation',
			label: relationColumn,
			width: '13rem',
			cell: (row) => <span className='text-base-content/65 line-clamp-1'>{row.relation}</span>,
		},
		{
			id: 'status',
			label: '状态',
			width: '8rem',
			cell: (row) => (
				<Status tone={row.statusTone} size='xs'>
					{row.status}
				</Status>
			),
		},
		{ id: 'owner', label: ownerColumn, width: '9rem', cell: (row) => row.owner },
		{
			id: 'detail',
			label: detailColumn,
			width: '10rem',
			cell: (row) => <span className='text-base-content/65'>{row.detail}</span>,
		},
		{
			id: 'updatedAt',
			label: '更新时间',
			width: '8rem',
			cell: (row) => <span className='text-base-content/55 text-xs'>{row.updatedAt}</span>,
		},
		{
			id: 'actions',
			label: '操作',
			hideable: false,
			align: 'end',
			width: '4rem',
			cell: (row) => (
				<button
					type='button'
					aria-label={`${row.name} 操作`}
					className='hover:bg-base-300 grid size-7 place-items-center rounded'
				>
					<MoreHorizontal className='size-4' />
				</button>
			),
		},
	];

	return (
		<DataViewLayout.Composite
			data-demo-data-page={page}
			header={
				<DataViewLayout.Header
					headingLevel={1}
					title={title}
					search={
						<DataViewSearch
							value={query}
							placeholder={`搜索${title}`}
							onChange={(event) => {
								setQuery(event.target.value);
								setPageNumber(1);
							}}
							onClear={() => {
								setQuery('');
								setPageNumber(1);
							}}
						/>
					}
					actions={
						<button type='button' className='btn btn-neutral btn-sm'>
							<Plus className='size-4' />
							新建{title}
						</button>
					}
				/>
			}
			footer={
				<DataViewLayout.ResourceFooter
					page={currentPage}
					pageSize={pageSize}
					total={visibleRows.length}
					onPageChange={setPageNumber}
					onPageSizeChange={(nextPageSize) => {
						setPageSize(nextPageSize);
						setPageNumber(1);
					}}
				/>
			}
			summaryOpen={Boolean(active)}
			onSummaryClose={() => setActiveId(undefined)}
			summary={
				active ? (
					<DataViewLayout.Summary
						aria-label={`${title}概要`}
						title={active.name}
						description={description}
						tabs={[
							{ value: 'overview', label: '概要' },
							{ value: 'activity', label: '动态' },
						]}
						value={summaryTab}
						onValueChange={setSummaryTab}
						onClose={() => setActiveId(undefined)}
						footerInfo={active.updatedAt}
					>
						{summaryTab === 'overview' ? (
							<dl className='grid grid-cols-[5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs'>
								<dt className='text-base-content/55'>{active.relationLabel}</dt>
								<dd>{active.relation}</dd>
								<dt className='text-base-content/55'>{active.detailLabel}</dt>
								<dd>{active.detail}</dd>
								<dt className='text-base-content/55'>{ownerColumn}</dt>
								<dd>{active.owner}</dd>
								<dt className='text-base-content/55'>状态</dt>
								<dd>{active.status}</dd>
							</dl>
						) : (
							<div className='text-base-content/65 text-sm'>最近一次更新于 {active.updatedAt}</div>
						)}
					</DataViewLayout.Summary>
				) : undefined
			}
		>
			<DataViewLayout.Table
				aria-label={`${title}列表`}
				rows={pageRows}
				columns={columns}
				getRowId={(row) => row.id}
				getRowLabel={(row) => row.name}
				activeId={activeId}
				onActiveIdChange={setActiveId}
				empty={<div className='text-base-content/55 p-10 text-center text-sm'>没有匹配的{title}</div>}
			/>
		</DataViewLayout.Composite>
	);
}
