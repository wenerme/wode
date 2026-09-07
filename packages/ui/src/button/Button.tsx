import { Button as BaseButton } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const buttonVariants = cva(
	'btn [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
	{
		variants: {
			variant: {
				default: 'btn-primary',
				secondary: 'btn-secondary',
				outline: 'btn-outline',
				ghost: 'btn-ghost',
				destructive: 'btn-error',
			},
			size: {
				sm: 'btn-sm',
				md: 'btn-md',
				lg: 'btn-lg',
				icon: 'btn-square btn-md',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'md',
		},
	},
);

export type ButtonProps = ComponentPropsWithRef<typeof BaseButton> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
	return <BaseButton data-slot='button' className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
