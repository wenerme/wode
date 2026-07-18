'use client';

import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Ellipsis, Expand, Maximize2, Minimize2, Minus, Pin, PinOff, Shrink, X } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { WindowManagerWindowMode } from './window-manager-types';

export const WINDOW_MANAGER_DRAG_HANDLE_CLASS = 'window-manager-drag-handle';

export type WindowManagerFrameProps = ComponentPropsWithRef<'section'> & {
	active?: boolean;
	mode?: WindowManagerWindowMode;
};

export function WindowManagerFrame({ active, mode = 'normal', className, ...props }: WindowManagerFrameProps) {
	return (
		<section
			data-active={active || undefined}
			data-mode={mode}
			className={cn(
				'border-base-300 bg-base-100 flex size-full min-h-0 min-w-0 flex-col overflow-hidden border shadow-lg outline-none',
				'data-[active=true]:border-primary/50 rounded-md data-[active=true]:shadow-xl',
				'data-[mode=fullscreen]:rounded-none data-[mode=maximized]:rounded-none',
				'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-inset',
				className,
			)}
			{...props}
		/>
	);
}

export type WindowManagerTitleBarProps = Omit<ComponentPropsWithRef<'header'>, 'title'> & {
	actions?: ReactNode;
	controls?: ReactNode;
	icon?: ReactNode;
	subtitle?: ReactNode;
	title?: ReactNode;
};

export function WindowManagerTitleBar({
	actions,
	children,
	className,
	controls,
	icon,
	subtitle,
	title,
	...props
}: WindowManagerTitleBarProps) {
	return (
		<header
			className={cn(
				WINDOW_MANAGER_DRAG_HANDLE_CLASS,
				'border-base-300 bg-base-200/80 flex h-10 shrink-0 cursor-default touch-none items-center gap-2 border-b px-1.5 select-none',
				className,
			)}
			{...props}
		>
			{icon ? <span className='text-base-content/60 grid size-7 shrink-0 place-items-center'>{icon}</span> : null}
			<div className='min-w-0 flex-1 px-0.5'>
				{title ? <div className='truncate text-sm font-medium'>{title}</div> : null}
				{subtitle ? <div className='text-base-content/60 truncate text-[10px]'>{subtitle}</div> : null}
			</div>
			{children}
			{actions ? (
				<div data-window-drag-cancel className='flex shrink-0 items-center gap-1'>
					{actions}
				</div>
			) : null}
			{controls}
		</header>
	);
}

export type WindowManagerControlsProps = ComponentPropsWithRef<'div'> & {
	canClose?: boolean;
	canFullscreen?: boolean;
	canMaximize?: boolean;
	canMinimize?: boolean;
	mode?: WindowManagerWindowMode;
	menu?: ReactNode;
	onClose?: () => void;
	onFullscreen?: () => void;
	onMaximize?: () => void;
	onMinimize?: () => void;
};

export function WindowManagerControls({
	canClose = true,
	canFullscreen = true,
	canMaximize = true,
	canMinimize = true,
	className,
	menu,
	mode = 'normal',
	onClose,
	onFullscreen,
	onMaximize,
	onMinimize,
	...props
}: WindowManagerControlsProps) {
	return (
		<div data-window-drag-cancel className={cn('ml-1 flex shrink-0 items-center', className)} {...props}>
			{menu}
			<WindowControl
				label='最小化'
				disabled={!canMinimize || !onMinimize}
				onClick={onMinimize}
				icon={<Minus className='size-3.5' />}
			/>
			<WindowControl
				label={mode === 'maximized' ? '还原' : '最大化'}
				disabled={!canMaximize || !onMaximize}
				onClick={onMaximize}
				icon={mode === 'maximized' ? <Minimize2 className='size-3.5' /> : <Maximize2 className='size-3.5' />}
			/>
			<WindowControl
				label={mode === 'fullscreen' ? '退出全屏' : '工作区全屏'}
				disabled={!canFullscreen || !onFullscreen}
				onClick={onFullscreen}
				icon={mode === 'fullscreen' ? <Shrink className='size-3.5' /> : <Expand className='size-3.5' />}
			/>
			<WindowControl
				label='关闭'
				disabled={!canClose || !onClose}
				onClick={onClose}
				icon={<X className='size-4' />}
				className='hover:bg-error hover:text-error-content'
			/>
		</div>
	);
}

