import type { ComponentPropsWithRef } from 'react';
import { cn } from '@/lib/utils';

export type MessageGroupProps = ComponentPropsWithRef<'div'>;

export function MessageGroup({ className, ...props }: MessageGroupProps) {
	return <div data-slot='message-group' className={cn('flex min-w-0 flex-col gap-2', className)} {...props} />;
}

export type MessageProps = ComponentPropsWithRef<'div'> & {
	align?: 'start' | 'end';
};

export function Message({ className, align = 'start', ...props }: MessageProps) {
	return (
		<div
			data-slot='message'
			data-align={align}
			className={cn(
				'group/message relative flex w-full min-w-0 gap-2 text-sm data-[align=end]:flex-row-reverse',
				className,
			)}
			{...props}
		/>
	);
}

export type MessageAvatarProps = ComponentPropsWithRef<'div'>;

export function MessageAvatar({ className, ...props }: MessageAvatarProps) {
	return (
		<div
			data-slot='message-avatar'
			className={cn(
				'bg-muted flex min-h-8 w-fit min-w-8 shrink-0 items-center justify-center self-end overflow-hidden rounded-full group-has-data-[slot=message-footer]/message:-translate-y-8',
				className,
			)}
			{...props}
		/>
	);
}

export type MessageContentProps = ComponentPropsWithRef<'div'>;

export function MessageContent({ className, ...props }: MessageContentProps) {
	return (
		<div
			data-slot='message-content'
			className={cn(
				'flex w-full min-w-0 flex-col gap-2.5 wrap-break-word group-data-[align=end]/message:*:data-slot:self-end',
				className,
			)}
			{...props}
		/>
	);
}

export type MessageHeaderProps = ComponentPropsWithRef<'div'>;

export function MessageHeader({ className, ...props }: MessageHeaderProps) {
	return (
		<div
			data-slot='message-header'
			className={cn(
				'text-muted-foreground flex max-w-full min-w-0 items-center px-3 text-xs font-medium group-has-data-[variant=ghost]/message:px-0',
				className,
			)}
			{...props}
		/>
	);
}

export type MessageFooterProps = ComponentPropsWithRef<'div'>;

export function MessageFooter({ className, ...props }: MessageFooterProps) {
	return (
		<div
			data-slot='message-footer'
			className={cn(
				'text-muted-foreground flex max-w-full min-w-0 items-center gap-2 px-3 text-xs font-medium group-has-data-[variant=ghost]/message:px-0 group-data-[align=end]/message:justify-end',
				className,
			)}
			{...props}
		/>
	);
}
