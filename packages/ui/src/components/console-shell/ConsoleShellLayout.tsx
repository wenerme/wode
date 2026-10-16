import type { ComponentPropsWithRef } from 'react';
import { cn } from '../../utils';

export type ConsoleShellLayoutProps = ComponentPropsWithRef<'div'>;

export function ConsoleShellLayout({ className, ...props }: ConsoleShellLayoutProps) {
	return (
		<div
			data-slot='console-shell-layout'
			className={cn(
				'bg-base-200 text-base-content flex h-full min-h-0 w-full flex-col overflow-hidden md:flex-row',
				className,
			)}
			{...props}
		/>
	);
}