export type WindowManagerMenuProps = {
	children?: ReactNode;
	onPinnedChange: (pinned: boolean) => void;
	pinned?: boolean;
	zIndex?: number;
};

export function WindowManagerMenu({
	children,
	onPinnedChange,
	pinned = false,
	zIndex = 11_000,
}: WindowManagerMenuProps) {
	return (
		<BaseMenu.Root>
			<BaseMenu.Trigger
				aria-label='窗口菜单'
				title='窗口菜单'
				data-window-drag-cancel
				className={windowControlClassName}
			>
				<Ellipsis className='size-4' />
			</BaseMenu.Trigger>
			<BaseMenu.Portal>
				<BaseMenu.Positioner align='end' side='bottom' sideOffset={4} className='outline-none' style={{ zIndex }}>
					<BaseMenu.Popup className='border-base-300 bg-base-100 text-base-content min-w-44 rounded-md border p-1 shadow-xl outline-none'>
						<WindowManagerMenuItem onClick={() => onPinnedChange(!pinned)}>
							{pinned ? <PinOff className='size-4' /> : <Pin className='size-4' />}
							<span>{pinned ? '取消置顶' : '窗口置顶'}</span>
						</WindowManagerMenuItem>
						{children ? (
							<>
								<WindowManagerMenuSeparator />
								{children}
							</>
						) : null}
					</BaseMenu.Popup>
				</BaseMenu.Positioner>
			</BaseMenu.Portal>
		</BaseMenu.Root>
	);
}

export type WindowManagerMenuItemProps = ComponentPropsWithRef<typeof BaseMenu.Item>;

export function WindowManagerMenuItem({ className, ...props }: WindowManagerMenuItemProps) {
	return (
		<BaseMenu.Item
			className={cn(
				'flex min-h-8 cursor-default items-center gap-2 rounded-sm px-2 text-sm outline-none select-none',
				'data-[highlighted]:bg-base-200 data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
				className,
			)}
			{...props}
		/>
	);
}

export type WindowManagerMenuSeparatorProps = ComponentPropsWithRef<typeof BaseMenu.Separator>;

export function WindowManagerMenuSeparator({ className, ...props }: WindowManagerMenuSeparatorProps) {
	return <BaseMenu.Separator className={cn('bg-base-300 my-1 h-px', className)} {...props} />;
}

export type WindowManagerToolbarProps = ComponentPropsWithRef<'div'>;

export function WindowManagerToolbar({ className, ...props }: WindowManagerToolbarProps) {
	return (
		<div
			data-window-drag-cancel
			className={cn('border-base-300 flex min-h-9 shrink-0 items-center gap-1 border-b px-2 py-1', className)}
			{...props}
		/>
	);
}

export type WindowManagerContentProps = ComponentPropsWithRef<'div'>;

export function WindowManagerContent({ className, ...props }: WindowManagerContentProps) {
	return <div data-window-drag-cancel className={cn('min-h-0 min-w-0 flex-1 overflow-auto', className)} {...props} />;
}

export type WindowManagerStatusBarProps = ComponentPropsWithRef<'footer'>;

export function WindowManagerStatusBar({ className, ...props }: WindowManagerStatusBarProps) {
	return (
		<footer
			data-window-drag-cancel
			className={cn(
				'border-base-300 text-base-content/65 flex min-h-7 shrink-0 items-center gap-2 border-t px-2 text-[11px]',
				className,
			)}
			{...props}
		/>
	);
}

function WindowControl({
	className,
	disabled,
	icon,
	label,
	onClick,
}: {
	className?: string;
	disabled?: boolean;
	icon: ReactNode;
	label: string;
	onClick?: () => void;
}) {
	return (
		<button
			type='button'
			aria-label={label}
			title={label}
			disabled={disabled}
			className={cn(windowControlClassName, className)}
			onClick={onClick}
		>
			{icon}
		</button>
	);
}

const windowControlClassName = cn(
	'hover:bg-base-300/80 grid size-8 place-items-center disabled:pointer-events-none disabled:opacity-35',
	'focus-visible:ring-primary focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none',
);
