import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ConsoleShellProps = ComponentPropsWithRef<'div'> & {
	rail?: ReactNode;
	sidebar?: ReactNode;
	header?: ReactNode;
	dock?: ReactNode;
};

export function ConsoleShell({ rail, sidebar, header, dock, children, className, ...props }: ConsoleShellProps) {
	return (
		<div
			data-console-density=''
			className={cn(
				'bg-base-200 text-base-content flex h-dvh min-h-[32rem] w-full flex-col overflow-hidden md:flex-row',
				className,
			)}
			{...props}
		>
			{rail}
			{sidebar}
			<div className='flex min-h-0 min-w-0 flex-1 flex-col'>
				{header}
				{children}
			</div>
			{dock}
		</div>
	);
}

export type ConsoleRailProps = ComponentPropsWithRef<'aside'>;

export function ConsoleRail({ className, 'aria-label': ariaLabel, ...props }: ConsoleRailProps) {
	return (
		<aside
			aria-label={ariaLabel ?? '全局导航'}
			className={cn(
				'border-base-300 bg-base-100 relative z-30 flex h-14 w-full shrink-0 items-center border-b px-2',
				'md:h-full md:w-14 md:flex-col md:border-r md:border-b-0 md:px-0 md:py-2',
				className,
			)}
			{...props}
		/>
	);
}

export type ConsoleRailSectionProps = ComponentPropsWithRef<'div'> & {
	grow?: boolean;
};

export function ConsoleRailSection({ grow, className, ...props }: ConsoleRailSectionProps) {
	return (
		<div
			className={cn(
				'flex min-w-0 items-center gap-1 md:w-full md:flex-col',
				grow && 'flex-1 overflow-x-auto md:min-h-0 md:overflow-visible',
				className,
			)}
			{...props}
		/>
	);
}

export type ConsoleRailLinkProps = Omit<ComponentPropsWithRef<'a'>, 'href' | 'title'> & {
	href: string;
	active?: boolean;
	icon: ReactNode;
	label: string;
};

export function ConsoleRailLink({ href, active, icon, label, className, ...props }: ConsoleRailLinkProps) {
	return (
		<a
			href={href}
			aria-current={active ? 'page' : undefined}
			aria-label={label}
			data-tip={label}
			className={cn(
				'tooltip tooltip-bottom text-base-content/65 grid size-10 shrink-0 place-items-center rounded-md transition-colors outline-none md:tooltip-right',
				'hover:bg-base-200 hover:text-base-content focus-visible:ring-primary focus-visible:ring-2',
				active && 'bg-neutral text-neutral-content',
				className,
			)}
			{...props}
		>
			{icon}
			<span className='sr-only'>{label}</span>
		</a>
	);
}

export type ConsoleSidebarProps = ComponentPropsWithRef<'aside'> & {
	collapsed?: boolean;
};

export function ConsoleSidebar({ collapsed, className, 'aria-label': ariaLabel, ...props }: ConsoleSidebarProps) {
	return (
		<aside
			aria-label={ariaLabel ?? '模块导航'}
			data-collapsed={collapsed || undefined}
			className={cn(
				'group/sidebar border-base-300 bg-base-100 relative z-20 h-full w-56 shrink-0 flex-col overflow-hidden border-r transition-[width] duration-150',
				'hidden data-[collapsed=true]:w-14 data-[collapsed=true]:overflow-visible md:flex',
				className,
			)}
			{...props}
		/>
	);
}

export type ConsoleSidebarHeaderProps = ComponentPropsWithRef<'div'>;

export function ConsoleSidebarHeader({ className, ...props }: ConsoleSidebarHeaderProps) {
	return (
		<div className={cn('border-base-300 flex h-14 shrink-0 items-center gap-3 border-b px-3', className)} {...props} />
	);
}

export type ConsoleSidebarNavProps = ComponentPropsWithRef<'nav'>;

export function ConsoleSidebarNav({ className, 'aria-label': ariaLabel, ...props }: ConsoleSidebarNavProps) {
	return (
		<nav
			aria-label={ariaLabel ?? '模块导航项'}
			className={cn(
				'flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2',
				'group-data-[collapsed=true]/sidebar:items-center group-data-[collapsed=true]/sidebar:overflow-visible',
				className,
			)}
			{...props}
		/>
	);
}

export type ConsoleSidebarFooterProps = ComponentPropsWithRef<'div'>;

export function ConsoleSidebarFooter({ className, ...props }: ConsoleSidebarFooterProps) {
	return <div className={cn('border-base-300 shrink-0 border-t p-2', className)} {...props} />;
}

export type ConsoleNavLinkProps = Omit<ComponentPropsWithRef<'a'>, 'href' | 'title'> & {
	href: string;
	active?: boolean;
	collapsed?: boolean;
	icon?: ReactNode;
	label: string;
	badge?: ReactNode;
};

