import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const fileInputVariants = cva('file-input w-full', {
	variants: {
		variant: {
			default: '',
			ghost: 'file-input-ghost',
		},
		tone: {
			default: '',
			neutral: 'file-input-neutral',
			primary: 'file-input-primary',
			secondary: 'file-input-secondary',
			accent: 'file-input-accent',
			info: 'file-input-info',
			success: 'file-input-success',
			warning: 'file-input-warning',
			error: 'file-input-error',
		},
		size: {
			xs: 'file-input-xs',
			sm: 'file-input-sm',
			md: 'file-input-md',
			lg: 'file-input-lg',
			xl: 'file-input-xl',
		},
	},
	defaultVariants: {
		variant: 'default',
		tone: 'default',
		size: 'md',
	},
});

type FileInputVariantProps = VariantProps<typeof fileInputVariants>;

export type FileInputProps = Omit<ComponentPropsWithRef<'input'>, 'type'> &
	Omit<FileInputVariantProps, 'size'> & {
		controlSize?: FileInputVariantProps['size'];
	};

export function FileInput({ className, variant, tone, controlSize, ...props }: FileInputProps) {
	return (
		<input
			data-slot='file-input'
			type='file'
			className={cn(fileInputVariants({ variant, tone, size: controlSize }), className)}
			{...props}
		/>
	);
}
