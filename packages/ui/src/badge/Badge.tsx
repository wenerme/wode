import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const badgeVariants = cva('badge', {
	variants: {
		variant: {
			default: '',
			outline: 'badge-outline',
			dash: 'badge-dash',
			soft: 'badge-soft',
			ghost: 'badge-ghost',
		},
		tone: {
			default: '',
			neutral: 'badge-neutral',
			primary: 'badge-primary',
			secondary: 'badge-secondary',
			accent: 'badge-accent',
			info: 'badge-info',
			success: 'badge-success',
			warning: 'badge-warning',
			error: 'badge-error',
		},
		size: {
			xs: 'badge-xs',
			sm: 'badge-sm',
			md: 'badge-md',
			lg: 'badge-lg',
			xl: 'badge-xl',
		},
	},
	defaultVariants: {
		variant: 'default',
		tone: 'default',
		size: 'md',
	},
});

export type BadgeProps = ComponentPropsWithRef<'span'> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, tone, size, ...props }: BadgeProps) {
	return <span data-slot='badge' className={cn(badgeVariants({ variant, tone, size }), className)} {...props} />;
}
