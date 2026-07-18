import type { ComponentPropsWithRef } from 'react';
import { cn } from './utils';

export type InputProps = ComponentPropsWithRef<'input'>;

export function Input({ className, type, ...props }: InputProps) {
	return (
		<input
			type={type}
			className={cn(
				'border-input bg-background ring-offset-background placeholder:text-muted-foreground flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors',
				'file:border-0 file:bg-transparent file:text-sm file:font-medium',
				'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
				'disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			{...props}
		/>
	);
}
