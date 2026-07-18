import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { LoaderSize, LoaderVariant } from './loader';
import { Loader } from './loader';

export type PendingButtonProps = ComponentPropsWithRef<'button'> & {
	pending?: boolean;
	pendingLabel?: ReactNode;
	pendingAriaLabel?: string;
	loaderVariant?: LoaderVariant;
	loaderSize?: LoaderSize;
};

export function PendingButton({
	pending = false,
	pendingLabel = '处理中',
	pendingAriaLabel,
	loaderVariant = 'spinner',
	loaderSize = 'xs',
	disabled,
	type = 'button',
	children,
	className,
	'aria-label': ariaLabel,
	...props
}: PendingButtonProps) {
	const inferredIdleLabel = typeof children === 'string' || typeof children === 'number' ? String(children) : undefined;
	const inferredPendingLabel =
		typeof pendingLabel === 'string' || typeof pendingLabel === 'number' ? String(pendingLabel) : undefined;
	return (
		<button
			data-slot='pending-button'
			data-pending={pending ? 'true' : 'false'}
			type={type}
			disabled={disabled || pending}
			aria-busy={pending || undefined}
			aria-label={pending ? (pendingAriaLabel ?? inferredPendingLabel ?? ariaLabel) : (ariaLabel ?? inferredIdleLabel)}
			className={cn('btn', className)}
			{...props}
		>
			<span className='grid min-w-0 place-items-center'>
				<span
					aria-hidden={pending || undefined}
					className={cn('col-start-1 row-start-1 inline-flex min-w-0 items-center gap-2', pending && 'invisible')}
				>
					{children}
				</span>
				<span
					aria-hidden={!pending || undefined}
					className={cn('col-start-1 row-start-1 inline-flex min-w-0 items-center gap-2', !pending && 'invisible')}
				>
					<Loader decorative size={loaderSize} variant={loaderVariant} />
					{pendingLabel}
				</span>
			</span>
		</button>
	);
}
