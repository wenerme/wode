import { Download, LayoutList, Plus, RefreshCw, Sheet, Table2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { type DataViewColumn, DataViewLayout, type DataViewSortState } from '@/resource/console-data-view';
import { Status } from '@/ui/status';
import { type DemoRecord, demoRecords } from './resource-fixtures';

type ResourceView = 'table' | 'list' | 'sheet';
type ResourceSort = 'name-asc' | 'owner-asc' | 'source-order';
type ResourceColumnId = 'name' | 'type' | 'status' | 'owner' | 'region' | 'updated';
type SummaryTab = 'overview' | 'metadata';

const columns: readonly DataViewColumn<DemoRecord, ResourceColumnId>[] = [
	{
		id: 'name',
		label: '名称',
		hideable: false,
		sortable: true,
		width: '15rem',
		cell: (row) => <span className='font-medium'>{row.name}</span>,
	},
	{ id: 'type', label: '类型', width: '10rem', cell: (row) => row.type },
	{ id: 'status', label: '状态', width: '7rem', cell: (row) => <ResourceStatus status={row.status} /> },
	{ id: 'owner', label: '负责人', sortable: true, width: '8rem', cell: (row) => row.owner },
	{ id: 'region', label: '区域', width: '9rem', cell: (row) => row.region },
	{
		id: 'updated',
		label: '更新时间',
		width: '8rem',
		cell: (row) => <span className='text-base-content/55 text-xs'>{row.updatedAt}</span>,
	},
];

const viewOptions = [
	{ value: 'table', label: '表格视图', icon: <Table2 className='size-4' /> },
	{ value: 'list', label: '列表视图', icon: <LayoutList className='size-4' /> },
	{ value: 'sheet', label: '工作表视图', icon: <Sheet className='size-4' /> },
] as const;

export function DataViewResourceWorkspaceDemo() {
	const [query, setQuery] = useState('');
	const [sortValue, setSortValue] = useState<ResourceSort>('source-order');
	const [columnSort, setColumnSort] = useState<DataViewSortState<ResourceColumnId>>();
	const [abnormalOnly, setAbnormalOnly] = useState(false);
	const [mode, setMode] = useState<ResourceView>('table');
	const [visibleColumnIds, setVisibleColumnIds] = useState<ResourceColumnId[]>(columns.map((column) => column.id));
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [activeId, setActiveId] = useState<string>();
	const [summaryTab, setSummaryTab] = useState<SummaryTab>('overview');
	const [statusText, setStatusText] = useState('已同步');
	const [pageNumber, setPageNumber] = useState(1);
	const [pageSize, setPageSize] = useState(20);

	const rows = useMemo(() => {
		const normalized = query.trim().toLocaleLowerCase();
		const filtered = demoRecords.filter((record) => {
			if (abnormalOnly && record.status === 'healthy') return false;
			return (
				!normalized ||
				`${record.name} ${record.type} ${record.owner} ${record.region}`.toLocaleLowerCase().includes(normalized)
			);
		});
		return filtered.toSorted((left, right) => compareRecords(left, right, columnSort, sortValue));
	}, [abnormalOnly, columnSort, query, sortValue]);
	const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
	const currentPage = Math.min(pageNumber, pageCount);
	const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

	const active = activeId ? demoRecords.find((record) => record.id === activeId) : undefined;
	const columnOptions = columns.map((column) => ({ id: column.id, label: column.label, hideable: column.hideable }));
	const commonRendererProps = {
		rows: pageRows,
		getRowId: (row: DemoRecord) => row.id,
		getRowLabel: (row: DemoRecord) => row.name,
		activeId,
		selectedIds,
		onActiveIdChange: setActiveId,
		onSelectedIdsChange: setSelectedIds,
		empty: <div className='text-base-content/55 p-10 text-center text-sm'>没有匹配的资源</div>,
	};

	return (
		<DataViewLayout.Composite
			aria-label='资源工作区'
			header={
				<DataViewLayout.Header
					title='资源'
					search={
						<DataViewLayout.Search
							value={query}
							placeholder='搜索资源'
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
					sort={
						<DataViewLayout.Sort
							value={sortValue}
							options={[
								{ value: 'source-order', label: '默认顺序' },
								{ value: 'name-asc', label: '名称升序' },
								{ value: 'owner-asc', label: '负责人' },
							]}
							onValueChange={(value) => {
								setSortValue(value);
								setColumnSort(undefined);
							}}
						/>
					}
					filter={
						<DataViewLayout.Filter
							activeCount={abnormalOnly ? 1 : 0}
							onClick={() => {
								setAbnormalOnly((value) => !value);
								setPageNumber(1);
							}}
						>
							异常
						</DataViewLayout.Filter>
					}
					view={<DataViewLayout.ViewSwitcher value={mode} options={viewOptions} onValueChange={setMode} />}
					actions={
						<>
							<button
								type='button'
								aria-label='刷新资源'
								title='刷新资源'
								className='hover:bg-base-200 grid size-[var(--console-control-height)] place-items-center rounded-md'
								onClick={() => setStatusText('刚刚同步')}
							>
								<RefreshCw className='size-4' />
							</button>
							<button type='button' className='btn btn-neutral btn-sm' onClick={() => setStatusText('新建命令已触发')}>
								<Plus className='size-4' />
								新建资源
							</button>
						</>
					}
					menu={
						<>
							{mode === 'table' ? (
								<DataViewLayout.ColumnControl
									columns={columnOptions}
									visibleColumnIds={visibleColumnIds}
									onVisibleColumnIdsChange={(ids) => {
										setVisibleColumnIds(ids);
										if (columnSort && !ids.includes(columnSort.columnId)) setColumnSort(undefined);
									}}
								/>
							) : null}
							<DataViewLayout.Menu
								items={[
									{
										id: 'export',
										label: '导出当前视图',
										icon: <Download className='size-4' />,
										onSelect: () => setStatusText('导出已准备'),
									},
								]}
							/>
						</>
					}
				/>
			}
			toolbar={
				selectedIds.length ? (
					<div className='border-primary/25 bg-primary/8 flex min-h-10 items-center gap-2 border-b px-3 text-xs'>
						已选择 {selectedIds.length} 项
						<button type='button' className='btn btn-ghost btn-xs ml-auto' onClick={() => setSelectedIds([])}>
							清除选择
						</button>
					</div>
				) : undefined
			}
			footer={
				<DataViewLayout.ResourceFooter
					page={currentPage}
					pageSize={pageSize}
					total={rows.length}
					onPageChange={setPageNumber}
					onPageSizeChange={(nextPageSize) => {
						setPageSize(nextPageSize);
						setPageNumber(1);
					}}
					status={
						<Status tone='success' size='xs'>
							{statusText}
						</Status>
					}
				/>
			}
			summaryOpen={Boolean(active)}
			onSummaryClose={() => setActiveId(undefined)}
			summary={
				active ? (
					<DataViewLayout.Summary
						aria-label='资源概要'
						title={active.name}
						status={<ResourceStatus status={active.status} />}
						description={`${active.type} · ${active.region}`}
						tabs={[
							{ value: 'overview', label: '概要' },
							{ value: 'metadata', label: '元数据' },
						]}
						value={summaryTab}
						onValueChange={setSummaryTab}
						onClose={() => setActiveId(undefined)}
						footerInfo={active.updatedAt}
						footerActions={
							<button type='button' className='btn btn-ghost btn-xs'>
								打开详情
							</button>
						}
					>
						<ResourceSummary record={active} tab={summaryTab} />
					</DataViewLayout.Summary>
				) : undefined
			}
		>
			{mode === 'table' ? (
				<DataViewLayout.Table
					{...commonRendererProps}
					aria-label='资源表格'
					columns={columns}
					visibleColumnIds={visibleColumnIds}
					sort={columnSort}
					onSortChange={(sort) => {
						setColumnSort(sort);
						setSortValue('source-order');
					}}
				/>
			) : null}
			{mode === 'list' ? (
				<DataViewLayout.List
					{...commonRendererProps}
					renderItem={(row, state) => (
						<div className='flex items-center gap-3'>
							<ResourceStatus status={row.status} />
							<div className='min-w-0 flex-1'>
								<div className='truncate text-sm font-medium'>{row.name}</div>
								<div className='text-base-content/55 mt-0.5 text-xs'>
									{row.type} · {row.region}
								</div>
							</div>
							<span className='text-base-content/55 text-xs'>
								{state.selected ? '已选择 · ' : ''}
								{row.owner}
							</span>
						</div>
					)}
				/>
			) : null}
			{mode === 'sheet' ? (
				<DataViewLayout.Sheet {...commonRendererProps} columns={columns} visibleColumnIds={visibleColumnIds} />
			) : null}
		</DataViewLayout.Composite>
	);
}

function ResourceSummary({ record, tab }: { record: DemoRecord; tab: SummaryTab }) {
	if (tab === 'metadata') {
		return (
			<dl className='grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs'>
				<dt className='text-base-content/55'>资源 ID</dt>
				<dd className='font-mono'>{record.id}</dd>
				<dt className='text-base-content/55'>更新时间</dt>
				<dd>{record.updatedAt}</dd>
			</dl>
		);
	}
	return (
		<dl className='grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs'>
			<dt className='text-base-content/55'>类型</dt>
			<dd>{record.type}</dd>
			<dt className='text-base-content/55'>负责人</dt>
			<dd>{record.owner}</dd>
			<dt className='text-base-content/55'>区域</dt>
			<dd>{record.region}</dd>
		</dl>
	);
}

function ResourceStatus({ status }: { status: DemoRecord['status'] }) {
	const value = { healthy: ['success', '正常'], warning: ['warning', '警告'], offline: ['danger', '离线'] } as const;
	return (
		<Status tone={value[status][0]} size='xs'>
			{value[status][1]}
		</Status>
	);
}

function compareRecords(
	left: DemoRecord,
	right: DemoRecord,
	columnSort: DataViewSortState<ResourceColumnId> | undefined,
	sortValue: ResourceSort,
) {
	if (columnSort) {
		const direction = columnSort.direction === 'asc' ? 1 : -1;
		return (
			String(left[columnSort.columnId === 'updated' ? 'updatedAt' : columnSort.columnId]).localeCompare(
				String(right[columnSort.columnId === 'updated' ? 'updatedAt' : columnSort.columnId]),
				'zh-CN',
			) * direction
		);
	}
	if (sortValue === 'name-asc') return left.name.localeCompare(right.name, 'zh-CN');
	if (sortValue === 'owner-asc') return left.owner.localeCompare(right.owner, 'zh-CN');
	return demoRecords.indexOf(left) - demoRecords.indexOf(right);
}
