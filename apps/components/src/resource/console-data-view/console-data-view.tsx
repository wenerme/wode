import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export * from './data-view-collection';
export * from './data-view-panels';

export type DataViewProps = ComponentPropsWithRef<'section'> & {
	header?: ReactNode;
	toolbar?: ReactNode;
	footer?: ReactNode;
	detail?: ReactNode;
	workspace?: boolean;
};

export function DataView({
	header,
	toolbar,
	footer,
	detail,
	workspace = false,
	children,
	className,
	...props
}: DataViewProps) {
	return (
		<section
			data-slot='data-view'
			data-console-density=''
			className={cn(
				'border-base-300 bg-base-100 flex min-w-0 flex-col overflow-hidden',
				workspace ? 'h-full min-h-0 border-0' : 'min-h-[28rem] border',
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
	headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
};

export function DataViewHeader({
	title,
	description,
	status,
	actions,
	headingLevel = 2,
	children,
	className,
	...props
}: DataViewHeaderProps) {
	const Heading = `h${headingLevel}` as const;
	return (
		<header
			className={cn('border-base-300 flex flex-wrap items-start gap-3 border-b px-3 py-3 md:px-4', className)}
			{...props}
		>
			<div className='min-w-0 flex-1'>
				<div className='flex flex-wrap items-center gap-2'>
					{title ? <Heading className='text-sm font-semibold'>{title}</Heading> : null}
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
