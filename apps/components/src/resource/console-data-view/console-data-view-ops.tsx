import type { ComponentPropsWithRef, Key, ReactNode } from 'react';
import { Children } from 'react';
import { cn } from '@/lib/utils';

export type DataViewOpsTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type DataViewHeadingLevel = 2 | 3 | 4 | 5 | 6;

const headingTag: Record<DataViewHeadingLevel, `h${DataViewHeadingLevel}`> = {
	2: 'h2',
	3: 'h3',
	4: 'h4',
	5: 'h5',
	6: 'h6',
};

function hasRenderableNode(value: ReactNode) {
	return Children.toArray(value).length > 0;
}

const toneSurfaceClass: Record<DataViewOpsTone, string> = {
	neutral: 'border-base-300 bg-base-200/45',
	info: 'border-info/35 bg-info/4',
	success: 'border-success/35 bg-success/4',
	warning: 'border-warning/40 bg-warning/4',
	danger: 'border-error/35 bg-error/4',
};

const toneIndicatorClass: Record<DataViewOpsTone, string> = {
	neutral: 'bg-base-content/45',
	info: 'bg-info',
	success: 'bg-success',
	warning: 'bg-warning',
	danger: 'bg-error',
};

export type DataViewMetricCardProps = ComponentPropsWithRef<'article'> & {
	label: ReactNode;
	value: ReactNode;
	icon?: ReactNode;
	status?: ReactNode;
	hint?: ReactNode;
	trend?: ReactNode;
	actions?: ReactNode;
	tone?: DataViewOpsTone;
};

export function DataViewMetricCard({
	label,
	value,
	icon,
	status,
	hint,
	trend,
	actions,
	tone = 'neutral',
	className,
	...props
}: DataViewMetricCardProps) {
	return (
		<article
			data-slot='data-view-metric-card'
			data-tone={tone}
			className={cn('border-base-300 bg-base-100 min-w-0 rounded-md border p-3', className)}
			{...props}
		>
			<div className='flex min-w-0 items-start gap-3'>
				{hasRenderableNode(icon) ? (
					<div
						aria-hidden='true'
						className={cn('grid size-9 shrink-0 place-items-center rounded-md border', toneSurfaceClass[tone])}
					>
						{icon}
					</div>
				) : null}
				<div className='min-w-0 flex-1'>
					<div className='flex min-w-0 items-start justify-between gap-2'>
						<div className='text-base-content/60 min-w-0 truncate text-xs font-medium'>{label}</div>
						{hasRenderableNode(status) ? <div className='shrink-0'>{status}</div> : null}
					</div>
					<div className='mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1'>
						<div className='min-w-0 text-xl leading-none font-semibold break-words'>{value}</div>
						{hasRenderableNode(trend) ? <div className='text-base-content/65 text-xs'>{trend}</div> : null}
					</div>
				</div>
				{hasRenderableNode(actions) ? <div className='shrink-0'>{actions}</div> : null}
			</div>
			{hasRenderableNode(hint) ? <div className='text-base-content/55 mt-3 text-xs leading-5'>{hint}</div> : null}
		</article>
	);
}

export type DataViewPanelProps = Omit<ComponentPropsWithRef<'section'>, 'title'> & {
	eyebrow?: ReactNode;
	title?: ReactNode;
	description?: ReactNode;
	icon?: ReactNode;
	status?: ReactNode;
	meta?: ReactNode;
	actions?: ReactNode;
	footer?: ReactNode;
	tone?: DataViewOpsTone;
	headingLevel?: DataViewHeadingLevel;
	contentClassName?: string;
};

