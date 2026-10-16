import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../../utils';

export type ConsoleMainLayoutProps = ComponentPropsWithRef<'div'> & {
	contentClassName?: string;
	header?: ReactNode;
};

export function ConsoleMainLayout({ children, className, contentClassName, header, ...props }: ConsoleMainLayoutProps) {
	return (
		<div className={cn('flex min-h-0 min-w-0 flex-1 flex-col', className)} data-slot='console-main-layout' {...props}>
			{header}
			<main className={cn('min-h-0 min-w-0 flex-1 overflow-auto', contentClassName)} data-slot='console-main-content'>
				{children}
			</main>
		</div>
	);
}

export type ConsoleMainHeaderProps = Omit<ComponentPropsWithRef<'header'>, 'title'> & {
	actions?: ReactNode;
	breadcrumbs?: ReactNode;
	title?: ReactNode;
};

export function ConsoleMainHeader({ actions, breadcrumbs, className, title, ...props }: ConsoleMainHeaderProps) {
	return (
		<header
			className={cn(
				'border-base-300 bg-base-100 box-border flex min-h-[var(--console-header-height,57px)] shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 md:px-5',
				className,
			)}
			data-slot='console-main-header'
			{...props}
		>
			<div className='min-w-0 flex-1'>
				{breadcrumbs ? <div className='text-base-content/65 truncate text-xs'>{breadcrumbs}</div> : null}
				{title ? <div className='truncate text-sm font-semibold'>{title}</div> : null}
			</div>
			{actions ? <div className='flex shrink-0 items-center gap-1'>{actions}</div> : null}
		</header>
	);
}
