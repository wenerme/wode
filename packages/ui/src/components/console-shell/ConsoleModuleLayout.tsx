'use client';

import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { type ComponentPropsWithRef, createContext, type ReactNode, use, useState } from 'react';
import { Tooltip } from '../../base/tooltip';
import { cn } from '../../utils';
import { type ConsoleNavigationLinkComponent, DefaultConsoleNavigationLink } from './ConsoleShell';

type ConsoleModuleLayoutState = { collapsed: boolean };
const ConsoleModuleLayoutContext = createContext<ConsoleModuleLayoutState | null>(null);

export type ConsoleModuleBrand = { detail?: ReactNode; icon?: ReactNode; label: ReactNode };
export type ConsoleModuleLayoutProps = Omit<ComponentPropsWithRef<'aside'>, 'children'> & {
	brand: ConsoleModuleBrand;
	children?: ReactNode;
	collapsed?: boolean;
	defaultCollapsed?: boolean;
	footer?: ReactNode;
	navigationLabel?: string;
	onCollapsedChange?: (next: boolean) => void;
};

export function ConsoleModuleLayout({
	brand,
	children,
	className,
	collapsed: controlledCollapsed,
	defaultCollapsed = false,
	footer,
	navigationLabel = '模块导航',
	onCollapsedChange,
	...props
}: ConsoleModuleLayoutProps) {
	const [localCollapsed, setLocalCollapsed] = useState(defaultCollapsed);
	const collapsed = controlledCollapsed ?? localCollapsed;
	const toggleLabel = collapsed ? '展开模块导航' : '收起模块导航';
	const toggleCollapsed = () => {
		const next = !collapsed;
		if (controlledCollapsed === undefined) setLocalCollapsed(next);
		onCollapsedChange?.(next);
	};
	return (
		<ConsoleModuleLayoutContext value={{ collapsed }}>
			<aside
				aria-label={navigationLabel}
				data-collapsed={collapsed || undefined}
				className={cn(
					'border-base-300 bg-base-100 relative z-20 hidden h-full w-56 shrink-0 flex-col overflow-hidden border-r transition-[width] duration-150',
					'data-[collapsed=true]:w-14 md:flex',
					className,
				)}
				data-slot='console-module-layout'
				{...props}
			>
				<div
					className='border-base-300 box-border flex h-[var(--console-header-height,57px)] shrink-0 items-center gap-3 overflow-hidden border-b px-3 whitespace-nowrap'
					data-slot='console-module-header'
				>
					{brand.icon ? (
						<span className='bg-neutral text-neutral-content grid size-8 shrink-0 place-items-center rounded-md'>
							{brand.icon}
						</span>
					) : null}
					{collapsed ? null : (
						<div className='min-w-0'>
							<div className='truncate text-sm font-semibold'>{brand.label}</div>
							{brand.detail ? <div className='text-base-content/70 truncate text-xs'>{brand.detail}</div> : null}
						</div>
					)}
				</div>
				<nav
					aria-label={navigationLabel}
					className='flex min-h-0 flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto p-2'
				>
					{children}
				</nav>
				<footer
					className='border-base-300 box-border flex min-h-[50px] shrink-0 flex-col justify-center overflow-hidden border-t p-2'
					data-slot='console-module-footer'
				>
					{footer}
					<button
						type='button'
						aria-expanded={!collapsed}
						aria-label={toggleLabel}
						className='btn btn-ghost btn-sm w-full min-w-0 justify-start overflow-hidden whitespace-nowrap opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100'
						onClick={toggleCollapsed}
					>
						{collapsed ? <ChevronsRight className='size-4' /> : <ChevronsLeft className='size-4' />}
						{collapsed ? null : '收起导航'}
					</button>
				</footer>
			</aside>
		</ConsoleModuleLayoutContext>
	);
}

export type ConsoleModuleLinkProps = Omit<ComponentPropsWithRef<'a'>, 'href' | 'title'> & {
	active?: boolean;
	badge?: ReactNode;
	icon?: ReactNode;
	label: string;
	linkComponent?: ConsoleNavigationLinkComponent;
	href: string;
};
export type ConsoleModuleTitleProps = ComponentPropsWithRef<'div'>;
export function ConsoleModuleTitle({ className, ...props }: ConsoleModuleTitleProps) {
	const state = use(ConsoleModuleLayoutContext);
	if (!state) throw new Error('ConsoleModuleTitle must be rendered within ConsoleModuleLayout');
	if (state.collapsed) return null;
	return (
		<div
			data-slot='console-module-title'
			className={cn('text-base-content/70 px-2 pt-3 pb-1 text-xs font-medium', className)}
			{...props}
		/>
	);
}

export function ConsoleModuleLink({
	active,
	badge,
	className,
	href,
	icon,
	label,
	linkComponent,
	...props
}: ConsoleModuleLinkProps) {
	const state = use(ConsoleModuleLayoutContext);
	if (!state) throw new Error('ConsoleModuleLink must be rendered within ConsoleModuleLayout');
	const Link = linkComponent ?? DefaultConsoleNavigationLink;
	const link = (
		<Link
			href={href}
			aria-current={active ? 'page' : undefined}
			aria-label={state.collapsed ? label : undefined}
			data-active={active || null}
			data-collapsed={state.collapsed || null}
			className={cn(
				'btn btn-ghost items-center font-thin',
				'data-active:btn-active data-active:font-medium',
				'data-collapsed:btn-square data-collapsed:justify-center',
				className,
			)}
			{...props}
		>
			{icon ? <span className='grid size-5 shrink-0 place-items-center'>{icon}</span> : null}
			{state.collapsed ? (
				<span className='sr-only'>{label}</span>
			) : (
				<span className='min-w-0 flex-1 truncate text-left'>{label}</span>
			)}
			{!state.collapsed && badge ? (
				<span className={cn('shrink-0 text-xs', active ? 'text-current opacity-80' : 'text-base-content/65')}>
					{badge}
				</span>
			) : null}
		</Link>
	);
	if (!state.collapsed) return link;
	return (
		<Tooltip.Root disableHoverablePopup>
			<Tooltip.Trigger render={<span className='block' />}>{link}</Tooltip.Trigger>
			<Tooltip.Portal>
				<Tooltip.Positioner side='right' sideOffset={8} className='z-50'>
					<Tooltip.Popup className='bg-neutral text-neutral-content rounded-md px-2 py-1 text-xs shadow-md'>
						{label}
					</Tooltip.Popup>
				</Tooltip.Positioner>
			</Tooltip.Portal>
		</Tooltip.Root>
	);
}