export function DataViewPanel({
	eyebrow,
	title,
	description,
	icon,
	status,
	meta,
	actions,
	footer,
	tone = 'neutral',
	headingLevel = 2,
	contentClassName,
	children,
	className,
	...props
}: DataViewPanelProps) {
	const hasHeader = [eyebrow, title, description, icon, status, meta, actions].some(hasRenderableNode);
	const Heading = headingTag[headingLevel];

	return (
		<section
			data-slot='data-view-panel'
			data-tone={tone}
			className={cn('border-base-300 bg-base-100 min-w-0 overflow-hidden rounded-md border', className)}
			{...props}
		>
			{hasHeader ? (
				<header className='border-base-300 flex flex-wrap items-start gap-3 border-b px-3 py-3'>
					{hasRenderableNode(icon) ? (
						<div
							aria-hidden='true'
							className={cn('grid size-8 shrink-0 place-items-center rounded-md border', toneSurfaceClass[tone])}
						>
							{icon}
						</div>
					) : null}
					<div className='min-w-0 flex-1'>
						{hasRenderableNode(eyebrow) ? (
							<div className='text-base-content/45 mb-1 text-[11px] font-semibold uppercase'>{eyebrow}</div>
						) : null}
						<div className='flex flex-wrap items-center gap-2'>
							{hasRenderableNode(title) ? (
								<Heading className='min-w-0 text-sm font-semibold break-words'>{title}</Heading>
							) : null}
							{status}
						</div>
						{hasRenderableNode(description) ? (
							<div className='text-base-content/60 mt-1 text-xs leading-5'>{description}</div>
						) : null}
						{hasRenderableNode(meta) ? <div className='text-base-content/45 mt-1.5 text-xs'>{meta}</div> : null}
					</div>
					{hasRenderableNode(actions) ? (
						<div className='flex shrink-0 flex-wrap items-center gap-1'>{actions}</div>
					) : null}
				</header>
			) : null}
			<div className={cn('min-w-0 p-3', contentClassName)}>{children}</div>
			{hasRenderableNode(footer) ? <footer className='border-base-300 border-t px-3 py-2.5'>{footer}</footer> : null}
		</section>
	);
}

export type DataViewAttentionListProps = Omit<ComponentPropsWithRef<'section'>, 'title'> & {
	title?: ReactNode;
	description?: ReactNode;
	status?: ReactNode;
	empty?: ReactNode;
	headingLevel?: DataViewHeadingLevel;
	listClassName?: string;
};

export function DataViewAttentionList({
	title,
	description,
	status,
	empty = '暂无需要关注的事项',
	headingLevel = 3,
	listClassName,
	children,
	className,
	'aria-label': ariaLabel,
	...props
}: DataViewAttentionListProps) {
	const items = Children.toArray(children);
	const Heading = headingTag[headingLevel];
	const defaultAriaLabel = typeof title === 'string' && title.trim().length > 0 ? title : '关注事项';
	const hasHeader = [title, description, status].some(hasRenderableNode);

	return (
		<section
			data-slot='data-view-attention-list'
			aria-label={ariaLabel ?? defaultAriaLabel}
			className={cn('min-w-0', className)}
			{...props}
		>
			{hasHeader ? (
				<header className='mb-2 flex items-start gap-2'>
					<div className='min-w-0 flex-1'>
						<div className='flex flex-wrap items-center gap-2'>
							{hasRenderableNode(title) ? <Heading className='text-xs font-semibold'>{title}</Heading> : null}
							{status}
						</div>
						{hasRenderableNode(description) ? (
							<div className='text-base-content/55 mt-0.5 text-xs leading-5'>{description}</div>
						) : null}
					</div>
				</header>
			) : null}
			{items.length > 0 ? (
				<ul className={cn('grid gap-2', listClassName)}>{items}</ul>
			) : (
				<div
					data-slot='data-view-attention-empty'
					className='bg-base-200/50 text-base-content/55 rounded-md px-3 py-2 text-xs'
				>
					{empty}
				</div>
			)}
		</section>
	);
}

export type DataViewAttentionItemProps = Omit<ComponentPropsWithRef<'li'>, 'title'> & {
	title: ReactNode;
	description?: ReactNode;
	meta?: ReactNode;
	icon?: ReactNode;
	status?: ReactNode;
	actions?: ReactNode;
	tone?: DataViewOpsTone;
};

