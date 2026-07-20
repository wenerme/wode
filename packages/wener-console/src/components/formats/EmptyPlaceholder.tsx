import { clsx } from 'clsx';
import type { ElementType } from 'react';
import type { AsProps } from '../props';

export type EmptyPlaceholderProps<E extends ElementType> = AsProps<E>;

export const EmptyPlaceholder = <E extends ElementType = 'span'>({
	as: As = 'span',
	className,
	children = '无',
	...rest
}: EmptyPlaceholderProps<E>) => {
	return (
		<As className={clsx('opacity-70', className)} {...rest}>
			{children}
		</As>
	);
};
