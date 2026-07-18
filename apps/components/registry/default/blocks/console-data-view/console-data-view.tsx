import { ChevronLeft, ChevronRight, Grid2X2, List, Maximize2, Search, X } from 'lucide-react';
import type { ComponentPropsWithRef, CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DataViewSidePanelLayoutStyle = CSSProperties & {
	'--data-view-summary-width'?: string;
	'--data-view-details-width'?: string;
};

export type DataViewProps = ComponentPropsWithRef<'section'> & {
	header?: ReactNode;
	toolbar?: ReactNode;
	footer?: ReactNode;
	detail?: ReactNode;
};

export function DataView({ header, toolbar, footer, detail, children, className, ...props }: DataViewProps) {
	return (
		<section
			data-console-density=''
			className={cn(
				'border-base-300 bg-base-100 flex min-h-[28rem] min-w-0 flex-col overflow-hidden border',
				className,
			)}
			{...props}
		>
			{header}
			{toolbar}
			<div className={cn('grid min-h-0 min-w-0 flex-1', detail && 'lg:grid-cols-[minmax(0,1fr)_20rem]')}>
				<div className='min-h-0 min-w-0 overflow-auto'>{children}</div>
				{detail ? (
					<div className='border-base-300 min-h-0 overflow-auto border-t lg:border-t-0 lg:border-l'>{detail}</div>
				) : null}
			</div>
			{footer}
		</section>
	);
}

export type DataViewHeaderProps = Omit<ComponentPropsWithRef<'header'>, 'title'> & {
	title?: ReactNode;
	description?: ReactNode;
	status?: ReactNode;
	actions?: ReactNode;
};

export function DataViewHeader({
	title,
	description,
	status,
	actions,
	children,
	className,
	...props
}: DataViewHeaderProps) {
	return (
		<header
			className={cn('border-base-300 flex flex-wrap items-start gap-3 border-b px-3 py-3 md:px-4', className)}
			{...props}
		>
			<div className='min-w-0 flex-1'>
				<div className='flex flex-wrap items-center gap-2'>
					{title ? <h2 className='text-sm font-semibold'>{title}</h2> : null}
					{status}
				</div>
				{description ? <div className='text-base-content/65 mt-0.5 text-xs'>{description}</div> : null}
			</div>
			{children}
			{actions ? <div className='flex shrink-0 items-center gap-1'>{actions}</div> : null}
		</header>
	);
}

export type DataViewToolbarProps = ComponentPropsWithRef<'div'>;

export function DataViewToolbar({ className, ...props }: DataViewToolbarProps) {
	return (
		<div
			className={cn(
				'border-base-300 bg-base-200/45 flex min-h-12 flex-wrap items-center gap-2 border-b px-3 py-2',
				className,
			)}
			{...props}
		/>
	);
}

export type DataViewViewHeaderProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
	title?: ReactNode;
	description?: ReactNode;
	meta?: ReactNode;
	controls?: ReactNode;
	actions?: ReactNode;
};

export function DataViewViewHeader({
	title,
	description,
	meta,
	controls,
	actions,
	children,
	className,
	...props
}: DataViewViewHeaderProps) {
	return (
		<div
			className={cn(
				'border-base-300 bg-base-100 flex flex-col gap-3 border-b px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center',
				className,
			)}
			{...props}
		>
			<div className='min-w-0 sm:flex-1'>
				<div className='flex flex-wrap items-center gap-2'>
					{title ? <h3 className='text-sm font-semibold'>{title}</h3> : null}
					{meta ? <div className='text-base-content/55 text-xs'>{meta}</div> : null}
				</div>
				{description ? <div className='text-base-content/65 mt-0.5 text-xs'>{description}</div> : null}
			</div>
			{children}
			{controls ? <div className='flex min-w-0 flex-wrap items-center gap-2 sm:w-auto'>{controls}</div> : null}
			{actions ? <div className='flex shrink-0 flex-wrap items-center gap-1'>{actions}</div> : null}
		</div>
	);
}

export type DataViewActionBarProps = ComponentPropsWithRef<'div'> & {
	leading?: ReactNode;
	primary?: ReactNode;
	secondary?: ReactNode;
	overflow?: ReactNode;
};

