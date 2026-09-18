'use client';

import type { ComponentPropsWithRef, CSSProperties, ReactNode } from 'react';
import { type KeyboardEvent, useEffect, useRef, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import {
	DataViewActionBar,
	DataViewPageInfo,
	DataViewPagination,
	DataViewSearch,
	DataViewToolbar,
} from './console-data-view';
import {
	DataViewColumnControl,
	DataViewFilter,
	DataViewMenu,
	DataViewSort,
	DataViewViewSwitcher,
} from './data-view-controls';
import { DataViewListView, DataViewSheetView, DataViewTableView } from './data-view-renderers';
import { DataViewSummary } from './data-view-summary';

type DataViewLayoutStyle = CSSProperties & {
	'--data-view-summary-width'?: string;
};

export type DataViewLayoutCompositeProps = ComponentPropsWithRef<'section'> & {
	header?: ReactNode;
	toolbar?: ReactNode;
	footer?: ReactNode;
	summary?: ReactNode;
	summaryOpen?: boolean;
	summaryWidth?: string;
	viewportClassName?: string;
	summaryClassName?: string;
	onSummaryClose?: () => void;
	summaryLabel?: string;
};

export function DataViewLayoutComposite({
	header,
	toolbar,
	footer,
	summary,
	summaryOpen = Boolean(summary),
	summaryWidth = '22rem',
	viewportClassName,
	summaryClassName,
	onSummaryClose,
	summaryLabel = '概要',
	children,
	className,
	style,
	...props
}: DataViewLayoutCompositeProps) {
	const hasSummary = Boolean(summary && summaryOpen);
	const isMobileSummary = useDataViewMobileSummary();
	const mobileSummary = hasSummary && isMobileSummary;
	const summaryRef = useRef<HTMLDivElement>(null);
	const restoreFocusRef = useRef<HTMLElement | null>(null);
	const layoutStyle: DataViewLayoutStyle = { '--data-view-summary-width': summaryWidth, ...style };
	useEffect(() => {
		if (!mobileSummary) return;
		restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const frame = requestAnimationFrame(() => {
			const target = summaryRef.current?.querySelector<HTMLElement>(
				'[data-data-view-summary-close], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);
			(target ?? summaryRef.current)?.focus();
		});
		return () => {
			cancelAnimationFrame(frame);
			if (restoreFocusRef.current?.isConnected) restoreFocusRef.current.focus();
		};
	}, [mobileSummary]);
	const handleSummaryKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (!mobileSummary) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			onSummaryClose?.();
		}
	};
	return (
		<section
			data-slot='data-view-layout'
			data-console-density=''
			className={cn('bg-base-100 relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden', className)}
			style={layoutStyle}
			{...props}
		>
			<div
				data-slot='data-view-layout-background'
				aria-hidden={mobileSummary || undefined}
				inert={mobileSummary || undefined}
				className='flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
			>
				{header}
				{toolbar}
				<div data-slot='data-view-layout-body' className='flex min-h-0 min-w-0 flex-1 overflow-hidden'>
					<div
						data-slot='data-view-layout-viewport'
						className={cn('min-h-0 min-w-0 flex-1 overflow-auto', viewportClassName)}
					>
						{children}
					</div>
					{hasSummary && !isMobileSummary ? (
						<div
							data-slot='data-view-layout-summary'
							className={cn(
								'border-base-300 bg-base-100 hidden min-h-0 min-w-0 overflow-hidden lg:block lg:w-[var(--data-view-summary-width)] lg:shrink-0 lg:border-l',
								summaryClassName,
							)}
						>
							{summary}
						</div>
					) : null}
				</div>
				{footer}
			</div>
			{mobileSummary ? (
				<div
					ref={summaryRef}
					data-slot='data-view-layout-summary'
					role='dialog'
					aria-label={summaryLabel}
					tabIndex={-1}
					className={cn(
						'border-base-300 bg-base-100 absolute inset-0 z-40 min-h-0 min-w-0 overflow-hidden lg:hidden',
						summaryClassName,
					)}
					onKeyDown={handleSummaryKeyDown}
				>
					{summary}
				</div>
			) : null}
		</section>
	);
}

function useDataViewMobileSummary() {
	return useSyncExternalStore(subscribeMobileSummary, getMobileSummarySnapshot, () => false);
}

function subscribeMobileSummary(callback: () => void) {
	const query = window.matchMedia('(max-width: 1023px)');
	query.addEventListener('change', callback);
	return () => query.removeEventListener('change', callback);
}

function getMobileSummarySnapshot() {
	return window.matchMedia('(max-width: 1023px)').matches;
}

type DataViewLayoutHeaderSearchSlot =
	| { search?: ReactNode; children?: never }
	| { search?: never; children?: ReactNode };

