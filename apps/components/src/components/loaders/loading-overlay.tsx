import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { LoaderSize, LoaderVariant } from './loader';
import { LoadingIndicator } from './loader';

export type LoadingOverlayBackdrop = 'subtle' | 'solid' | 'transparent';

export type LoadingOverlayProps = ComponentPropsWithRef<'div'> & {
	active?: boolean;
	label?: ReactNode;
	description?: ReactNode;
	variant?: LoaderVariant;
	size?: LoaderSize;
	backdrop?: LoadingOverlayBackdrop;
	contentClassName?: string;
};

const backdropClass: Record<LoadingOverlayBackdrop, string> = {
	subtle: 'bg-base-100/70 backdrop-blur-[1px]',
	solid: 'bg-base-100',
	transparent: 'bg-transparent',
};

export function LoadingOverlay({
	active = false,
	label = '正在刷新',
	description,
	variant = 'spinner',
	size = 'md',
	backdrop = 'subtle',
	contentClassName,
	children,
	className,
	...props
}: LoadingOverlayProps) {
	return (
		<div
			data-slot='loading-overlay'
			data-active={active ? 'true' : 'false'}
			aria-busy={active || undefined}
			className={cn('relative min-w-0', className)}
			{...props}
		>
			<div
				data-slot='loading-overlay-content'
				inert={active || undefined}
				aria-hidden={active || undefined}
				className={cn('min-w-0', contentClassName)}
			>
				{children}
			</div>
			{active ? (
				<div
					data-slot='loading-overlay-backdrop'
					className={cn('absolute inset-0 z-10 grid place-items-center', backdropClass[backdrop])}
				>
					<LoadingIndicator
						className='bg-base-100/90 rounded-box border-base-300 max-w-[min(90%,24rem)] border px-4 py-3 shadow-sm'
						contentClassName='block'
						layout='inline'
						label={label}
						description={description}
						variant={variant}
						size={size}
					/>
				</div>
			) : null}
		</div>
	);
}
