import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type LeftCenterRightLayoutProps = ComponentPropsWithRef<'div'> & {
	center?: ReactNode;
	centerClassName?: string;
	left?: ReactNode;
	leftClassName?: string;
	right?: ReactNode;
	rightClassName?: string;
};

export function LeftCenterRightLayout({
	center,
	centerClassName,
	children,
	className,
	left,
	leftClassName,
	right,
	rightClassName,
	...props
}: LeftCenterRightLayoutProps) {
	return (
		<div
			data-slot='left-center-right-layout'
			className={cn('grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center', className)}
			{...props}
		>
			<div
				data-slot='left-center-right-layout-left'
				className={cn('flex max-w-full min-w-0 justify-self-start overflow-hidden', leftClassName)}
			>
				{left}
			</div>
			<div
				data-slot='left-center-right-layout-center'
				className={cn('flex max-w-full min-w-0 justify-self-center overflow-hidden', centerClassName)}
			>
				{center ?? children}
			</div>
			<div
				data-slot='left-center-right-layout-right'
				className={cn('flex max-w-full min-w-0 justify-self-end overflow-hidden', rightClassName)}
			>
				{right}
			</div>
		</div>
	);
}
