import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../../utils';

const dividerVariants = cva('divider', {
	variants: {
		tone: {
			neutral: 'divider-neutral',
			primary: 'divider-primary',
			secondary: 'divider-secondary',
			accent: 'divider-accent',
			info: 'divider-info',
			success: 'divider-success',
			warning: 'divider-warning',
			error: 'divider-error',
		},
		vertical: { true: 'divider-horizontal', false: '' },
	},
	defaultVariants: { vertical: false },
});

export type DividerProps = ComponentPropsWithRef<'div'> & VariantProps<typeof dividerVariants>;

export function Divider({ className, tone, vertical, ...props }: DividerProps) {
	return (
		<div
			aria-orientation={vertical ? 'vertical' : 'horizontal'}
			className={cn(dividerVariants({ tone, vertical }), className)}
			data-slot='divider'
			role='separator'
			{...props}
		/>
	);
}
