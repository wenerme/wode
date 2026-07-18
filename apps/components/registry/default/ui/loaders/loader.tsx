import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Children } from 'react';
import { cn } from '@/lib/utils';

export type LoaderVariant = 'spinner' | 'dots' | 'bars' | 'ring';
export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg';

const variantClass: Record<LoaderVariant, string> = {
	spinner: 'loading-spinner',
	dots: 'loading-dots',
	bars: 'loading-bars',
	ring: 'loading-ring',
};

const sizeClass: Record<LoaderSize, string> = {
	xs: 'loading-xs',
	sm: 'loading-sm',
	md: 'loading-md',
	lg: 'loading-lg',
};

function hasNode(value: ReactNode) {
	return Children.toArray(value).some((node) => typeof node !== 'string' || node.trim().length > 0);
}

export type LoaderProps = Omit<ComponentPropsWithRef<'span'>, 'children'> & {
	variant?: LoaderVariant;
	size?: LoaderSize;
	label?: string;
	decorative?: boolean;
};

export function Loader({
	variant = 'spinner',
	size = 'sm',
	label = '加载中',
	decorative = false,
	className,
	role,
	'aria-label': ariaLabel,
	'aria-hidden': ariaHidden,
	...props
}: LoaderProps) {
	return (
		<span
			data-slot='loader'
			data-variant={variant}
			data-size={size}
			role={decorative ? undefined : (role ?? 'status')}
			aria-live={decorative ? undefined : 'polite'}
			aria-label={decorative ? undefined : (ariaLabel ?? label)}
			aria-hidden={decorative ? true : ariaHidden}
			className={cn('inline-grid shrink-0 place-items-center align-middle leading-none', className)}
			{...props}
		>
			<span
				aria-hidden='true'
				className={cn('loading motion-reduce:animate-none', variantClass[variant], sizeClass[size])}
			/>
		</span>
	);
}

export type LoadingIndicatorLayout = 'inline' | 'section' | 'page';

export type LoadingIndicatorProps = ComponentPropsWithRef<'div'> & {
	variant?: LoaderVariant;
	size?: LoaderSize;
	layout?: LoadingIndicatorLayout;
	label?: ReactNode;
	description?: ReactNode;
	loaderLabel?: string;
	contentClassName?: string;
};

const layoutClass: Record<LoadingIndicatorLayout, string> = {
	inline: 'inline-flex min-h-0 flex-row items-center gap-2 text-left',
	section: 'flex min-h-40 flex-col items-center justify-center gap-2 text-center',
	page: 'flex min-h-[24rem] flex-col items-center justify-center gap-3 text-center',
};

export function LoadingIndicator({
	variant = 'dots',
	size = 'md',
	layout = 'section',
	label = '正在加载',
	description,
	loaderLabel = '加载中',
	contentClassName,
	className,
	'aria-label': ariaLabel,
	...props
}: LoadingIndicatorProps) {
	const showLabel = hasNode(label);
	const showDescription = hasNode(description);
	return (
		<div
			data-slot='loading-indicator'
			data-layout={layout}
			role='status'
			aria-live='polite'
			aria-busy='true'
			aria-label={ariaLabel ?? (showLabel ? undefined : loaderLabel)}
			className={cn('text-base-content min-w-0', layoutClass[layout], className)}
			{...props}
		>
			<Loader decorative variant={variant} size={size} />
			{showLabel || showDescription ? (
				<div className={cn('min-w-0', layout === 'inline' && 'flex items-baseline gap-2', contentClassName)}>
					{showLabel ? <div className='text-sm font-medium'>{label}</div> : null}
					{showDescription ? <div className='text-base-content/65 text-xs leading-5'>{description}</div> : null}
				</div>
			) : null}
		</div>
	);
}
