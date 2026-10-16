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
	compoundVariants: [
		{ variant: ['outline', 'dash', 'soft', 'ghost'], className: 'text-base-content' },
		{ variant: ['outline', 'dash'], tone: 'neutral', className: 'border-neutral' },
		{ variant: ['outline', 'dash'], tone: 'primary', className: 'border-primary' },
		{ variant: ['outline', 'dash'], tone: 'secondary', className: 'border-secondary' },
		{ variant: ['outline', 'dash'], tone: 'accent', className: 'border-accent' },
		{ variant: ['outline', 'dash'], tone: 'info', className: 'border-info' },
		{ variant: ['outline', 'dash'], tone: 'success', className: 'border-success' },
		{ variant: ['outline', 'dash'], tone: 'warning', className: 'border-warning' },
		{ variant: ['outline', 'dash'], tone: 'error', className: 'border-error' },
	],
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
