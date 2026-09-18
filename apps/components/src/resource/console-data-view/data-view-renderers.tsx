import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ComponentPropsWithRef, CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
	DataViewTable as FlatDataViewTable,
	type DataViewTableProps as FlatDataViewTableProps,
} from './console-data-view';

export type DataViewRowId = string | number;

export type DataViewRendererProps<Row, Id extends DataViewRowId = string> = {
	rows: readonly Row[];
	getRowId: (row: Row) => Id;
	activeId?: Id;
	selectedIds?: readonly Id[];
	onActiveIdChange?: (id: Id) => void;
	onSelectedIdsChange?: (ids: Id[]) => void;
	getRowLabel?: (row: Row) => string;
	empty?: ReactNode;
};

export type DataViewColumnAlign = 'start' | 'center' | 'end';

export type DataViewColumn<Row, ColumnId extends string = string> = {
	id: ColumnId;
	label: string;
	header?: ReactNode;
	cell: (row: Row) => ReactNode;
	width?: string;
	align?: DataViewColumnAlign;
	hideable?: boolean;
	sortable?: boolean;
	headerClassName?: string;
	cellClassName?: string;
};

export type DataViewSortState<ColumnId extends string = string> = {
	columnId: ColumnId;
	direction: 'asc' | 'desc';
};

type DataViewModeledTableProps<Row, Id extends DataViewRowId, ColumnId extends string> = Omit<
	ComponentPropsWithRef<'table'>,
	'children'
> &
	DataViewRendererProps<Row, Id> & {
		columns: readonly DataViewColumn<Row, ColumnId>[];
		visibleColumnIds?: readonly ColumnId[];
		sort?: DataViewSortState<ColumnId>;
		onSortChange?: (sort: DataViewSortState<ColumnId>) => void;
		containerClassName?: string;
		rowClassName?: (row: Row) => string | undefined;
		selectLabel?: string;
	};

export type DataViewTableViewProps<Row = never, Id extends DataViewRowId = string, ColumnId extends string = string> =
	| FlatDataViewTableProps
	| DataViewModeledTableProps<Row, Id, ColumnId>;

