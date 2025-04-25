import type { ComponentPropsWithRef, ReactNode } from 'react';
import React from 'react';
import { cn } from '@wener/console';
import { isDefined } from '@wener/utils';
import { EmptyPlaceholder } from './EmptyPlaceholder';
import { formatAmount } from './formatAmount';

export const AmountFormat: React.FC<
	{
		value?: string | number;
		placeholder?: ReactNode;
	} & ComponentPropsWithRef<'div'>
> = ({ value, placeholder = <EmptyPlaceholder />, className, ...props }) => {
	if (!isDefined(value)) {
		return placeholder;
	}
	return (
		<div className={cn('text-right tabular-nums', className)} {...props}>
			{formatAmount(value)}
		</div>
	);
};
