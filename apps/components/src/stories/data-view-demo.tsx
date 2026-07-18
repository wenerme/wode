'use client';

import { MoreHorizontal, Plus, RefreshCw, SearchX, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
	DataView,
	DataViewDetail,
	DataViewEmpty,
	DataViewFooter,
	DataViewGrid,
	DataViewHeader,
	DataViewListItem,
	type DataViewMode,
	DataViewModeToggle,
	DataViewPagination,
	DataViewSearch,
	DataViewSelectionBar,
	DataViewTable,
	DataViewToolbar,
} from '../../registry/default/blocks/console-data-view';
import { Status } from '../../registry/default/ui/status';
import { cn } from '../lib/utils';
import { type DemoRecord, demoRecords, resourceTypeIcons } from './console-fixtures';

export type ConsoleDataViewDemoProps = {
	embedded?: boolean;
	records?: DemoRecord[];
	pageSize?: number;
};

const defaultPageSize = 4;

export function ConsoleDataViewDemo({
	embedded,
	records = demoRecords,
	pageSize = defaultPageSize,
}: ConsoleDataViewDemoProps) {
	const safePageSize = Math.max(1, Math.floor(pageSize));
	const [search, setSearch] = useState('');
	const [type, setType] = useState('all');
	const [mode, setMode] = useState<DataViewMode>('table');
	const [page, setPage] = useState(1);
	const [selectedId, setSelectedId] = useState(records[0]?.id ?? '');
	const [checked, setChecked] = useState<string[]>([]);

	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase();
		return records.filter((record) => {
			const matchesType = type === 'all' || record.type === type;
			const matchesSearch = !query || `${record.name} ${record.owner} ${record.region}`.toLowerCase().includes(query);
			return matchesType && matchesSearch;
		});
	}, [records, search, type]);
	useEffect(() => {
		const first = filtered[0];
		if (first && !filtered.some((record) => record.id === selectedId)) setSelectedId(first.id);
		if (!first && selectedId) setSelectedId('');
	}, [filtered, selectedId]);

	const pageCount = Math.max(1, Math.ceil(filtered.length / safePageSize));
	const currentPage = Math.min(page, pageCount);
	const visible = filtered.slice((currentPage - 1) * safePageSize, currentPage * safePageSize);
	const selected = filtered.find((record) => record.id === selectedId) ?? filtered[0];

	const setFilterType = (next: string) => {
		setType(next);
		setPage(1);
	};
	const setSearchValue = (next: string) => {
		setSearch(next);
		setPage(1);
	};
	const toggleChecked = (id: string) => {
		setChecked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
	};
	const Root = embedded ? 'div' : 'main';

	return (
		<Root aria-label={embedded ? undefined : 'Console data view'} className={embedded ? undefined : 'p-3 md:p-5'}>
			{embedded ? null : <h1 className='sr-only'>Console data view</h1>}
			<DataView
				className={cn(embedded ? 'min-h-[36rem]' : 'h-[min(46rem,calc(100vh-2.5rem))]')}
				header={
					<DataViewHeader
						title='服务资源'
						description={`跨环境数据源与基础服务 · ${records.length} 条记录`}
						status={<Status tone='success'>已同步</Status>}
						actions={
							<>
								<button
									type='button'
									aria-label='刷新'
									title='刷新'
									className='hover:bg-base-200 grid size-8 place-items-center rounded-md'
								>
									<RefreshCw className='size-4' />
								</button>
								<button
									type='button'
									className='bg-neutral text-neutral-content inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium'
								>
									<Plus className='size-4' />
									添加资源
								</button>
							</>
						}
					/>
				}
				toolbar={
					<>
						<DataViewToolbar>
							<DataViewSearch
								value={search}
								placeholder='搜索名称、负责人或区域'
								onChange={(event) => setSearchValue(event.target.value)}
								onClear={() => setSearchValue('')}
							/>
							<select
								aria-label='资源类型'
								className='border-base-300 bg-base-100 focus:border-primary h-[var(--console-control-height)] rounded-md border px-2 text-xs outline-none'
								value={type}
								onChange={(event) => setFilterType(event.target.value)}
							>
								<option value='all'>全部类型</option>
								<option value='PostgreSQL'>PostgreSQL</option>
								<option value='Redis'>Redis</option>
								<option value='Object Storage'>Object Storage</option>
								<option value='Message Queue'>Message Queue</option>
							</select>
							<div className='flex-1' />
							<DataViewModeToggle value={mode} onValueChange={setMode} />
						</DataViewToolbar>
						{checked.length > 0 ? (
							<DataViewSelectionBar
								count={checked.length}
								actions={
									<button
										type='button'
										className='text-error inline-flex items-center gap-1 hover:underline'
										onClick={() => setChecked([])}
									>
										<Trash2 className='size-3.5' /> 清除选择
									</button>
								}
							/>
						) : null}
					</>
				}
				detail={selected ? <ResourceDetail record={selected} /> : undefined}
				footer={
					<DataViewFooter
						info={`显示 ${visible.length} / ${filtered.length} 个资源`}
						pagination={<DataViewPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />}
					/>
				}
			>
				{visible.length === 0 ? (
					<DataViewEmpty
						icon={<SearchX className='size-6' />}
						title='没有匹配的资源'
						description='调整搜索词或资源类型后重试。'
						action={
							<button
								type='button'
								className='bg-neutral text-neutral-content h-8 rounded-md px-3 text-xs font-medium'
								onClick={() => {
									setSearchValue('');
									setFilterType('all');
								}}
							>
								清除筛选
							</button>
						}
					/>
				) : mode === 'table' ? (
					<DataViewTable>
						<thead className='bg-base-200 text-base-content/65 sticky top-0 z-10 text-xs'>
							<tr className='border-base-300 border-b'>
								<th className='w-10 px-3 py-2 font-medium'>
									<span className='sr-only'>选择</span>
								</th>
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
							{visible.map((record) => (
								<tr key={record.id} className={cn('hover:bg-base-200/45', selectedId === record.id && 'bg-primary/10')}>
									<td className='px-3 py-2.5'>
										<input
											type='checkbox'
											aria-label={`选择 ${record.name}`}
											className='checkbox checkbox-sm'
											checked={checked.includes(record.id)}
											onChange={() => toggleChecked(record.id)}
										/>
									</td>
									<td className='px-3 py-2.5'>
										<button
											type='button'
											className='hover:text-primary font-medium'
											onClick={() => setSelectedId(record.id)}
										>
											{record.name}
										</button>
									</td>
									<td className='text-base-content/65 px-3 py-2.5'>{record.type}</td>
									<td className='px-3 py-2.5'>
										<ResourceStatus status={record.status} />
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
					<DataViewGrid>
						{visible.map((record) => {
							const Icon = resourceTypeIcons[record.type];
							return (
								<DataViewListItem
									key={record.id}
									selected={selectedId === record.id}
									icon={<Icon className='size-4' />}
									title={record.name}
									description={`${record.type} · ${record.region}`}
									meta={`${record.owner} · ${record.updatedAt}`}
									trailing={<ResourceStatus status={record.status} />}
									onClick={() => setSelectedId(record.id)}
								/>
							);
						})}
					</DataViewGrid>
				)}
			</DataView>
		</Root>
	);
}

function ResourceDetail({ record }: { record: DemoRecord }) {
	const Icon = resourceTypeIcons[record.type];
	return (
		<DataViewDetail
			title={record.name}
			description={record.id}
			actions={
				<button
					type='button'
					aria-label='详情操作'
					title='详情操作'
					className='hover:bg-base-200 grid size-7 place-items-center rounded'
				>
					<MoreHorizontal className='size-4' />
				</button>
			}
		>
			<div className='border-base-300 flex items-center gap-3 border-b pb-3'>
				<span className='bg-primary/10 text-primary grid size-10 place-items-center rounded-md'>
					<Icon className='size-5' />
				</span>
				<div>
					<div className='text-sm font-medium'>{record.type}</div>
					<ResourceStatus status={record.status} />
				</div>
			</div>
			<dl className='divide-base-300 mt-3 divide-y text-xs'>
				{[
					['负责人', record.owner],
					['区域', record.region],
					['最近更新', record.updatedAt],
					['连接策略', 'Private network'],
				].map(([label, value]) => (
					<div key={label} className='grid grid-cols-[5rem_minmax(0,1fr)] gap-2 py-2.5'>
						<dt className='text-base-content/65'>{label}</dt>
						<dd className='font-medium break-words'>{value}</dd>
					</div>
				))}
			</dl>
		</DataViewDetail>
	);
}

function ResourceStatus({ status }: { status: DemoRecord['status'] }) {
	const config = {
		healthy: ['正常', 'success'],
		warning: ['警告', 'warning'],
		offline: ['离线', 'danger'],
	} as const;
	const [label, tone] = config[status];
	return (
		<Status tone={tone} variant='soft' dot>
			{label}
		</Status>
	);
}
