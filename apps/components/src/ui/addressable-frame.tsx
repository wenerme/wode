import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AddressableFrameProps = ComponentPropsWithRef<'section'>;

export function AddressableFrame({ className, ...props }: AddressableFrameProps) {
	return (
		<section
			data-slot='addressable-frame'
			className={cn(
				'border-base-300 bg-base-100 flex min-h-72 min-w-0 flex-col overflow-hidden rounded-md border',
				className,
			)}
			{...props}
		/>
	);
}

export type AddressableFrameBarProps = ComponentPropsWithRef<'div'>;

export function AddressableFrameBar({ className, ...props }: AddressableFrameBarProps) {
	return (
		<div
			data-slot='addressable-frame-bar'
			className={cn(
				'border-base-300 bg-base-200/50 flex min-h-10 shrink-0 items-center gap-1 border-b px-2 py-1.5',
				className,
			)}
			{...props}
		/>
	);
}

export type AddressableFrameNavigationProps = ComponentPropsWithRef<'nav'>;

export function AddressableFrameNavigation({ className, ...props }: AddressableFrameNavigationProps) {
	return (
		<nav
			data-slot='addressable-frame-navigation'
			className={cn('flex shrink-0 items-center gap-0.5', className)}
			{...props}
		/>
	);
}

export type AddressableFrameAddressProps = ComponentPropsWithRef<'div'> & {
	icon?: ReactNode;
};

export function AddressableFrameAddress({ icon, children, className, ...props }: AddressableFrameAddressProps) {
	return (
		<div
			data-slot='addressable-frame-address'
			className={cn(
				'border-base-300 bg-base-100 flex h-7 min-w-0 flex-1 items-center gap-2 rounded-sm border px-2 text-xs',
				'focus-within:border-primary focus-within:ring-primary/30 focus-within:ring-1',
				className,
			)}
			{...props}
		>
			{icon ? (
				<span data-slot='addressable-frame-address-icon' className='text-base-content/45 shrink-0'>
					{icon}
				</span>
			) : null}
			<div data-slot='addressable-frame-address-value' className='min-w-0 flex-1 truncate'>
				{children}
			</div>
		</div>
	);
}

export type AddressableFrameAddressInputProps = ComponentPropsWithRef<'input'>;

export function AddressableFrameAddressInput({ className, ...props }: AddressableFrameAddressInputProps) {
	return (
		<input
			data-slot='addressable-frame-address-input'
			className={cn('placeholder:text-base-content/35 w-full min-w-0 bg-transparent outline-none', className)}
			{...props}
		/>
	);
}

export type AddressableFrameActionsProps = ComponentPropsWithRef<'div'>;

export function AddressableFrameActions({ className, ...props }: AddressableFrameActionsProps) {
	return (
		<div
			data-slot='addressable-frame-actions'
			className={cn('flex shrink-0 items-center gap-0.5', className)}
			{...props}
		/>
	);
}

export type AddressableFrameTitleElement = 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type AddressableFrameHeaderProps = Omit<ComponentPropsWithRef<'header'>, 'title'> & {
	title?: ReactNode;
	titleAs?: AddressableFrameTitleElement;
	titleId?: string;
	description?: ReactNode;
	actions?: ReactNode;
};

export function AddressableFrameHeader({
	title,
	titleAs: Title = 'h2',
	titleId,
	description,
	actions,
	children,
	className,
	...props
}: AddressableFrameHeaderProps) {
	return (
		<header
			data-slot='addressable-frame-header'
			className={cn('border-base-300 flex min-h-10 shrink-0 items-start gap-2 border-b px-3 py-2', className)}
			{...props}
		>
			{title || description ? (
				<div className='min-w-0 flex-1'>
					{title ? (
						<Title
							id={titleId}
							title={typeof title === 'string' ? title : undefined}
							className='text-xs font-medium break-words sm:truncate'
						>
							{title}
						</Title>
					) : null}
					{description ? (
						<div
							title={typeof description === 'string' ? description : undefined}
							className='text-base-content/60 mt-0.5 text-[11px] break-words sm:truncate'
						>
							{description}
						</div>
					) : null}
				</div>
			) : null}
			{children}
			{actions ? <div className='ml-auto flex shrink-0 items-center gap-1'>{actions}</div> : null}
		</header>
	);
}

export type AddressableFrameContentProps = ComponentPropsWithRef<'div'>;

export function AddressableFrameContent({ className, ...props }: AddressableFrameContentProps) {
	return (
		<div
			data-slot='addressable-frame-content'
			className={cn('min-h-0 min-w-0 flex-1 overflow-auto', className)}
			{...props}
		/>
	);
}

export type AddressableFrameFooterProps = ComponentPropsWithRef<'footer'>;

export function AddressableFrameFooter({ className, ...props }: AddressableFrameFooterProps) {
	return (
		<footer
			data-slot='addressable-frame-footer'
			className={cn(
				'border-base-300 text-base-content/65 flex min-h-7 shrink-0 items-center gap-2 border-t px-2 text-[11px]',
				className,
			)}
			{...props}
		/>
	);
}
