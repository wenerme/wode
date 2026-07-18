import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type HeaderContentFooterLayoutProps = ComponentPropsWithRef<'div'> & {
	contentClassName?: string;
	footer?: ReactNode;
	header?: ReactNode;
	scrollContent?: boolean;
};

export function HeaderContentFooterLayout({
	children,
	className,
	contentClassName,
	footer,
	header,
	scrollContent = true,
	...props
}: HeaderContentFooterLayoutProps) {
	return (
		<div data-slot='header-content-footer-layout' className={cn('flex min-h-0 min-w-0 flex-col', className)} {...props}>
			{header}
			<div
				data-slot='header-content-footer-layout-content'
				className={cn('relative min-h-0 min-w-0 flex-1', scrollContent && 'overflow-auto', contentClassName)}
			>
				{children}
			</div>
			{footer}
		</div>
	);
}
