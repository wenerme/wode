import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const textareaVariants = cva(
	'textarea min-h-24 w-full aria-invalid:border-error aria-invalid:ring-error/20 aria-invalid:ring-2',
	{
		variants: {
			variant: {
				default: '',
				ghost: 'textarea-ghost',
			},
			tone: {
				default: '',
				neutral: 'textarea-neutral',
				primary: 'textarea-primary',
				secondary: 'textarea-secondary',
				accent: 'textarea-accent',
				info: 'textarea-info',
				success: 'textarea-success',
				warning: 'textarea-warning',
				error: 'textarea-error',
			},
			size: {
				xs: 'textarea-xs',
				sm: 'textarea-sm',
				md: 'textarea-md',
				lg: 'textarea-lg',
				xl: 'textarea-xl',
			},
		},
		defaultVariants: {
			variant: 'default',
			tone: 'default',
			size: 'md',
		},
	},
);

export type TextareaProps = ComponentPropsWithRef<'textarea'> & VariantProps<typeof textareaVariants>;

export function Textarea({ className, variant, tone, size, ...props }: TextareaProps) {
	return (
		<textarea data-slot='textarea' className={cn(textareaVariants({ variant, tone, size }), className)} {...props} />
	);
}
