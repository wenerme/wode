import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Dot, Grid2X2, List, Search, X } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { DataViewViewSwitcher } from './data-view-controls';

export type DataViewSearchProps = ComponentPropsWithRef<'input'> & {
	containerClassName?: string;
	onClear?: () => void;
};

export function DataViewSearch({
	containerClassName,
	className,
	value,
	onClear,
	'aria-label': ariaLabel,
	...props
}: DataViewSearchProps) {
	const hasValue = typeof value === 'string' ? value.length > 0 : typeof value === 'number';
	return (
		<label
			className={cn(
				'border-base-300 bg-base-100 focus-within:border-primary focus-within:ring-primary/30 flex h-[var(--console-control-height)] min-w-48 flex-1 items-center gap-2 rounded-md border px-2 focus-within:ring-1 sm:max-w-80',
				containerClassName,
			)}
		>
			<Search className='text-base-content/40 size-4 shrink-0' />
			<input
				aria-label={ariaLabel ?? '搜索'}
				value={value}
				className={cn('placeholder:text-base-content/35 min-w-0 flex-1 bg-transparent text-sm outline-none', className)}
				{...props}
			/>
			{hasValue && onClear ? (
				<button
					type='button'
					aria-label='清除搜索'
					title='清除搜索'
					className='hover:bg-base-200 grid size-6 place-items-center rounded'
					onClick={onClear}
				>
					<X className='size-3.5' />
				</button>
			) : null}
		</label>
	);
}

export type DataViewMode = 'table' | 'grid';
export type DataViewModeToggleProps = Omit<ComponentPropsWithRef<'div'>, 'onChange'> & {
	value: DataViewMode;
	onValueChange: (value: DataViewMode) => void;
};

export function DataViewModeToggle({ value, onValueChange, className, ...props }: DataViewModeToggleProps) {
	return (
		<DataViewViewSwitcher
			value={value}
			options={[
				{ value: 'table', label: '表格视图', icon: <List className='size-4' /> },
				{ value: 'grid', label: '网格视图', icon: <Grid2X2 className='size-4' /> },
			]}
			onValueChange={onValueChange}
			className={className}
			{...props}
		/>
	);
}

export type DataViewTableProps = ComponentPropsWithRef<'table'> & { containerClassName?: string };
export function DataViewTable({ containerClassName, className, ...props }: DataViewTableProps) {
	return (
		<div className={cn('h-full min-w-0 overflow-auto', containerClassName)}>
			<table className={cn('w-full min-w-[42rem] border-collapse text-left text-sm', className)} {...props} />
		</div>
	);
}

export type DataViewGridProps = ComponentPropsWithRef<'div'>;
export function DataViewGrid({ className, ...props }: DataViewGridProps) {
	return <div className={cn('grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3', className)} {...props} />;
}

export type DataViewListItemProps = Omit<ComponentPropsWithRef<'button'>, 'title'> & {
	selected?: boolean;
	icon?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	meta?: ReactNode;
	trailing?: ReactNode;
};
export function DataViewListItem({
	selected,
	icon,
	title,
	description,
	meta,
	trailing,
	className,
	...props
}: DataViewListItemProps) {
	return (
		<button
			type='button'
			aria-pressed={selected}
			className={cn(
				'border-base-300 bg-base-100 hover:border-primary/45 hover:bg-base-200/50 focus-visible:ring-primary flex min-h-28 w-full items-start gap-3 rounded-md border p-3 text-left outline-none focus-visible:ring-2',
				selected && 'border-primary bg-primary/10',
				className,
			)}
			{...props}
		>
			{icon ? (
				<span className='bg-base-200 text-base-content/60 grid size-8 shrink-0 place-items-center rounded-md'>
					{icon}
				</span>
			) : null}
			<span className='min-w-0 flex-1'>
				<span className='flex items-start gap-2'>
					<span className='min-w-0 flex-1 truncate text-sm font-medium'>{title}</span>
					{trailing}
				</span>
				{description ? (
					<span className='text-base-content/65 mt-1 line-clamp-2 block text-xs leading-5'>{description}</span>
				) : null}
				{meta ? <span className='text-base-content/65 mt-3 block text-xs'>{meta}</span> : null}
			</span>
		</button>
	);
}