export type DataViewLayoutHeaderProps = Omit<ComponentPropsWithRef<'header'>, 'title' | 'children'> &
	DataViewLayoutHeaderSearchSlot & {
		prefix?: ReactNode;
		title?: ReactNode;
		description?: ReactNode;
		status?: ReactNode;
		search?: ReactNode;
		sort?: ReactNode;
		filter?: ReactNode;
		view?: ReactNode;
		actions?: ReactNode;
		menu?: ReactNode;
		headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
	};

export function DataViewLayoutHeader({
	prefix,
	title,
	description,
	status,
	search,
	sort,
	filter,
	view,
	actions,
	menu,
	headingLevel = 1,
	children,
	className,
	...props
}: DataViewLayoutHeaderProps) {
	const Heading = `h${headingLevel}` as const;
	return (
		<header
			data-slot='data-view-layout-header'
			className={cn(
				'border-base-300 bg-base-100 flex h-[57px] min-h-[57px] min-w-0 shrink-0 items-center gap-2 overflow-x-auto border-b px-3',
				className,
			)}
			{...props}
		>
			{prefix}
			{title ? <Heading className='shrink-0 truncate text-sm font-semibold'>{title}</Heading> : null}
			{description ? <span className='sr-only'>{description}</span> : null}
			{status}
			{search ?? children}
			{sort}
			{filter}
			{view}
			<div className='min-w-2 flex-1' />
			{actions ? <div className='flex shrink-0 items-center gap-1'>{actions}</div> : null}
			{menu}
		</header>
	);
}

export type DataViewLayoutFooterProps = ComponentPropsWithRef<'footer'> & {
	info?: ReactNode;
	status?: ReactNode;
	actions?: ReactNode;
	menu?: ReactNode;
	pagination?: ReactNode;
};

export function DataViewLayoutFooter({
	info,
	status,
	actions,
	menu,
	pagination,
	children,
	className,
	...props
}: DataViewLayoutFooterProps) {
	return (
		<footer
			data-slot='data-view-layout-footer'
			className={cn(
				'border-base-300 bg-base-100 relative z-10 flex min-h-11 shrink-0 items-center gap-2 overflow-x-auto border-t px-4 py-2 text-xs',
				className,
			)}
			{...props}
		>
			{info ? <div className='text-base-content/65 shrink-0'>{info}</div> : null}
			{children}
			<div className='min-w-2 flex-1' />
			{status}
			{actions ? <div className='flex shrink-0 items-center gap-1'>{actions}</div> : null}
			{pagination}
			{menu}
		</footer>
	);
}

export type DataViewLayoutResourceFooterProps = Omit<DataViewLayoutFooterProps, 'info' | 'pagination'> & {
	page: number;
	pageSize: number;
	total: number;
	pageSizeOptions?: readonly number[];
	onPageChange: (page: number) => void;
	onPageSizeChange?: (pageSize: number) => void;
};

export function DataViewLayoutResourceFooter({
	page,
	pageSize,
	total,
	pageSizeOptions,
	onPageChange,
	onPageSizeChange,
	...props
}: DataViewLayoutResourceFooterProps) {
	const safeTotal = Number.isFinite(total) ? Math.max(0, Math.trunc(total)) : 0;
	const safePageSize = Number.isFinite(pageSize) ? Math.max(1, Math.trunc(pageSize)) : 1;
	const pageCount = Math.max(1, Math.ceil(safeTotal / safePageSize));
	const requestedPage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
	const safePage = Math.min(pageCount, requestedPage);
	const from = safeTotal === 0 ? 0 : (safePage - 1) * safePageSize + 1;
	const to = safeTotal === 0 ? 0 : Math.min(safePage * safePageSize, safeTotal);
	return (
		<DataViewLayoutFooter
			{...props}
			info={
				<DataViewPageInfo
					from={from}
					to={to}
					total={safeTotal}
					pageSize={safePageSize}
					pageSizeOptions={pageSizeOptions}
					onPageSizeChange={onPageSizeChange}
				/>
			}
			pagination={<DataViewPagination page={safePage} pageCount={pageCount} onPageChange={onPageChange} />}
		/>
	);
}

export const DataViewLayout = {
	Composite: DataViewLayoutComposite,
	Header: DataViewLayoutHeader,
	Toolbar: DataViewToolbar,
	ActionBar: DataViewActionBar,
	Table: DataViewTableView,
	List: DataViewListView,
	Sheet: DataViewSheetView,
	Footer: DataViewLayoutFooter,
	ResourceFooter: DataViewLayoutResourceFooter,
	Pagination: DataViewPagination,
	Summary: DataViewSummary,
	Search: DataViewSearch,
	Sort: DataViewSort,
	Filter: DataViewFilter,
	ViewSwitcher: DataViewViewSwitcher,
	ColumnControl: DataViewColumnControl,
	Menu: DataViewMenu,
} as const;
