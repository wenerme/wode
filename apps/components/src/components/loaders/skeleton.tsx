import type { ComponentPropsWithRef } from 'react';
import { cn } from '@/lib/utils';

export type SkeletonShape = 'text' | 'rect' | 'circle';

export type SkeletonProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
	shape?: SkeletonShape;
};

const skeletonShapeClass: Record<SkeletonShape, string> = {
	text: 'h-4 w-full rounded-sm',
	rect: 'h-20 w-full rounded-md',
	circle: 'size-10 shrink-0 rounded-full',
};

export function Skeleton({ shape = 'text', className, 'aria-hidden': ariaHidden = true, ...props }: SkeletonProps) {
	return (
		<div
			data-slot='skeleton'
			data-shape={shape}
			aria-hidden={ariaHidden}
			className={cn('skeleton bg-base-300/70 motion-reduce:animate-none', skeletonShapeClass[shape], className)}
			{...props}
		/>
	);
}

export type LoadingRowsVariant = 'list' | 'table';
export type LoadingRowsDensity = 'compact' | 'comfortable';
export type LoadingRowsColumns = 1 | 2 | 3 | 4;

export type LoadingRowsProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
	variant?: LoadingRowsVariant;
	density?: LoadingRowsDensity;
	rows?: number;
	columns?: LoadingRowsColumns;
	showHeader?: boolean;
	showLeading?: boolean;
	showTrailing?: boolean;
	label?: string;
};

const tableColumnsClass: Record<LoadingRowsColumns, string> = {
	1: 'grid-cols-1',
	2: 'grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]',
	3: 'grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,.75fr)]',
	4: 'grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,.75fr)_minmax(0,.5fr)]',
};

const cellWidthClass = ['w-4/5', 'w-2/3', 'w-3/4', 'w-1/2'] as const;
const rowPaddingClass: Record<LoadingRowsDensity, string> = {
	compact: 'py-2',
	comfortable: 'py-3',
};

function normalizeRows(rows: number) {
	return Number.isFinite(rows) ? Math.min(20, Math.max(1, Math.floor(rows))) : 5;
}

export function LoadingRows({
	variant = 'list',
	density = 'comfortable',
	rows = 5,
	columns = 4,
	showHeader = true,
	showLeading = true,
	showTrailing = true,
	label = '正在加载列表',
	className,
	'aria-label': ariaLabel,
	...props
}: LoadingRowsProps) {
	const rowCount = normalizeRows(rows);
	return (
		<div
			data-slot='loading-rows'
			data-variant={variant}
			data-rows={rowCount}
			role='status'
			aria-live='polite'
			aria-busy='true'
			aria-label={ariaLabel ?? label}
			className={cn('min-w-0', className)}
			{...props}
		>
			<div aria-hidden='true' className='min-w-0'>
				{variant === 'table' && showHeader ? (
					<div className={cn('border-base-300 grid gap-4 border-b px-3 py-2', tableColumnsClass[columns])}>
						{Array.from({ length: columns }, (_, column) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: Deterministic skeleton slots have no state.
							<Skeleton key={`header-${column}`} className={cn('h-3', cellWidthClass[column])} />
						))}
					</div>
				) : null}
				{Array.from({ length: rowCount }, (_, row) =>
					variant === 'table' ? (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: Deterministic skeleton rows have no state.
							key={`row-${row}`}
							className={cn(
								'border-base-300 grid items-center gap-4 border-b px-3 last:border-b-0',
								tableColumnsClass[columns],
								rowPaddingClass[density],
							)}
						>
							{Array.from({ length: columns }, (_, column) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: Deterministic skeleton cells have no state.
								<Skeleton key={`cell-${column}`} className={cn('h-3.5', cellWidthClass[(row + column) % 4])} />
							))}
						</div>
					) : (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: Deterministic skeleton rows have no state.
							key={`row-${row}`}
							className={cn(
								'border-base-300 flex min-w-0 items-center gap-3 border-b px-3 last:border-b-0',
								rowPaddingClass[density],
							)}
						>
							{showLeading ? <Skeleton className='size-9' shape='circle' /> : null}
							<div className='min-w-0 flex-1 space-y-2'>
								<Skeleton className={cn('h-3.5', row % 2 === 0 ? 'w-3/5' : 'w-2/3')} />
								<Skeleton className={cn('h-3', row % 3 === 0 ? 'w-4/5' : 'w-3/4')} />
							</div>
							{showTrailing ? <Skeleton className='h-3 w-12 shrink-0' /> : null}
						</div>
					),
				)}
			</div>
		</div>
	);
}
