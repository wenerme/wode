'use client';

import { Menu as BaseMenu } from '@base-ui/react/menu';
import {
	AppWindow,
	Focus,
	LockKeyhole,
	LogIn,
	LogOut,
	Minus,
	PanelsTopLeft,
	UserRound,
	UserRoundCog,
	X,
} from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/utils';
import { WindowManagerMenuItem, WindowManagerMenuSeparator } from './window-manager-chrome';
import { useWindowManager } from './window-manager-context';
import type { ManagedWindow, WindowManagerActions, WindowManagerDockPosition } from './window-manager-types';

export const WINDOW_MANAGER_DOCK_Z_INDEX = 9_000;

export type WindowManagerDockItemRenderContext = {
	active: boolean;
	icon: ReactNode;
	minimized: boolean;
	win: ManagedWindow;
};

export type WindowManagerDockUser = {
	avatarUrl?: string;
	displayName?: string;
	hasNotification?: boolean;
	initials?: string;
	loginName?: string;
	onLock?: () => void;
	onOpenProfile?: () => void;
	onSignIn?: () => void;
	onSignOut?: () => void;
};

export type WindowManagerDockUserMenuRenderContext = {
	user: WindowManagerDockUser;
};

export type WindowManagerDockProps = ComponentPropsWithRef<'nav'> & {
	menuZIndex?: number;
	minimizeActiveOnClick?: boolean;
	renderIcon?: (win: ManagedWindow) => ReactNode;
	renderItem?: (context: WindowManagerDockItemRenderContext) => ReactNode;
	renderUserMenuItems?: (context: WindowManagerDockUserMenuRenderContext) => ReactNode;
	showActions?: boolean;
	user?: WindowManagerDockUser;
};

export function WindowManagerDock({
	className,
	menuZIndex = WINDOW_MANAGER_DOCK_Z_INDEX + 1,
	minimizeActiveOnClick = true,
	renderIcon = defaultWindowIcon,
	renderItem,
	renderUserMenuItems,
	showActions = true,
	style,
	user,
	...props
}: WindowManagerDockProps) {
	const { actions, activeId, dock, dockOrder, fullscreen, windowById } = useWindowManager(
		useShallow((state) => ({
			actions: state.actions,
			activeId: state.activeId,
			dock: state.workspace.dock,
			dockOrder: state.dockOrder,
			fullscreen: state.order.some((id) => state.windows[id]?.mode === 'fullscreen'),
			windowById: state.windows,
		})),
	);
	if (!dock.visible || fullscreen) return null;
	const windows = dockOrder.flatMap((id) => {
		const win = windowById[id];
		return win?.showInDock ? [win] : [];
	});
	const managedWindows = Object.values(windowById);
	const vertical = dock.position !== 'bottom';
	const dockStyle = vertical ? { width: dock.size } : { height: dock.size };

	return (
		<nav
			aria-label='窗口停靠栏'
			data-position={dock.position}
			className={cn(
				'border-base-300 bg-base-100/95 absolute flex items-center border shadow-lg backdrop-blur',
				dock.position === 'bottom' && 'inset-x-0 bottom-0 flex-row px-2',
				dock.position === 'left' && 'inset-y-0 left-0 flex-col py-2',
				dock.position === 'right' && 'inset-y-0 right-0 flex-col py-2',
				className,
			)}
			style={{ zIndex: WINDOW_MANAGER_DOCK_Z_INDEX, ...dockStyle, ...style }}
			{...props}
		>
			{user ? (
				<WindowManagerDockUserAvatar
					menuItems={renderUserMenuItems?.({ user })}
					position={dock.position}
					user={user}
					zIndex={menuZIndex}
				/>
			) : null}
			{showActions ? (
				<WindowManagerDockMenu
					actions={actions}
					active={activeId ? windowById[activeId] : undefined}
					canCloseAny={managedWindows.some((win) => win.capabilities.close)}
					canMinimizeAny={managedWindows.some((win) => win.mode !== 'minimized' && win.capabilities.minimize)}
					count={managedWindows.length}
					position={dock.position}
					zIndex={menuZIndex}
				/>
			) : null}
			<div
				className={cn(
					'flex min-h-0 min-w-0 flex-1 items-center gap-1 overflow-auto',
					vertical ? 'flex-col px-1 py-2' : 'flex-row px-2 py-1',
				)}
			>
				{windows.map((win) => {
					const active = activeId === win.id && win.mode !== 'minimized';
					const icon = renderIcon(win);
					const context = { active, minimized: win.mode === 'minimized', icon, win };
					return (
						<button
							key={win.id}
							type='button'
							aria-label={`${win.title}${win.mode === 'minimized' ? '，已最小化' : ''}`}
							aria-pressed={active}
							title={win.title}
							data-active={active || undefined}
							data-mode={win.mode}
							className={cn(
								'hover:bg-base-200 relative grid size-9 shrink-0 place-items-center rounded-sm',
								'focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none',
								'data-[active=true]:bg-primary/12 data-[active=true]:text-primary',
								'data-[mode=minimized]:opacity-55',
							)}
							onClick={() => {
								if (win.mode === 'minimized') actions.restore(win.id);
								else if (active && minimizeActiveOnClick) actions.minimize(win.id);
								else actions.focus(win.id);
							}}
						>
							{renderItem ? renderItem(context) : icon}
							<span
								aria-hidden='true'
								className={cn(
									'bg-primary absolute rounded-full opacity-0 data-[active=true]:opacity-100',
									vertical ? 'top-1 bottom-1 left-0 w-0.5' : 'inset-x-1 bottom-0 h-0.5',
								)}
								data-active={active || undefined}
							/>
						</button>
					);
				})}
				{windows.length === 0 ? <AppWindow aria-hidden='true' className='text-base-content/30 size-4' /> : null}
			</div>
		</nav>
	);
}

