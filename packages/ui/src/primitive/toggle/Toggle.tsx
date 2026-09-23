import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../../utils';

const toggleVariants = cva('toggle', {
	variants: {
		tone: {
			neutral: 'toggle-neutral',
			primary: 'toggle-primary',
			secondary: 'toggle-secondary',
			accent: 'toggle-accent',
			info: 'toggle-info',
			success: 'toggle-success',
			warning: 'toggle-warning',
			error: 'toggle-error',
		},
		size: {
			xs: 'toggle-xs',
			sm: 'toggle-sm',
			md: 'toggle-md',
			lg: 'toggle-lg',
			xl: 'toggle-xl',
		},
	},
	defaultVariants: { tone: 'primary', size: 'md' },
});

export type ToggleProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'> &
	Omit<VariantProps<typeof toggleVariants>, 'size'> & {
		controlSize?: VariantProps<typeof toggleVariants>['size'];
	};

export function Toggle({ className, tone, controlSize, ...props }: ToggleProps) {
	return (
		<input
			{...props}
			data-slot='toggle'
			type='checkbox'
			className={cn(toggleVariants({ tone, size: controlSize }), className)}
		/>
	);
}
