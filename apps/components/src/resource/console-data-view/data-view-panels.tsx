import { ChevronRight, Maximize2, X } from 'lucide-react';
import type { ComponentPropsWithRef, CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DataViewSidePanelLayoutStyle = CSSProperties & {
	'--data-view-summary-width'?: string;
	'--data-view-details-width'?: string;
};

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
							<PanelAction label={expandLabel} icon={<Maximize2 className='size-3.5' />} onClick={onExpand} />
						) : null}
						{onClose ? <PanelAction label={closeLabel} icon={<X className='size-4' />} onClick={onClose} /> : null}
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
						{onClose ? <PanelAction label={closeLabel} icon={<X className='size-4' />} onClick={onClose} /> : null}
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

export type DataViewDetailGridProps = ComponentPropsWithRef<'div'> & { columns?: 1 | 2 | 3 };

export function DataViewDetailGrid({ columns = 2, className, ...props }: DataViewDetailGridProps) {
	const columnClass = {
		1: 'grid-cols-1',
		2: 'grid-cols-1 md:grid-cols-2',
		3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
	}[columns];
	return <div className={cn('grid gap-3', columnClass, className)} {...props} />;
}

function PanelAction({ label, icon, onClick }: { label: string; icon: ReactNode; onClick: () => void }) {
	return (
		<button
			type='button'
			aria-label={label}
			title={label}
			className='hover:bg-base-200 grid size-7 place-items-center rounded'
			onClick={onClick}
		>
			{icon}
		</button>
	);
}
