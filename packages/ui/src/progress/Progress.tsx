import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const progressVariants = cva('progress w-full', {
	variants: {
		tone: {
			default: '',
			neutral: 'progress-neutral',
			primary: 'progress-primary',
			secondary: 'progress-secondary',
			accent: 'progress-accent',
			info: 'progress-info',
			success: 'progress-success',
			warning: 'progress-warning',
			error: 'progress-error',
		},
	},
	defaultVariants: {
		tone: 'default',
	},
});

export type ProgressProps = ComponentPropsWithRef<'progress'> & VariantProps<typeof progressVariants>;

export function Progress({ className, tone, ...props }: ProgressProps) {
	return <progress data-slot='progress' className={cn(progressVariants({ tone }), className)} {...props} />;
}