export function DataViewTableView<Row, Id extends DataViewRowId = string, ColumnId extends string = string>(
	props: DataViewTableViewProps<Row, Id, ColumnId>,
) {
	if (!('rows' in props) || !('columns' in props)) return <FlatDataViewTable {...props} />;
	const {
		rows,
		columns,
		getRowId,
		activeId,
		selectedIds = [],
		onActiveIdChange,
		onSelectedIdsChange,
		getRowLabel,
		empty,
		visibleColumnIds,
		sort,
		onSortChange,
		containerClassName,
		rowClassName,
		selectLabel = '选择',
		className,
		...tableProps
	} = props;
	const visible = getVisibleColumns(columns, visibleColumnIds);
	const selected = new Set(selectedIds);
	return (
		<div data-slot='data-view-table' className={cn('min-h-full min-w-max', containerClassName)}>
			<table className={cn('w-full min-w-max border-collapse text-left text-sm', className)} {...tableProps}>
				<colgroup>
					{onSelectedIdsChange ? <col className='w-10' /> : null}
					{visible.map((column) => (
						<col key={column.id} style={column.width ? { width: column.width } : undefined} />
					))}
				</colgroup>
				<thead className='bg-base-200 text-base-content/60 sticky top-0 z-10 text-xs'>
					<tr className='border-base-300 border-b'>
						{onSelectedIdsChange ? (
							<th className='px-3 py-2'>
								<span className='sr-only'>{selectLabel}</span>
							</th>
						) : null}
						{visible.map((column) => (
							<th
								key={column.id}
								aria-sort={getAriaSort(column.id, sort)}
								className={cn('px-3 py-2 font-medium', alignmentClass[column.align ?? 'start'], column.headerClassName)}
							>
								{column.sortable && onSortChange ? (
									<button
										type='button'
										className='hover:text-base-content inline-flex items-center gap-1'
										onClick={() => onSortChange(getNextSort(column.id, sort))}
									>
										{column.header ?? column.label}
										{sort?.columnId === column.id ? (
											sort.direction === 'asc' ? (
												<ArrowUp className='size-3' />
											) : (
												<ArrowDown className='size-3' />
											)
										) : null}
									</button>
								) : (
									(column.header ?? column.label)
								)}
							</th>
						))}
					</tr>
				</thead>
				<tbody className='divide-base-300 divide-y'>
					{rows.map((row) => {
						const id = getRowId(row);
						const active = activeId === id;
						return (
							<tr
								key={id}
								data-active={active || undefined}
								tabIndex={onActiveIdChange ? 0 : undefined}
								aria-label={getRowLabel?.(row)}
								className={cn(
									'hover:bg-base-200/45 data-[active=true]:bg-primary/10 outline-none',
									onActiveIdChange &&
										'focus-visible:ring-primary cursor-pointer focus-visible:ring-2 focus-visible:ring-inset',
									rowClassName?.(row),
								)}
								onClick={(event) => activateFromEvent(event, id, onActiveIdChange)}
								onKeyDown={(event) => activateFromKeyboard(event, id, onActiveIdChange)}
							>
								{onSelectedIdsChange ? (
									<td className='px-3 py-2'>
										<input
											type='checkbox'
											aria-label={`${selectLabel} ${getRowLabel?.(row) ?? id}`}
											checked={selected.has(id)}
											onChange={(event) => onSelectedIdsChange(toggleSelectedId(selectedIds, id, event.target.checked))}
										/>
									</td>
								) : null}
								{visible.map((column) => (
									<td
										key={column.id}
										className={cn('px-3 py-2', alignmentClass[column.align ?? 'start'], column.cellClassName)}
									>
										{column.cell(row)}
									</td>
								))}
							</tr>
						);
					})}
					{rows.length === 0 && empty ? (
						<tr>
							<td colSpan={visible.length + (onSelectedIdsChange ? 1 : 0)}>{empty}</td>
						</tr>
					) : null}
				</tbody>
			</table>
		</div>
	);
}

export type DataViewListViewProps<Row, Id extends DataViewRowId = string> = ComponentPropsWithRef<'div'> &
	DataViewRendererProps<Row, Id> & {
		renderItem: (row: Row, state: { active: boolean; selected: boolean }) => ReactNode;
	};

export function DataViewListView<Row, Id extends DataViewRowId = string>({
	rows,
	getRowId,
	activeId,
	selectedIds = [],
	onActiveIdChange,
	onSelectedIdsChange,
	getRowLabel,
	empty,
	renderItem,
	className,
	...props
}: DataViewListViewProps<Row, Id>) {
	const selected = new Set(selectedIds);
	return (
		<div
			role='list'
			data-slot='data-view-list'
			data-selection-enabled={Boolean(onSelectedIdsChange) || undefined}
			className={cn('divide-base-300 min-w-0 divide-y', className)}
			{...props}
		>
			{rows.map((row) => {
				const id = getRowId(row);
				const active = activeId === id;
				return (
					<div
						key={id}
						role='listitem'
						aria-label={getRowLabel?.(row)}
						aria-current={active ? 'true' : undefined}
						tabIndex={onActiveIdChange ? 0 : undefined}
						className={cn(
							'hover:bg-base-200/45 focus-visible:ring-primary flex w-full items-center gap-2 px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset',
							active && 'bg-primary/10',
						)}
						onClick={(event) => activateFromEvent(event, id, onActiveIdChange)}
						onKeyDown={(event) => activateFromKeyboard(event, id, onActiveIdChange)}
					>
						{onSelectedIdsChange ? (
							<input
								type='checkbox'
								aria-label={`选择 ${getRowLabel?.(row) ?? id}`}
								checked={selected.has(id)}
								onChange={(event) => onSelectedIdsChange(toggleSelectedId(selectedIds, id, event.target.checked))}
							/>
						) : null}
						<div className='min-w-0 flex-1'>{renderItem(row, { active, selected: selected.has(id) })}</div>
					</div>
				);
			})}
			{rows.length === 0 ? <div role='listitem'>{empty}</div> : null}
		</div>
	);
}

