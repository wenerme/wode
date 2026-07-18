import { Button as BaseButton } from '@base-ui/react/button';
import type { ComponentPropsWithRef } from 'react';
import { cn } from './utils';

export type ButtonProps = ComponentPropsWithRef<typeof BaseButton> & {
	variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
	size?: 'sm' | 'md' | 'lg' | 'icon';
};

const buttonVariants = {
	default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
	secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
	outline: 'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
	ghost: 'hover:bg-accent hover:text-accent-foreground',
	destructive: 'bg-destructive text-white shadow-xs hover:bg-destructive/90',
};

const buttonSizes = {
	sm: 'h-8 rounded-md px-3 text-xs',
	md: 'h-9 rounded-md px-4 py-2',
	lg: 'h-10 rounded-md px-6',
	icon: 'size-9 rounded-md',
};

export function Button({ className, variant = 'default', size = 'md', ...props }: ButtonProps) {
	return (
		<BaseButton
			className={cn(
				'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all',
				'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
				'disabled:pointer-events-none disabled:opacity-50',
				'[&_svg]:pointer-events-none [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
				buttonVariants[variant],
				buttonSizes[size],
				className,
			)}
			{...props}
		/>
	);
}
