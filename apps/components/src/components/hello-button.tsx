import { Hand } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '@/lib/utils';

export type HelloButtonProps = ComponentPropsWithRef<'button'>;

export function HelloButton({
	children = 'Hello from Wener Components!',
	className,
	type = 'button',
	...props
}: HelloButtonProps) {
	return (
		<button type={type} className={cn('btn btn-primary', className)} {...props}>
			<Hand className='size-4' aria-hidden />
			{children}
		</button>
	);
}