export function DataViewActionBar({
	leading,
	primary,
	secondary,
	overflow,
	children,
	className,
	...props
}: DataViewActionBarProps) {
	return (
		<div
			role='toolbar'
			className={cn(
				'border-base-300 bg-base-200/35 flex min-h-11 flex-wrap items-center gap-2 border-b px-3 py-2',
				className,
			)}
			{...props}
		>
			{leading ? <div className='flex min-w-0 flex-wrap items-center gap-2'>{leading}</div> : null}
			{children}
			<div className='min-w-4 flex-1' />
			{secondary ? <div className='flex shrink-0 flex-wrap items-center gap-1'>{secondary}</div> : null}
			{primary ? <div className='flex shrink-0 flex-wrap items-center gap-1'>{primary}</div> : null}
			{overflow}
		</div>
	);
}

export type DataViewSidePanelLayoutProps = ComponentPropsWithRef<'div'> & {
	summary?: ReactNode;
	details?: ReactNode;
	summaryOpen?: boolean;
	detailsOpen?: boolean;
	summaryWidth?: string;
	detailsWidth?: string;
	mainClassName?: string;
	summaryClassName?: string;
	detailsClassName?: string;
};

export function DataViewSidePanelLayout({
	summary,
	details,
	summaryOpen = true,
	detailsOpen = true,
	summaryWidth = '20rem',
	detailsWidth = '24rem',
	mainClassName,
	summaryClassName,
	detailsClassName,
	children,
	className,
	style,
	...props
}: DataViewSidePanelLayoutProps) {
	const hasSummary = Boolean(summary && summaryOpen);
	const hasDetails = Boolean(details && detailsOpen);
	const layoutStyle: DataViewSidePanelLayoutStyle = {
		'--data-view-summary-width': summaryWidth,
		'--data-view-details-width': detailsWidth,
		...style,
	};

	return (
		<div
			className={cn(
				'grid min-h-0 min-w-0 flex-1',
				hasSummary && hasDetails
					? 'xl:grid-cols-[minmax(0,1fr)_var(--data-view-summary-width)_var(--data-view-details-width)]'
					: hasSummary
						? 'xl:grid-cols-[minmax(0,1fr)_var(--data-view-summary-width)]'
						: hasDetails
							? 'xl:grid-cols-[minmax(0,1fr)_var(--data-view-details-width)]'
							: undefined,
				className,
			)}
			style={layoutStyle}
			{...props}
		>
			<div className={cn('min-h-0 min-w-0 overflow-auto', mainClassName)}>{children}</div>
			{hasSummary ? (
				<div
					className={cn('border-base-300 min-h-0 overflow-auto border-t xl:border-t-0 xl:border-l', summaryClassName)}
				>
					{summary}
				</div>
			) : null}
			{hasDetails ? (
				<div
					className={cn('border-base-300 min-h-0 overflow-auto border-t xl:border-t-0 xl:border-l', detailsClassName)}
				>
					{details}
				</div>
			) : null}
		</div>
	);
}

export type DataViewSummaryPanelProps = Omit<ComponentPropsWithRef<'aside'>, 'title'> & {
	eyebrow?: ReactNode;
	title?: ReactNode;
	description?: ReactNode;
	status?: ReactNode;
	actions?: ReactNode;
	footer?: ReactNode;
	onClose?: () => void;
	onExpand?: () => void;
	closeLabel?: string;
	expandLabel?: string;
	contentClassName?: string;
};

export function DataViewSummaryPanel({
	eyebrow,
	title,
	description,
	status,
	actions,
	footer,
	onClose,
	onExpand,
	closeLabel = '关闭概要',
	expandLabel = '展开详情',
	contentClassName,
	children,
	className,
	'aria-label': ariaLabel,
	...props
}: DataViewSummaryPanelProps) {
	return (
		<aside
			aria-label={ariaLabel ?? '概要'}
			className={cn('bg-base-100 flex min-h-0 flex-col xl:min-h-full', className)}
			{...props}
		>
			<div className='border-base-300 border-b px-3 py-3'>
				<div className='flex items-start gap-2'>
					<div className='min-w-0 flex-1'>
						{eyebrow ? (
							<div className='text-base-content/45 mb-1 text-[11px] font-semibold uppercase'>{eyebrow}</div>
						) : null}
						<div className='flex flex-wrap items-center gap-2'>
							{title ? <h3 className='min-w-0 truncate text-sm font-semibold'>{title}</h3> : null}
							{status}
						</div>
						{description ? <div className='text-base-content/65 mt-1 text-xs leading-5'>{description}</div> : null}
					</div>
					<div className='flex shrink-0 items-center gap-1'>
						{actions}
						{onExpand ? (
							<button
								type='button'
								aria-label={expandLabel}
								title={expandLabel}
								className='hover:bg-base-200 grid size-7 place-items-center rounded'
								onClick={onExpand}
							>
								<Maximize2 className='size-3.5' />
							</button>
						) : null}
						{onClose ? (
							<button
								type='button'
								aria-label={closeLabel}
								title={closeLabel}
								className='hover:bg-base-200 grid size-7 place-items-center rounded'
								onClick={onClose}
							>
								<X className='size-4' />
							</button>
						) : null}
					</div>
				</div>
			</div>
			<div className={cn('overflow-auto p-3 xl:min-h-0 xl:flex-1', contentClassName)}>{children}</div>
			{footer ? <div className='border-base-300 border-t p-3'>{footer}</div> : null}
		</aside>
	);
}