export type DataViewPaginationProps = Omit<ComponentPropsWithRef<'nav'>, 'onChange'> & {
	page: number;
	pageCount: number;
	onPageChange: (page: number) => void;
};
export function DataViewPagination({ page, pageCount, onPageChange, className, ...props }: DataViewPaginationProps) {
	const safePageCount = Number.isFinite(pageCount) ? Math.max(1, Math.trunc(pageCount)) : 1;
	const safePage = Number.isFinite(page) ? Math.min(safePageCount, Math.max(1, Math.trunc(page))) : 1;
	const commitInput = (input: HTMLInputElement) => {
		const nextPage = Math.min(safePageCount, Math.max(1, Math.trunc(Number(input.value)) || 1));
		input.value = String(nextPage);
		onPageChange(nextPage);
	};
	return (
		<nav aria-label='分页' className={cn('flex items-center gap-1', className)} {...props}>
			<PageButton label='第一页' disabled={safePage <= 1} onClick={() => onPageChange(1)}>
				<ChevronsLeft className='size-3.5' />
			</PageButton>
			<PageButton label='上一页' disabled={safePage <= 1} onClick={() => onPageChange(Math.max(1, safePage - 1))}>
				<ChevronLeft className='size-3.5' />
			</PageButton>
			<input
				key={`${safePage}:${safePageCount}`}
				type='text'
				inputMode='numeric'
				aria-label='页码'
				title={`页码，共 ${safePageCount} 页`}
				defaultValue={safePage}
				className='input input-xs w-[5ch] text-center tabular-nums'
				onBlur={(event) => commitInput(event.currentTarget)}
				onKeyDown={(event) => {
					if (event.key === 'Enter') commitInput(event.currentTarget);
				}}
			/>
			<PageButton
				label='下一页'
				disabled={safePage >= safePageCount}
				onClick={() => onPageChange(Math.min(safePageCount, safePage + 1))}
			>
				<ChevronRight className='size-3.5' />
			</PageButton>
			<PageButton label='最后一页' disabled={safePage >= safePageCount} onClick={() => onPageChange(safePageCount)}>
				<ChevronsRight className='size-3.5' />
			</PageButton>
		</nav>
	);
}

export type DataViewPageInfoProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
	from: number;
	to: number;
	total: number;
	pageSize: number;
	pageSizeOptions?: readonly number[];
	onPageSizeChange?: (pageSize: number) => void;
	totalLabel?: string;
	pageSizeLabel?: string;
};
export function DataViewPageInfo({
	from,
	to,
	total,
	pageSize,
	pageSizeOptions = [20, 50, 100],
	onPageSizeChange,
	totalLabel = '总数',
	pageSizeLabel = '每页数量',
	className,
	...props
}: DataViewPageInfoProps) {
	const safePageSize = Number.isFinite(pageSize) ? Math.max(1, Math.trunc(pageSize)) : 1;
	const normalizedOptions = Array.from(
		new Set([
			safePageSize,
			...pageSizeOptions.map((option) => (Number.isFinite(option) ? Math.max(1, Math.trunc(option)) : 1)),
		]),
	).toSorted((left, right) => left - right);
	return (
		<div className={cn('text-base-content/65 flex items-center text-sm font-light tabular-nums', className)} {...props}>
			<span aria-label={`第 ${from} 至 ${to} 条`}>
				{from}-{to}
			</span>
			<Dot aria-hidden='true' className='size-4 shrink-0' />
			<span>
				{totalLabel} {total}
			</span>
			<Dot aria-hidden='true' className='size-4 shrink-0' />
			{onPageSizeChange ? (
				<label className='flex items-center' title={pageSizeLabel}>
					<span className='sr-only'>{pageSizeLabel}</span>
					<select
						aria-label={pageSizeLabel}
						value={safePageSize}
						className='hover:bg-base-200 rounded bg-transparent px-1 py-0.5 text-sm font-light outline-none'
						onChange={(event) => onPageSizeChange(Number(event.target.value))}
					>
						{normalizedOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				</label>
			) : (
				<span title={pageSizeLabel} className='px-1'>
					{safePageSize}
				</span>
			)}
		</div>
	);
}

export type DataViewEmptyProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
	icon?: ReactNode;
	title?: ReactNode;
	description?: ReactNode;
	action?: ReactNode;
};
export function DataViewEmpty({
	icon,
	title = '没有数据',
	description,
	action,
	className,
	...props
}: DataViewEmptyProps) {
	return (
		<div className={cn('grid min-h-72 place-items-center p-6 text-center', className)} {...props}>
			<div className='max-w-sm'>
				{icon ? <div className='text-base-content/40 mx-auto mb-3 grid size-10 place-items-center'>{icon}</div> : null}
				<div className='text-sm font-medium'>{title}</div>
				{description ? <div className='text-base-content/65 mt-1 text-sm leading-6'>{description}</div> : null}
				{action ? <div className='mt-4'>{action}</div> : null}
			</div>
		</div>
	);
}

export type DataViewSelectionBarProps = ComponentPropsWithRef<'div'> & { count: number; actions?: ReactNode };
export function DataViewSelectionBar({ count, actions, children, className, ...props }: DataViewSelectionBarProps) {
	return (
		<div
			className={cn('border-primary/25 bg-primary/8 flex items-center gap-2 border px-3 py-2 text-xs', className)}
			{...props}
		>
			<span className='font-medium'>已选择 {count} 项</span>
			{children}
			<div className='flex-1' />
			{actions}
		</div>
	);
}

function PageButton({
	label,
	disabled,
	onClick,
	children,
}: {
	label: string;
	disabled: boolean;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type='button'
			aria-label={label}
			title={label}
			disabled={disabled}
			className='hover:bg-base-200 grid size-7 place-items-center rounded disabled:cursor-not-allowed disabled:opacity-35'
			onClick={onClick}
		>
			{children}
		</button>
	);
}
