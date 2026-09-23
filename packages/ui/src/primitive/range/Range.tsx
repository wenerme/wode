import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../../utils';

const rangeVariants = cva('range w-full', {
	variants: {
		tone: {
			neutral: 'range-neutral',
			primary: 'range-primary',
			secondary: 'range-secondary',
			accent: 'range-accent',
			info: 'range-info',
			success: 'range-success',
			warning: 'range-warning',
			error: 'range-error',
		},
		size: {
			xs: 'range-xs',
			sm: 'range-sm',
			md: 'range-md',
			lg: 'range-lg',
			xl: 'range-xl',
		},
	},
	defaultVariants: { tone: 'primary', size: 'md' },
});

export type RangeProps = Omit<ComponentPropsWithRef<'input'>, 'size'> &
	Omit<VariantProps<typeof rangeVariants>, 'size'> & {
		controlSize?: VariantProps<typeof rangeVariants>['size'];
	};

export function Range({ className, tone, controlSize, ...props }: RangeProps) {
	return (
		<input
			{...props}
			data-slot='range'
			type='range'
			className={cn(rangeVariants({ tone, size: controlSize }), className)}
		/>
	);
}
