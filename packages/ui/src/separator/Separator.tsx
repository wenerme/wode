import { Separator as BaseSeparator } from '@base-ui/react/separator';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export type SeparatorProps = ComponentPropsWithRef<typeof BaseSeparator>;

export function Separator({ className, orientation = 'horizontal', ...props }: SeparatorProps) {
	return (
		<BaseSeparator
			data-slot='separator'
			orientation={orientation}
			className={cn('divider m-0', orientation === 'vertical' && 'divider-horizontal h-auto', className)}
			{...props}
		/>
	);
}