export type DataViewSheetViewProps<
	Row,
	Id extends DataViewRowId = string,
	ColumnId extends string = string,
> = ComponentPropsWithRef<'div'> &
	DataViewRendererProps<Row, Id> & {
		columns: readonly DataViewColumn<Row, ColumnId>[];
		visibleColumnIds?: readonly ColumnId[];
	};

export function DataViewSheetView<Row, Id extends DataViewRowId = string, ColumnId extends string = string>({
	rows,
	columns,
	visibleColumnIds,
	getRowId,
	activeId,
	selectedIds = [],
	onActiveIdChange,
	onSelectedIdsChange,
	getRowLabel,
	empty,
	className,
	style,
	...props
}: DataViewSheetViewProps<Row, Id, ColumnId>) {
	const visible = getVisibleColumns(columns, visibleColumnIds);
	const selected = new Set(selectedIds);
	const activeInRows = activeId !== undefined && rows.some((row) => getRowId(row) === activeId);
	const gridStyle: CSSProperties = {
		gridTemplateColumns: [
			onSelectedIdsChange ? '2.5rem' : undefined,
			...visible.map((column) => column.width ?? 'minmax(10rem, 1fr)'),
		]
			.filter(Boolean)
			.join(' '),
		...style,
	};
	return (
		<div
			role='grid'
			aria-rowcount={rows.length + 1}
			aria-colcount={visible.length + (onSelectedIdsChange ? 1 : 0)}
			data-slot='data-view-sheet'
			data-selection-enabled={Boolean(onSelectedIdsChange) || undefined}
			data-selected-count={selectedIds.length || undefined}
			className={cn('min-h-full min-w-max content-start text-sm', className)}
			{...props}
		>
			<div role='row' className='bg-base-200 text-base-content/60 sticky top-0 z-10 grid' style={gridStyle}>
				{onSelectedIdsChange ? (
					<div role='columnheader' className='border-base-300 border-r border-b px-2 py-1.5'>
						<span className='sr-only'>选择</span>
					</div>
				) : null}
				{visible.map((column) => (
					<div
						key={column.id}
						role='columnheader'
						className={cn(
							'border-base-300 border-r border-b px-2 py-1.5 text-xs font-medium',
							alignmentClass[column.align ?? 'start'],
						)}
					>
						{column.header ?? column.label}
					</div>
				))}
			</div>
			{rows.map((row, index) => {
				const id = getRowId(row);
				const active = activeId === id;
				return (
					<div
						key={id}
						role='row'
						aria-selected={selected.has(id)}
						data-active={active || undefined}
						data-sheet-row=''
						tabIndex={onActiveIdChange ? (active || (!activeInRows && index === 0) ? 0 : -1) : undefined}
						aria-label={getRowLabel?.(row)}
						className={cn(
							'hover:bg-base-200/45 focus-visible:ring-primary grid outline-none focus-visible:ring-2 focus-visible:ring-inset',
							active && 'bg-primary/10',
						)}
						style={gridStyle}
						onClick={(event) => activateFromEvent(event, id, onActiveIdChange)}
						onKeyDown={(event) => handleSheetKeyDown(event, index, rows, getRowId, onActiveIdChange)}
					>
						{onSelectedIdsChange ? (
							<div role='gridcell' className='border-base-300 grid min-h-8 place-items-center border-r border-b'>
								<input
									type='checkbox'
									aria-label={`选择 ${getRowLabel?.(row) ?? id}`}
									checked={selected.has(id)}
									onChange={(event) => onSelectedIdsChange(toggleSelectedId(selectedIds, id, event.target.checked))}
								/>
							</div>
						) : null}
						{visible.map((column) => (
							<div
								key={column.id}
								role='gridcell'
								className={cn(
									'border-base-300 min-h-8 border-r border-b px-2 py-1.5',
									alignmentClass[column.align ?? 'start'],
									column.cellClassName,
								)}
							>
								{column.cell(row)}
							</div>
						))}
					</div>
				);
			})}
			{rows.length === 0 ? (
				<div role='row' className='grid' style={gridStyle}>
					<div role='gridcell' style={{ gridColumn: '1 / -1' }}>
						{empty}
					</div>
				</div>
			) : null}
		</div>
	);
}

