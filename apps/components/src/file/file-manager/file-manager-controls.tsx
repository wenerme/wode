'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function FileManagerNavigationButton({
	active,
	children,
	className,
	label,
	...props
}: ComponentPropsWithRef<'button'> & { active?: boolean; label: string }) {
	return (
		<button
			type='button'
			aria-label={label}
			title={label}
			aria-pressed={active}
			className={cn(
				'grid size-7 shrink-0 place-items-center rounded-md disabled:cursor-not-allowed disabled:opacity-35',
				active ? 'bg-base-300' : 'hover:bg-base-300/60',
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
}

export function FileManagerCommandButton({
	children,
	danger,
	label,
	...props
}: ComponentPropsWithRef<'button'> & { danger?: boolean; label: string }) {
	return (
		<button
			type='button'
			aria-label={label}
			title={label}
			className={cn(
				'hover:bg-base-200 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs disabled:cursor-not-allowed disabled:opacity-35',
				danger && 'text-error hover:bg-error/10',
			)}
			{...props}
		>
			{children}
			<span className='hidden 2xl:inline'>{label}</span>
		</button>
	);
}

export function FileManagerViewButton({
	active,
	children,
	label,
	onClick,
}: {
	active: boolean;
	children: ReactNode;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type='button'
			aria-label={label}
			title={label}
			aria-pressed={active}
			className={cn(
				'grid size-6 place-items-center rounded-sm',
				active ? 'bg-neutral text-neutral-content' : 'hover:bg-base-200',
			)}
			onClick={onClick}
		>
			{children}
		</button>
	);
}
