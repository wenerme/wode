import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const kbdVariants = cva('kbd', {
	variants: {
		size: {
			xs: 'kbd-xs',
			sm: 'kbd-sm',
			md: 'kbd-md',
			lg: 'kbd-lg',
			xl: 'kbd-xl',
		},
	},
	defaultVariants: {
		size: 'md',
	},
});

export type KbdProps = ComponentPropsWithRef<'kbd'> & VariantProps<typeof kbdVariants>;

export function Kbd({ className, size, ...props }: KbdProps) {
	return <kbd data-slot='kbd' className={cn(kbdVariants({ size }), className)} {...props} />;
}
