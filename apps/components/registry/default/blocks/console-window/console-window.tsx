import { Maximize2, Minus, X } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ConsoleWindowProps = ComponentPropsWithRef<'section'> & {
	active?: boolean;
	titleBar?: ReactNode;
	toolbar?: ReactNode;
	statusBar?: ReactNode;
};

export function ConsoleWindow({
	active = true,
	titleBar,
	toolbar,
	statusBar,
	children,
	className,
	...props
}: ConsoleWindowProps) {
	return (
		<section
			data-active={active || undefined}
			className={cn(
				'border-base-300 bg-base-100 flex min-h-64 min-w-0 flex-col overflow-hidden border shadow-sm',
				'data-[active=true]:border-primary/35 rounded-md data-[active=true]:shadow-md',
				className,
			)}
			{...props}
		>
			{titleBar}
			{toolbar}
			<div className='min-h-0 min-w-0 flex-1 overflow-auto'>{children}</div>
			{statusBar}
		</section>
	);
}

export type ConsoleWindowTitleBarProps = Omit<ComponentPropsWithRef<'header'>, 'title'> & {
	icon?: ReactNode;
	title?: ReactNode;
	subtitle?: ReactNode;
	actions?: ReactNode;
	controls?: ReactNode;
};

export function ConsoleWindowTitleBar({
	icon,
	title,
	subtitle,
	actions,
	controls,
	children,
	className,
	...props
}: ConsoleWindowTitleBarProps) {
	return (
		<header
			className={cn('border-base-300 bg-base-200/65 flex h-11 shrink-0 items-center gap-2 border-b px-2', className)}
			{...props}
		>
			{icon ? <span className='text-base-content/55 grid size-7 shrink-0 place-items-center'>{icon}</span> : null}
			<div className='min-w-0 flex-1'>
				{title ? <div className='truncate text-sm font-medium'>{title}</div> : null}
				{subtitle ? <div className='text-base-content/65 truncate text-[11px]'>{subtitle}</div> : null}
			</div>
			{children}
			{actions ? <div className='flex items-center gap-1'>{actions}</div> : null}
			{controls}
		</header>
	);
}

export type ConsoleWindowControlsProps = ComponentPropsWithRef<'div'> & {
	onMinimize?: () => void;
	onMaximize?: () => void;
	onClose?: () => void;
};

export function ConsoleWindowControls({
	onMinimize,
	onMaximize,
	onClose,
	className,
	...props
}: ConsoleWindowControlsProps) {
	return (
		<div className={cn('ml-1 flex items-center', className)} {...props}>
			{onMinimize ? (
				<button
					type='button'
					aria-label='最小化'
					title='最小化'
					className='hover:bg-base-300/70 grid size-8 place-items-center'
					onClick={onMinimize}
				>
					<Minus className='size-3.5' />
				</button>
			) : null}
			{onMaximize ? (
				<button
					type='button'
					aria-label='最大化'
					title='最大化'
					className='hover:bg-base-300/70 grid size-8 place-items-center'
					onClick={onMaximize}
				>
					<Maximize2 className='size-3.5' />
				</button>
			) : null}
			{onClose ? (
				<button
					type='button'
					aria-label='关闭'
					title='关闭'
					className='hover:bg-error hover:text-error-content grid size-8 place-items-center'
					onClick={onClose}
				>
					<X className='size-4' />
				</button>
			) : null}
		</div>
	);
}

export type ConsoleWindowToolbarProps = ComponentPropsWithRef<'div'>;

export function ConsoleWindowToolbar({ className, ...props }: ConsoleWindowToolbarProps) {
	return (
		<div
			className={cn('border-base-300 flex min-h-9 shrink-0 items-center gap-1 border-b px-2 py-1', className)}
			{...props}
		/>
	);
}

export type ConsoleWindowContentProps = ComponentPropsWithRef<'div'>;

export function ConsoleWindowContent({ className, ...props }: ConsoleWindowContentProps) {
	return <div className={cn('min-h-full p-4', className)} {...props} />;
}

export type ConsoleWindowStatusBarProps = ComponentPropsWithRef<'footer'>;

export function ConsoleWindowStatusBar({ className, ...props }: ConsoleWindowStatusBarProps) {
	return (
		<footer
			className={cn(
				'border-base-300 text-base-content/65 flex min-h-7 shrink-0 items-center gap-2 border-t px-2 text-[11px]',
				className,
			)}
			{...props}
		/>
	);
}

export type ConsoleWindowWorkspaceProps = ComponentPropsWithRef<'div'>;

export function ConsoleWindowWorkspace({ className, ...props }: ConsoleWindowWorkspaceProps) {
	return (
		<div
			className={cn(
				'bg-base-200 grid min-h-[32rem] grid-cols-1 gap-3 p-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]',
				className,
			)}
			{...props}
		/>
	);
}
