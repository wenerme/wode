import type { ComponentPropsWithRef } from 'react';
import { cn } from './utils';

export type TextareaProps = ComponentPropsWithRef<'textarea'>;

export function Textarea({ className, ...props }: TextareaProps) {
	return (
		<textarea
			className={cn(
				'border-input bg-background placeholder:text-muted-foreground flex min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-xs transition-colors',
				'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
				'disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			{...props}
		/>
	);
}
