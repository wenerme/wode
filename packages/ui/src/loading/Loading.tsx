import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const loadingVariants = cva('loading', {
	variants: {
		variant: {
			spinner: 'loading-spinner',
			dots: 'loading-dots',
			ring: 'loading-ring',
			ball: 'loading-ball',
			bars: 'loading-bars',
			infinity: 'loading-infinity',
		},
		size: {
			xs: 'loading-xs',
			sm: 'loading-sm',
			md: 'loading-md',
			lg: 'loading-lg',
			xl: 'loading-xl',
		},
	},
	defaultVariants: {
		variant: 'spinner',
		size: 'md',
	},
});

export type LoadingProps = ComponentPropsWithRef<'span'> & VariantProps<typeof loadingVariants>;

export function Loading({ className, variant, size, ...props }: LoadingProps) {
	return <span data-slot='loading' className={cn(loadingVariants({ variant, size }), className)} {...props} />;
}

export function Spinner(props: Omit<LoadingProps, 'variant'>) {
	return <Loading variant='spinner' {...props} />;
}
