import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';
export type StatusVariant = 'plain' | 'soft' | 'solid' | 'outline';
export type StatusSize = 'xs' | 'sm' | 'md';

const statusToneClass: Record<StatusVariant, Record<StatusTone, string>> = {
	plain: {
		neutral: 'text-base-content',
		info: 'text-base-content',
		success: 'text-base-content',
		warning: 'text-base-content',
		danger: 'text-base-content',
		muted: 'text-base-content',
	},
	soft: {
		neutral: 'border-base-300 bg-base-200 text-base-content',
		info: 'border-info/25 bg-info/4 text-base-content',
		success: 'border-success/25 bg-success/4 text-base-content',
		warning: 'border-warning/30 bg-warning/4 text-base-content',
		danger: 'border-error/25 bg-error/4 text-base-content',
		muted: 'border-base-300 bg-base-200/70 text-base-content',
	},
	solid: {
		neutral: 'border-base-content bg-base-content text-base-100',
		info: 'border-info bg-base-content text-base-100',
		success: 'border-success bg-base-content text-base-100',
		warning: 'border-warning bg-base-content text-base-100',
		danger: 'border-error bg-base-content text-base-100',
		muted: 'border-base-300 bg-base-content text-base-100',
	},
	outline: {
		neutral: 'border-base-300 bg-base-100 text-base-content',
		info: 'border-info/45 bg-base-100 text-base-content',
		success: 'border-success/45 bg-base-100 text-base-content',
		warning: 'border-warning/55 bg-base-100 text-base-content',
		danger: 'border-error/45 bg-base-100 text-base-content',
		muted: 'border-base-300 bg-base-100 text-base-content',
	},
};

const statusSizeClass: Record<StatusSize, string> = {
	xs: 'h-5 gap-1 text-[11px]',
	sm: 'h-6 gap-1.5 text-xs',
	md: 'h-7 gap-1.5 text-sm',
};

const statusPaddingClass: Record<StatusSize, string> = {
	xs: 'px-1.5',
	sm: 'px-2',
	md: 'px-2.5',
};

const statusDotClass: Record<StatusTone, string> = {
	neutral: 'bg-base-content/65',
	info: 'bg-info',
	success: 'bg-success',
	warning: 'bg-warning',
	danger: 'bg-error',
	muted: 'bg-base-content/35',
};

export type StatusProps = ComponentPropsWithRef<'span'> & {
	tone?: StatusTone;
	variant?: StatusVariant;
	size?: StatusSize;
	icon?: ReactNode;
	dot?: boolean;
};

export function Status({
	tone = 'neutral',
	variant = 'plain',
	size = 'sm',
	icon,
	dot,
	children,
	className,
	...props
}: StatusProps) {
	const showDot = dot ?? ((variant === 'plain' || variant === 'solid') && !icon);
	const isPlain = variant === 'plain';

	return (
		<span
			data-slot='status'
			data-tone={tone}
			data-variant={variant}
			data-size={size}
			className={cn(
				'inline-flex max-w-full shrink-0 items-center align-middle leading-none whitespace-nowrap',
				statusSizeClass[size],
				statusToneClass[variant][tone],
				isPlain ? 'font-medium' : ['rounded-full border font-semibold', statusPaddingClass[size]],
				className,
			)}
			{...props}
		>
			{showDot ? (
				<span aria-hidden='true' className={cn('size-1.5 shrink-0 rounded-full', statusDotClass[tone])} />
			) : null}
			{icon ? <span className='grid size-3.5 shrink-0 place-items-center'>{icon}</span> : null}
			<span className='min-w-0 truncate'>{children}</span>
		</span>
	);
}
