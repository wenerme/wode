import React, { type ElementType, type ReactNode } from 'react';
import { cn } from '../utils/cn';
import type { AsProps } from './props';

export type LeftContentRightLayoutProps<E extends ElementType = 'div'> = AsProps<E> & {
	left?: ReactNode;
	right?: ReactNode;
	children?: React.ReactNode;
};

export const LeftContentRightLayout = <E extends ElementType = 'div'>({
	as: As = 'div',
	left,
	right,
	children,
	className,
	...props
}: LeftContentRightLayoutProps<E>) => {
	return (
		<As className={cn('flex w-full flex-row', className)} {...props}>
			{left}
			<main className={'LeftContentRightLayout__Content relative flex-1'}>
				<div className={'@container absolute inset-0 overflow-auto'}>{children}</div>
			</main>
			{right}
		</As>
	);
};