export function ConsoleNavLink({
	href,
	active,
	collapsed,
	icon,
	label,
	badge,
	className,
	...props
}: ConsoleNavLinkProps) {
	return (
		<a
			href={href}
			aria-current={active ? 'page' : undefined}
			aria-label={collapsed ? label : undefined}
			data-tip={collapsed ? label : undefined}
			className={cn(
				'text-base-content/65 flex h-[var(--console-control-height)] min-w-0 items-center gap-2 rounded-md px-2 text-sm transition-colors outline-none',
				'hover:bg-base-200 hover:text-base-content focus-visible:ring-primary focus-visible:ring-2',
				active && 'bg-neutral text-neutral-content font-medium',
				collapsed && 'tooltip tooltip-right w-9 justify-center px-0',
				className,
			)}
			{...props}
		>
			{icon ? <span className='grid size-5 shrink-0 place-items-center'>{icon}</span> : null}
			{collapsed ? <span className='sr-only'>{label}</span> : <span className='min-w-0 flex-1 truncate'>{label}</span>}
			{!collapsed && badge ? (
				<span className={cn('shrink-0 text-xs', active ? 'text-current opacity-80' : 'text-base-content/65')}>
					{badge}
				</span>
			) : null}
		</a>
	);
}

export type ConsoleHeaderProps = Omit<ComponentPropsWithRef<'header'>, 'title'> & {
	prefix?: ReactNode;
	breadcrumbs?: ReactNode;
	title?: ReactNode;
	actions?: ReactNode;
};

export function ConsoleHeader({
	prefix,
	breadcrumbs,
	title,
	actions,
	children,
	className,
	...props
}: ConsoleHeaderProps) {
	return (
		<header
			className={cn(
				'border-base-300 bg-base-100 flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 md:px-5',
				className,
			)}
			{...props}
		>
			{prefix}
			<div className='min-w-0 flex-1'>
				{breadcrumbs ? <div className='text-base-content/65 truncate text-xs'>{breadcrumbs}</div> : null}
				{title ? <div className='truncate text-sm font-semibold'>{title}</div> : null}
			</div>
			{children}
			{actions ? <div className='flex shrink-0 items-center gap-1'>{actions}</div> : null}
		</header>
	);
}

export type ConsoleContentProps = ComponentPropsWithRef<'main'>;

export function ConsoleContent({ className, ...props }: ConsoleContentProps) {
	return <main className={cn('min-h-0 min-w-0 flex-1 overflow-auto', className)} {...props} />;
}

export type ConsoleDockProps = ComponentPropsWithRef<'aside'>;

export function ConsoleDock({ className, 'aria-label': ariaLabel, ...props }: ConsoleDockProps) {
	return (
		<aside
			aria-label={ariaLabel ?? '工具坞'}
			className={cn(
				'border-base-300 bg-base-100 relative z-30 hidden h-full w-14 shrink-0 flex-col items-center gap-1 border-l px-2 py-2 xl:flex',
				className,
			)}
			{...props}
		/>
	);
}

export type ConsolePageProps = Omit<ComponentPropsWithRef<'section'>, 'title'> & {
	eyebrow?: ReactNode;
	title?: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
};

export function ConsolePage({ eyebrow, title, description, actions, children, className, ...props }: ConsolePageProps) {
	return (
		<section className={cn('mx-auto w-full max-w-[96rem] px-4 py-5 md:px-6 md:py-6', className)} {...props}>
			{eyebrow || title || description || actions ? (
				<div className='border-base-300 mb-5 flex flex-wrap items-start justify-between gap-3 border-b pb-4'>
					<div className='min-w-0 flex-1'>
						{eyebrow ? <div className='text-base-content/70 mb-1 text-xs font-medium'>{eyebrow}</div> : null}
						{title ? <h1 className='text-xl font-semibold'>{title}</h1> : null}
						{description ? (
							<div className='text-base-content/70 mt-1 max-w-3xl text-sm leading-6'>{description}</div>
						) : null}
					</div>
					{actions ? <div className='flex shrink-0 items-center gap-2'>{actions}</div> : null}
				</div>
			) : null}
			{children}
		</section>
	);
}

export type ConsoleStatusProps = ComponentPropsWithRef<'span'> & {
	status?: 'online' | 'warning' | 'offline';
};

export function ConsoleStatus({ status = 'online', children, className, ...props }: ConsoleStatusProps) {
	return (
		<span className={cn('text-base-content/65 inline-flex items-center gap-1.5 text-xs', className)} {...props}>
			<span
				className={cn(
					'size-1.5 rounded-full',
					status === 'online' && 'bg-success',
					status === 'warning' && 'bg-warning',
					status === 'offline' && 'bg-error',
				)}
			/>
			{children}
		</span>
	);
}