export type DataViewDetailsPanelProps = Omit<ComponentPropsWithRef<'aside'>, 'title'> & {
	title?: ReactNode;
	description?: ReactNode;
	status?: ReactNode;
	actions?: ReactNode;
	footer?: ReactNode;
	onClose?: () => void;
	closeLabel?: string;
	contentClassName?: string;
};

export function DataViewDetailsPanel({
	title,
	description,
	status,
	actions,
	footer,
	onClose,
	closeLabel = '关闭详情',
	contentClassName,
	children,
	className,
	'aria-label': ariaLabel,
	...props
}: DataViewDetailsPanelProps) {
	return (
		<aside
			aria-label={ariaLabel ?? '展开详情'}
			className={cn('bg-base-100 flex min-h-0 flex-col xl:min-h-full', className)}
			{...props}
		>
			<div className='border-base-300 border-b px-3 py-3'>
				<div className='flex items-start gap-2'>
					<div className='min-w-0 flex-1'>
						<div className='flex flex-wrap items-center gap-2'>
							{title ? <h3 className='min-w-0 truncate text-sm font-semibold'>{title}</h3> : null}
							{status}
						</div>
						{description ? <div className='text-base-content/65 mt-1 text-xs leading-5'>{description}</div> : null}
					</div>
					<div className='flex shrink-0 items-center gap-1'>
						{actions}
						{onClose ? (
							<button
								type='button'
								aria-label={closeLabel}
								title={closeLabel}
								className='hover:bg-base-200 grid size-7 place-items-center rounded'
								onClick={onClose}
							>
								<X className='size-4' />
							</button>
						) : null}
					</div>
				</div>
			</div>
			<div className={cn('overflow-auto p-3 xl:min-h-0 xl:flex-1', contentClassName)}>{children}</div>
			{footer ? <div className='border-base-300 border-t p-3'>{footer}</div> : null}
		</aside>
	);
}

export type DataViewSummarySectionProps = Omit<ComponentPropsWithRef<'details'>, 'title'> & {
	title?: ReactNode;
	description?: ReactNode;
	meta?: ReactNode;
	contentClassName?: string;
};

export function DataViewSummarySection({
	title,
	description,
	meta,
	contentClassName,
	children,
	className,
	...props
}: DataViewSummarySectionProps) {
	return (
		<details className={cn('group border-base-300 bg-base-100 rounded-md border', className)} {...props}>
			<summary className='flex cursor-pointer list-none items-start gap-2 px-3 py-2.5 marker:hidden'>
				<ChevronRight className='text-base-content/45 mt-0.5 size-4 shrink-0 transition-transform group-open:rotate-90' />
				<span className='min-w-0 flex-1'>
					<span className='flex flex-wrap items-center gap-2'>
						{title ? <span className='truncate text-sm font-medium'>{title}</span> : null}
						{meta ? <span className='text-base-content/50 text-xs'>{meta}</span> : null}
					</span>
					{description ? (
						<span className='text-base-content/60 mt-0.5 block text-xs leading-5'>{description}</span>
					) : null}
				</span>
			</summary>
			<div className={cn('border-base-300 border-t px-3 py-3 text-sm', contentClassName)}>{children}</div>
		</details>
	);
}

export type DataViewDetailGridProps = ComponentPropsWithRef<'div'> & {
	columns?: 1 | 2 | 3;
};