type WindowManagerDockUserAvatarProps = {
	menuItems?: ReactNode;
	position: WindowManagerDockPosition;
	user: WindowManagerDockUser;
	zIndex: number;
};

function WindowManagerDockUserAvatar({ menuItems, position, user, zIndex }: WindowManagerDockUserAvatarProps) {
	const { avatarUrl, displayName, hasNotification, loginName, onLock, onOpenProfile, onSignIn, onSignOut } = user;
	const normalizedAvatarUrl = avatarUrl?.trim();
	const normalizedDisplayName = displayName?.trim();
	const normalizedLoginName = loginName?.trim();
	const normalizedInitials = user.initials?.trim();
	const hasIdentity = Boolean(
		normalizedAvatarUrl || normalizedDisplayName || normalizedLoginName || normalizedInitials,
	);
	if (!hasIdentity) {
		if (!onSignIn) return null;
		return (
			<button
				type='button'
				aria-label='登录'
				title='未登录'
				disabled={!onSignIn}
				className='hover:bg-base-200 focus-visible:ring-primary grid size-9 shrink-0 place-items-center rounded-full focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40'
				onClick={onSignIn}
			>
				<LogIn className='size-4' />
			</button>
		);
	}

	const side = getWindowManagerDockMenuSide(position);
	const initials = resolveUserInitials(user);
	const label = normalizedDisplayName || normalizedLoginName || '账户';
	const hasPrimaryActions = Boolean(onOpenProfile || onLock || menuItems);
	return (
		<BaseMenu.Root>
			<BaseMenu.Trigger
				aria-label={`账户菜单${hasNotification ? '，有新通知' : ''}`}
				title={label}
				className='ring-base-300 hover:ring-primary focus-visible:ring-primary relative grid size-9 shrink-0 place-items-center rounded-full ring-1 outline-none focus-visible:ring-2'
			>
				<span className='bg-primary/12 text-primary relative grid size-9 place-items-center rounded-full text-sm font-semibold'>
					{initials || <UserRound className='size-4' />}
					{normalizedAvatarUrl ? (
						<img
							alt={`${label}头像`}
							className='absolute inset-0 size-9 rounded-full object-cover'
							loading='lazy'
							referrerPolicy='no-referrer'
							src={normalizedAvatarUrl}
							onError={(event) => {
								event.currentTarget.hidden = true;
							}}
						/>
					) : null}
				</span>
				{hasNotification ? (
					<span
						aria-hidden='true'
						className='bg-error ring-base-100 absolute top-0 right-0 size-2.5 rounded-full ring-2'
					/>
				) : null}
			</BaseMenu.Trigger>
			<BaseMenu.Portal>
				<BaseMenu.Positioner align='start' side={side} sideOffset={8} className='outline-none' style={{ zIndex }}>
					<BaseMenu.Popup className='border-base-300 bg-base-100 text-base-content min-w-52 rounded-md border p-1 shadow-xl outline-none'>
						<div className='px-2 py-2'>
							<div className='truncate text-sm font-medium'>{label}</div>
							{normalizedLoginName ? (
								<div className='text-base-content/55 truncate text-xs'>@{normalizedLoginName}</div>
							) : null}
						</div>
						{hasPrimaryActions || onSignOut ? <WindowManagerMenuSeparator /> : null}
						{hasPrimaryActions ? (
							<BaseMenu.Group>
								{onOpenProfile ? (
									<WindowManagerMenuItem onClick={onOpenProfile}>
										<UserRoundCog className='size-4' />
										<span>个人资料</span>
									</WindowManagerMenuItem>
								) : null}
								{onLock ? (
									<WindowManagerMenuItem onClick={onLock}>
										<LockKeyhole className='size-4' />
										<span>锁定</span>
									</WindowManagerMenuItem>
								) : null}
								{menuItems}
							</BaseMenu.Group>
						) : null}
						{onSignOut ? (
							<>
								{hasPrimaryActions ? <WindowManagerMenuSeparator /> : null}
								<WindowManagerMenuItem className='text-error' onClick={onSignOut}>
									<LogOut className='size-4' />
									<span>退出登录</span>
								</WindowManagerMenuItem>
							</>
						) : null}
					</BaseMenu.Popup>
				</BaseMenu.Positioner>
			</BaseMenu.Portal>
		</BaseMenu.Root>
	);
}