export function getVisibleColumns<Row, ColumnId extends string>(
	columns: readonly DataViewColumn<Row, ColumnId>[],
	visibleColumnIds?: readonly ColumnId[],
) {
	if (!visibleColumnIds) return columns;
	const visible = new Set(visibleColumnIds);
	return columns.filter((column) => column.hideable === false || visible.has(column.id));
}

function getNextSort<ColumnId extends string>(
	columnId: ColumnId,
	sort?: DataViewSortState<ColumnId>,
): DataViewSortState<ColumnId> {
	return { columnId, direction: sort?.columnId === columnId && sort.direction === 'asc' ? 'desc' : 'asc' };
}

function getAriaSort<ColumnId extends string>(columnId: ColumnId, sort?: DataViewSortState<ColumnId>) {
	if (sort?.columnId !== columnId) return undefined;
	return sort.direction === 'asc' ? ('ascending' as const) : ('descending' as const);
}

function toggleSelectedId<Id extends DataViewRowId>(selectedIds: readonly Id[], id: Id, checked: boolean) {
	if (checked) return selectedIds.includes(id) ? [...selectedIds] : [...selectedIds, id];
	return selectedIds.filter((selectedId) => selectedId !== id);
}

function activateFromEvent<Id extends DataViewRowId>(
	event: MouseEvent<HTMLElement>,
	id: Id,
	onActiveIdChange?: (id: Id) => void,
) {
	if (isInteractiveTarget(event.target, event.currentTarget)) return;
	onActiveIdChange?.(id);
}

function activateFromKeyboard<Id extends DataViewRowId>(
	event: KeyboardEvent<HTMLElement>,
	id: Id,
	onActiveIdChange?: (id: Id) => void,
) {
	if (event.key !== 'Enter' && event.key !== ' ') return;
	if (isInteractiveTarget(event.target, event.currentTarget)) return;
	event.preventDefault();
	onActiveIdChange?.(id);
}

function handleSheetKeyDown<Row, Id extends DataViewRowId>(
	event: KeyboardEvent<HTMLElement>,
	index: number,
	rows: readonly Row[],
	getRowId: (row: Row) => Id,
	onActiveIdChange?: (id: Id) => void,
) {
	if (isInteractiveTarget(event.target, event.currentTarget)) return;
	if (event.key === 'Enter' || event.key === ' ') {
		activateFromKeyboard(event, getRowId(rows[index] as Row), onActiveIdChange);
		return;
	}
	const nextIndex =
		event.key === 'ArrowDown'
			? Math.min(rows.length - 1, index + 1)
			: event.key === 'ArrowUp'
				? Math.max(0, index - 1)
				: event.key === 'Home'
					? 0
					: event.key === 'End'
						? rows.length - 1
						: undefined;
	if (nextIndex === undefined || nextIndex === index) return;
	event.preventDefault();
	const elements = event.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[data-sheet-row]');
	elements?.[nextIndex]?.focus();
	onActiveIdChange?.(getRowId(rows[nextIndex] as Row));
}

function isInteractiveTarget(target: EventTarget | null, boundary: Element) {
	if (!(target instanceof Element) || target === boundary) return false;
	const interactive = target.closest(
		'button, a, input, select, textarea, label, [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="checkbox"], [role="radio"], [role="switch"], [role="slider"], [role="spinbutton"], [role="combobox"], [role="textbox"], [role="option"], [role="tab"]',
	);
	return Boolean(interactive && interactive !== boundary && boundary.contains(interactive));
}

const alignmentClass = { start: 'text-left', center: 'text-center', end: 'text-right' } as const;