export function DataViewDetailGrid({ columns = 2, className, ...props }: DataViewDetailGridProps) {
	const columnClass = {
		1: 'grid-cols-1',
		2: 'grid-cols-1 md:grid-cols-2',
		3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
	}[columns];
	return <div className={cn('grid gap-3', columnClass, className)} {...props} />;
}

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
				'border-base-300 bg-base-100 flex h-[var(--console-control-height)] min-w-48 flex-1 items-center gap-2 border px-2 sm:max-w-80',
				'focus-within:border-primary focus-within:ring-primary/30 rounded-md focus-within:ring-1',
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
		<div
			className={cn(
				'border-base-300 bg-base-100 flex h-[var(--console-control-height)] items-center border p-0.5',
				className,
			)}
			{...props}
		>
			<button
				type='button'
				aria-label='表格视图'
				title='表格视图'
				aria-pressed={value === 'table'}
				className={cn(
					'grid size-7 place-items-center rounded-sm',
					value === 'table' ? 'bg-primary text-primary-content' : 'hover:bg-base-200',
				)}
				onClick={() => onValueChange('table')}
			>
				<List className='size-4' />
			</button>
			<button
				type='button'
				aria-label='网格视图'
				title='网格视图'
				aria-pressed={value === 'grid'}
				className={cn(
					'grid size-7 place-items-center rounded-sm',
					value === 'grid' ? 'bg-primary text-primary-content' : 'hover:bg-base-200',
				)}
				onClick={() => onValueChange('grid')}
			>
				<Grid2X2 className='size-4' />
			</button>
		</div>
	);
}

export type DataViewTableProps = ComponentPropsWithRef<'table'> & {
	containerClassName?: string;
};

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
				'border-base-300 bg-base-100 flex min-h-28 w-full items-start gap-3 border p-3 text-left outline-none',
				'hover:border-primary/45 hover:bg-base-200/50 focus-visible:ring-primary rounded-md focus-visible:ring-2',
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

export type DataViewDetailProps = Omit<ComponentPropsWithRef<'aside'>, 'title'> & {
	title?: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
};

export function DataViewDetail({
	title,
	description,
	actions,
	children,
	className,
	'aria-label': ariaLabel,
	...props
}: DataViewDetailProps) {
	return (
		<aside aria-label={ariaLabel ?? '详情'} className={cn('flex min-h-full flex-col', className)} {...props}>
			<div className='border-base-300 flex items-start gap-2 border-b px-3 py-3'>
				<div className='min-w-0 flex-1'>
					{title ? <h3 className='truncate text-sm font-semibold'>{title}</h3> : null}
					{description ? <div className='text-base-content/65 mt-0.5 text-xs'>{description}</div> : null}
				</div>
				{actions}
			</div>
			<div className='min-h-0 flex-1 overflow-auto p-3'>{children}</div>
		</aside>
	);
}

export type DataViewFooterProps = ComponentPropsWithRef<'footer'> & {
	info?: ReactNode;
	pagination?: ReactNode;
	actions?: ReactNode;
};

export function DataViewFooter({ info, pagination, actions, children, className, ...props }: DataViewFooterProps) {
	return (
		<footer
			className={cn('border-base-300 flex min-h-11 flex-wrap items-center gap-2 border-t px-3 py-2 text-xs', className)}
			{...props}
		>
			{info ? <div className='text-base-content/65'>{info}</div> : null}
			{children}
			<div className='flex-1' />
			{actions}
			{pagination}
		</footer>
	);
}

export type DataViewPaginationProps = Omit<ComponentPropsWithRef<'nav'>, 'onChange'> & {
	page: number;
	pageCount: number;
	onPageChange: (page: number) => void;
};

export function DataViewPagination({ page, pageCount, onPageChange, className, ...props }: DataViewPaginationProps) {
	const safePageCount = Math.max(1, pageCount);
	return (
		<nav aria-label='分页' className={cn('flex items-center gap-1', className)} {...props}>
			<button
				type='button'
				aria-label='上一页'
				title='上一页'
				disabled={page <= 1}
				className='border-base-300 grid size-7 place-items-center rounded border disabled:cursor-not-allowed disabled:opacity-35'
				onClick={() => onPageChange(Math.max(1, page - 1))}
			>
				<ChevronLeft className='size-4' />
			</button>
			<span className='text-base-content/65 min-w-16 text-center'>
				{page} / {safePageCount}
			</span>
			<button
				type='button'
				aria-label='下一页'
				title='下一页'
				disabled={page >= safePageCount}
				className='border-base-300 grid size-7 place-items-center rounded border disabled:cursor-not-allowed disabled:opacity-35'
				onClick={() => onPageChange(Math.min(safePageCount, page + 1))}
			>
				<ChevronRight className='size-4' />
			</button>
		</nav>
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

export type DataViewSelectionBarProps = ComponentPropsWithRef<'div'> & {
	count: number;
	actions?: ReactNode;
};

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
