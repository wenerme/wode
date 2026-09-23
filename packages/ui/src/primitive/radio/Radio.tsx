import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../../utils';

const radioVariants = cva('radio', {
	variants: {
		tone: {
			neutral: 'radio-neutral',
			primary: 'radio-primary',
			secondary: 'radio-secondary',
			accent: 'radio-accent',
			info: 'radio-info',
			success: 'radio-success',
			warning: 'radio-warning',
			error: 'radio-error',
		},
		size: {
			xs: 'radio-xs',
			sm: 'radio-sm',
			md: 'radio-md',
			lg: 'radio-lg',
			xl: 'radio-xl',
		},
	},
	defaultVariants: { tone: 'primary', size: 'md' },
});

export type RadioProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'> &
	Omit<VariantProps<typeof radioVariants>, 'size'> & {
		controlSize?: VariantProps<typeof radioVariants>['size'];
	};

export function Radio({ className, tone, controlSize, ...props }: RadioProps) {
	return (
		<input
			{...props}
			data-slot='radio'
			type='radio'
			className={cn(radioVariants({ tone, size: controlSize }), className)}
		/>
	);
}
