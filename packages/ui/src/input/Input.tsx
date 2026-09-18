import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const inputVariants = cva(
	'input w-full aria-invalid:border-error aria-invalid:ring-error/20 aria-invalid:ring-2',
	{
		variants: {
			variant: {
				default: '',
				ghost: 'input-ghost',
			},
			tone: {
				default: '',
				neutral: 'input-neutral',
				primary: 'input-primary',
				secondary: 'input-secondary',
				accent: 'input-accent',
				info: 'input-info',
				success: 'input-success',
				warning: 'input-warning',
				error: 'input-error',
			},
			size: {
				xs: 'input-xs',
				sm: 'input-sm',
				md: 'input-md',
				lg: 'input-lg',
				xl: 'input-xl',
			},
		},
		defaultVariants: {
			variant: 'default',
			tone: 'default',
			size: 'md',
		},
	},
);

type InputVariantProps = VariantProps<typeof inputVariants>;

export type InputProps = ComponentPropsWithRef<'input'> &
	Omit<InputVariantProps, 'size'> & {
		controlSize?: InputVariantProps['size'];
	};

export function Input({ className, type, variant, tone, controlSize, ...props }: InputProps) {
	return (
		<input
			data-slot='input'
			type={type}
			className={cn(inputVariants({ variant, tone, size: controlSize }), className)}
			{...props}
		/>
	);
}
