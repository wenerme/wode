import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const alertVariants = cva('alert', {
	variants: {
		variant: {
			default: '',
			outline: 'alert-outline',
			dash: 'alert-dash',
			soft: 'alert-soft',
		},
		tone: {
			default: '',
			info: 'alert-info',
			success: 'alert-success',
			warning: 'alert-warning',
			error: 'alert-error',
		},
		direction: {
			responsive: 'alert-vertical sm:alert-horizontal',
			vertical: 'alert-vertical',
			horizontal: 'alert-horizontal',
		},
	},
	defaultVariants: {
		variant: 'default',
		tone: 'default',
		direction: 'responsive',
	},
});

export type AlertProps = ComponentPropsWithRef<'div'> & VariantProps<typeof alertVariants>;

export function Alert({ className, variant, tone, direction, role = 'alert', ...props }: AlertProps) {
	return (
		<div
			data-slot='alert'
			role={role}
			className={cn(alertVariants({ variant, tone, direction }), className)}
			{...props}
		/>
	);
}

export type AlertTitleProps = ComponentPropsWithRef<'h5'>;

export function AlertTitle({ className, ...props }: AlertTitleProps) {
	return <h5 data-slot='alert-title' className={cn('font-medium', className)} {...props} />;
}

export type AlertDescriptionProps = ComponentPropsWithRef<'div'>;

export function AlertDescription({ className, ...props }: AlertDescriptionProps) {
	return <div data-slot='alert-description' className={cn('text-sm', className)} {...props} />;
}

export type AlertActionsProps = ComponentPropsWithRef<'div'>;

export function AlertActions({ className, ...props }: AlertActionsProps) {
	return <div data-slot='alert-actions' className={cn('flex items-center gap-2', className)} {...props} />;
}