export function DataViewAttentionItem({
	title,
	description,
	meta,
	icon,
	status,
	actions,
	tone = 'warning',
	className,
	...props
}: DataViewAttentionItemProps) {
	return (
		<li
			data-slot='data-view-attention-item'
			data-tone={tone}
			className={cn(
				'flex min-w-0 items-start gap-2.5 rounded-md border border-l-2 px-3 py-2.5',
				toneSurfaceClass[tone],
				className,
			)}
			{...props}
		>
			{hasRenderableNode(icon) ? (
				<div className='text-base-content/65 mt-0.5 grid size-4 shrink-0 place-items-center'>{icon}</div>
			) : (
				<span aria-hidden='true' className={cn('mt-1.5 size-2 shrink-0 rounded-full', toneIndicatorClass[tone])} />
			)}
			<div className='min-w-0 flex-1'>
				<div className='flex min-w-0 flex-wrap items-center gap-2'>
					<div className='min-w-0 flex-1 text-sm font-medium break-words'>{title}</div>
					{status}
				</div>
				{hasRenderableNode(description) ? (
					<div className='text-base-content/65 mt-0.5 text-xs leading-5 break-words'>{description}</div>
				) : null}
				{hasRenderableNode(meta) ? <div className='text-base-content/45 mt-1.5 text-xs'>{meta}</div> : null}
			</div>
			{hasRenderableNode(actions) ? <div className='shrink-0'>{actions}</div> : null}
		</li>
	);
}

export type DataViewInventoryColumn<Row> = {
	id: string;
	header: ReactNode;
	cell: (row: Row, index: number) => ReactNode;
	align?: 'start' | 'center' | 'end';
	headerClassName?: string;
	cellClassName?: string;
};

export type DataViewInventoryTableProps<Row> = Omit<ComponentPropsWithRef<'table'>, 'children'> & {
	rows: readonly Row[];
	columns: readonly DataViewInventoryColumn<Row>[];
	getRowKey: (row: Row, index: number) => Key;
	caption?: ReactNode;
	empty?: ReactNode;
	minWidth?: string | number;
	stickyHeader?: boolean;
	containerClassName?: string;
	captionClassName?: string;
	rowClassName?: string | ((row: Row, index: number) => string | undefined);
};

const inventoryAlignClass = {
	start: 'text-left',
	center: 'text-center',
	end: 'text-right',
} as const;

export function DataViewInventoryTable<Row>({
	rows,
	columns,
	getRowKey,
	caption,
	empty = '没有库存数据',
	minWidth = '42rem',
	stickyHeader = true,
	containerClassName,
	captionClassName,
	rowClassName,
	className,
	style,
	...props
}: DataViewInventoryTableProps<Row>) {
	return (
		<div
			data-slot='data-view-inventory-table'
			className={cn('border-base-300 min-w-0 overflow-x-auto rounded-md border', containerClassName)}
		>
			<table
				className={cn('w-full border-collapse text-left text-sm', className)}
				style={{ minWidth, ...style }}
				{...props}
			>
				{hasRenderableNode(caption) ? <caption className={cn('sr-only', captionClassName)}>{caption}</caption> : null}
				<thead className={cn('bg-base-200 text-base-content/60 text-xs', stickyHeader && 'sticky top-0 z-10')}>
					<tr className='border-base-300 border-b'>
						{columns.map((column) => (
							<th
								key={column.id}
								scope='col'
								className={cn(
									'px-3 py-2 font-medium',
									inventoryAlignClass[column.align ?? 'start'],
									column.headerClassName,
								)}
							>
								{column.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody className='divide-base-300 divide-y'>
					{rows.length > 0 && columns.length > 0 ? (
						rows.map((row, rowIndex) => (
							<tr
								key={getRowKey(row, rowIndex)}
								className={cn(
									'hover:bg-base-200/40 align-top',
									typeof rowClassName === 'function' ? rowClassName(row, rowIndex) : rowClassName,
								)}
							>
								{columns.map((column) => (
									<td
										key={column.id}
										className={cn('px-3 py-2.5', inventoryAlignClass[column.align ?? 'start'], column.cellClassName)}
									>
										{column.cell(row, rowIndex)}
									</td>
								))}
							</tr>
						))
					) : (
						<tr>
							<td colSpan={Math.max(1, columns.length)} className='text-base-content/55 px-3 py-8 text-center text-sm'>
								{empty}
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
