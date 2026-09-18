import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const sliderVariants = cva('range w-full', {
	variants: {
		tone: {
			default: '',
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
	defaultVariants: {
		tone: 'primary',
		size: 'md',
	},
});

export type SliderProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'> & VariantProps<typeof sliderVariants>;

export function Slider({ className, tone, size, ...props }: SliderProps) {
	return <input data-slot='slider' type='range' className={cn(sliderVariants({ tone, size }), className)} {...props} />;
}