type WindowManagerDockMenuProps = {
	actions: WindowManagerActions;
	active?: ManagedWindow;
	canCloseAny: boolean;
	canMinimizeAny: boolean;
	count: number;
	position: WindowManagerDockPosition;
	zIndex: number;
};

function WindowManagerDockMenu({
	actions,
	active,
	canCloseAny,
	canMinimizeAny,
	count,
	position,
	zIndex,
}: WindowManagerDockMenuProps) {
	const side = getWindowManagerDockMenuSide(position);
	return (
		<BaseMenu.Root>
			<BaseMenu.Trigger
				aria-label='窗口管理'
				title='窗口管理'
				className='hover:bg-base-200 focus-visible:ring-primary grid size-8 shrink-0 place-items-center rounded-sm focus-visible:ring-2 focus-visible:outline-none'
			>
				<PanelsTopLeft className='size-4' />
			</BaseMenu.Trigger>
			<BaseMenu.Portal>
				<BaseMenu.Positioner align='start' side={side} sideOffset={6} className='outline-none' style={{ zIndex }}>
					<BaseMenu.Popup className='border-base-300 bg-base-100 text-base-content min-w-48 rounded-md border p-1 shadow-xl outline-none'>
						<BaseMenu.Group>
							<BaseMenu.GroupLabel className='text-base-content/55 px-2 py-1 text-xs'>当前窗口</BaseMenu.GroupLabel>
							<WindowManagerMenuItem
								disabled={!active || active.mode !== 'normal' || !active.capabilities.move}
								onClick={() => active && actions.center(active.id)}
							>
								<Focus className='size-4' />
								<span>窗口居中</span>
							</WindowManagerMenuItem>
							<WindowManagerMenuItem
								disabled={!active?.capabilities.close}
								onClick={() => active && actions.close(active.id)}
							>
								<X className='size-4' />
								<span>关闭当前窗口</span>
							</WindowManagerMenuItem>
						</BaseMenu.Group>
						<WindowManagerMenuSeparator />
						<BaseMenu.Group>
							<BaseMenu.GroupLabel className='text-base-content/55 px-2 py-1 text-xs'>
								窗口管理 ({count})
							</BaseMenu.GroupLabel>
							<WindowManagerMenuItem disabled={!canMinimizeAny} onClick={actions.minimizeAll}>
								<Minus className='size-4' />
								<span>最小化所有窗口</span>
							</WindowManagerMenuItem>
							<WindowManagerMenuItem disabled={!canCloseAny} onClick={actions.closeAll}>
								<X className='size-4' />
								<span>关闭所有窗口</span>
							</WindowManagerMenuItem>
						</BaseMenu.Group>
					</BaseMenu.Popup>
				</BaseMenu.Positioner>
			</BaseMenu.Portal>
		</BaseMenu.Root>
	);
}

function getWindowManagerDockMenuSide(position: WindowManagerDockPosition) {
	return position === 'right' ? 'left' : position === 'left' ? 'right' : 'top';
}

function resolveUserInitials(user: WindowManagerDockUser) {
	const value = user.initials?.trim() || user.displayName?.trim() || user.loginName?.trim() || '';
	const graphemes =
		typeof Intl.Segmenter === 'function'
			? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value), ({ segment }) => segment)
			: Array.from(value);
	return graphemes.slice(0, 2).join('').toUpperCase();
}

function defaultWindowIcon(win: ManagedWindow) {
	return win.icon ? (
		<span className='max-w-7 truncate text-xs font-semibold'>{win.icon}</span>
	) : (
		<span className='text-xs font-semibold'>{win.title.trim().slice(0, 1).toUpperCase() || 'W'}</span>
	);
}
