import type { ElementType } from 'react';
import React from 'react';
import { cn } from '../../utils/cn';
import type { AsProps } from '../props';

export type TruncateFormatProps<E extends ElementType = 'div'> = AsProps<E> & {
	value?: string | null;
	children?: React.ReactNode;
};

export const TruncateFormat = <E extends ElementType = 'div'>({
	as: As = 'div',
	className,
	children,
	value,
	...props
}: TruncateFormatProps<E>) => {
	const content = children || value || '';
	return (
		<As className={cn('truncate', className)} title={value || ''} {...props}>
			{content}
		</As>
	);
};
