import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const statusVariants = cva('status', {
	variants: {
		tone: {
			default: '',
			neutral: 'status-neutral',
			primary: 'status-primary',
			secondary: 'status-secondary',
			accent: 'status-accent',
			info: 'status-info',
			success: 'status-success',
			warning: 'status-warning',
			error: 'status-error',
		},
		size: {
			xs: 'status-xs',
			sm: 'status-sm',
			md: 'status-md',
			lg: 'status-lg',
			xl: 'status-xl',
		},
	},
	defaultVariants: {
		tone: 'default',
		size: 'md',
	},
});

export type StatusProps = ComponentPropsWithRef<'span'> & VariantProps<typeof statusVariants>;

export function Status({ className, tone, size, ...props }: StatusProps) {
	return <span data-slot='status' className={cn(statusVariants({ tone, size }), className)} {...props} />;
}
