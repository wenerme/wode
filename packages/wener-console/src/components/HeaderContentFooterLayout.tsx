import React, { type ElementType, type ReactNode } from 'react';
import { cn } from '../utils/cn';
import type { AsProps } from './props';

export type HeaderContentFooterLayoutProps<E extends ElementType = 'div'> = AsProps<E> & {
	header?: ReactNode;
	footer?: ReactNode;
	children?: ReactNode;
	className?: string;
};

export const HeaderContentFooterLayout = <E extends ElementType = 'div'>({
	header,
	as: As = 'div',
	footer,
	children,
	className,
	ref,
	...props
}: HeaderContentFooterLayoutProps<E>) => {
	return (
		<As className={cn('flex h-full flex-col', className)} ref={ref} {...props}>
			{header}
			<main className={'HeaderContentFooterLayout__Content relative flex-1'}>
				<div className={'@container absolute inset-0 overflow-auto'}>{children}</div>
			</main>
			{footer}
		</As>
	);
};
