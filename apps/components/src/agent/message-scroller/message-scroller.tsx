'use client';

import {
	MessageScroller as MessageScrollerPrimitive,
	useMessageScroller,
	useMessageScrollerScrollable,
	useMessageScrollerVisibility,
} from '@shadcn/react/message-scroller';
import { ArrowDown } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '@/lib/utils';

export type MessageScrollerMessages = {
	viewportLabel: string;
	scrollToEnd: string;
	scrollToStart: string;
};

export const defaultMessageScrollerMessages: MessageScrollerMessages = {
	viewportLabel: '消息记录',
	scrollToEnd: '滚动到底部',
	scrollToStart: '滚动到顶部',
};

export type MessageScrollerProviderProps = ComponentPropsWithRef<typeof MessageScrollerPrimitive.Provider>;

export function MessageScrollerProvider(props: MessageScrollerProviderProps) {
	return <MessageScrollerPrimitive.Provider {...props} />;
}

export type MessageScrollerProps = ComponentPropsWithRef<typeof MessageScrollerPrimitive.Root>;

export function MessageScroller({ className, ...props }: MessageScrollerProps) {
	return (
		<MessageScrollerPrimitive.Root
			data-slot='message-scroller'
			className={cn(
				'group/message-scroller relative flex size-full min-h-0 min-w-0 flex-col overflow-hidden',
				className,
			)}
			{...props}
		/>
	);
}

export type MessageScrollerViewportProps = ComponentPropsWithRef<typeof MessageScrollerPrimitive.Viewport> & {
	messages?: Partial<MessageScrollerMessages>;
};

export function MessageScrollerViewport({ className, messages, ...props }: MessageScrollerViewportProps) {
	const copy = { ...defaultMessageScrollerMessages, ...messages };
	return (
		<MessageScrollerPrimitive.Viewport
			aria-label={copy.viewportLabel}
			data-slot='message-scroller-viewport'
			className={cn(
				'size-full min-h-0 min-w-0 [scrollbar-gutter:stable] overflow-y-auto overscroll-contain [contain:content] data-autoscrolling:scroll-smooth',
				className,
			)}
			{...props}
		/>
	);
}

export type MessageScrollerContentProps = ComponentPropsWithRef<typeof MessageScrollerPrimitive.Content>;

export function MessageScrollerContent({ className, ...props }: MessageScrollerContentProps) {
	return (
		<MessageScrollerPrimitive.Content
			data-slot='message-scroller-content'
			className={cn('flex h-max min-h-full min-w-0 flex-col gap-8', className)}
			{...props}
		/>
	);
}

export type MessageScrollerItemProps = ComponentPropsWithRef<typeof MessageScrollerPrimitive.Item>;

export function MessageScrollerItem({ className, scrollAnchor = false, ...props }: MessageScrollerItemProps) {
	return (
		<MessageScrollerPrimitive.Item
			data-slot='message-scroller-item'
			scrollAnchor={scrollAnchor}
			className={cn('min-w-0 shrink-0 [contain-intrinsic-size:auto_10rem] [content-visibility:auto]', className)}
			{...props}
		/>
	);
}

export type MessageScrollerButtonProps = ComponentPropsWithRef<typeof MessageScrollerPrimitive.Button> & {
	messages?: Partial<MessageScrollerMessages>;
};

export function MessageScrollerButton({
	direction = 'end',
	className,
	children,
	messages,
	...props
}: MessageScrollerButtonProps) {
	const copy = { ...defaultMessageScrollerMessages, ...messages };
	return (
		<MessageScrollerPrimitive.Button
			data-slot='message-scroller-button'
			data-direction={direction}
			direction={direction}
			className={cn(
				'btn btn-circle btn-sm border-border bg-background text-foreground hover:bg-muted hover:text-foreground absolute start-1/2 size-8 min-h-8 min-w-8 -translate-x-1/2 p-0 shadow-sm transition-[translate,scale,opacity] duration-200 data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[direction=end]:bottom-4 data-[direction=end]:data-[active=false]:translate-y-full data-[direction=start]:top-4 data-[direction=start]:data-[active=false]:-translate-y-full rtl:translate-x-1/2 data-[direction=start]:[&_svg]:rotate-180',
				className,
			)}
			{...props}
		>
			{children ?? (
				<>
					<ArrowDown aria-hidden='true' className='size-4' />
					<span className='sr-only'>{direction === 'end' ? copy.scrollToEnd : copy.scrollToStart}</span>
				</>
			)}
		</MessageScrollerPrimitive.Button>
	);
}

export type {
	MessageScrollerDefaultScrollPosition,
	MessageScrollerScrollAlign,
	MessageScrollerScrollable,
	MessageScrollerScrollOptions,
	MessageScrollerVisibilityState,
} from '@shadcn/react/message-scroller';
export { useMessageScroller, useMessageScrollerScrollable, useMessageScrollerVisibility };
