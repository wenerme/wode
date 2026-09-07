'use client';

import {
	type ComponentPropsWithRef,
	type KeyboardEvent as ReactKeyboardEvent,
	type ReactNode,
	type Ref,
	useEffect,
	useId,
	useRef,
	useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/utils';
import {
	WINDOW_MANAGER_DRAG_HANDLE_CLASS,
	WindowManagerContent,
	WindowManagerControls,
	WindowManagerFrame,
	WindowManagerMenu,
	WindowManagerStatusBar,
	WindowManagerTitleBar,
	WindowManagerToolbar,
} from './window-manager-chrome';
import { useWindowManager } from './window-manager-context';
import { WINDOW_MANAGER_DOCK_Z_INDEX, WindowManagerDock, type WindowManagerDockProps } from './window-manager-dock';
import { WindowManagerMotionSurface } from './window-manager-motion';
import { getWindowManagerAvailableBounds, getWindowManagerRenderBounds } from './window-manager-store';
import type { ManagedWindow, WindowManagerActions, WindowManagerWorkspaceState } from './window-manager-types';

export type WindowManagerFrameRenderContext = {
	actions: Pick<
		WindowManagerActions,
		| 'close'
		| 'focus'
		| 'fullscreen'
		| 'maximize'
		| 'minimize'
		| 'restore'
		| 'setPinned'
		| 'toggleFullscreen'
		| 'toggleMaximize'
		| 'togglePinned'
	>;
	active: boolean;
	content: ReactNode;
	dragCancelProps: { 'data-window-drag-cancel': true };
	dragHandleProps: { className: string; 'data-window-drag-handle': true };
	icon?: ReactNode;
	menuItems?: ReactNode;
	overlayZIndex: number;
	statusBar?: ReactNode;
	titleId: string;
	toolbar?: ReactNode;
	win: ManagedWindow;
};

export type WindowManagerMenuRenderContext = {
	actions: WindowManagerActions;
	win: ManagedWindow;
};

export type WindowManagerHostProps = ComponentPropsWithRef<'div'> & {
	autoFocus?: boolean;
	background?: ReactNode;
	dock?: boolean | ReactNode;
	dockProps?: WindowManagerDockProps;
	keyboard?: boolean;
	renderContent?: (win: ManagedWindow) => ReactNode;
	renderFrame?: (context: WindowManagerFrameRenderContext) => ReactNode;
	renderIcon?: (win: ManagedWindow) => ReactNode;
	renderMenuItems?: (context: WindowManagerMenuRenderContext) => ReactNode;
	renderStatusBar?: (win: ManagedWindow) => ReactNode;
	renderToolbar?: (win: ManagedWindow) => ReactNode;
	unmountContentOnMinimize?: boolean;
	zIndexBase?: number;
};

export function WindowManagerHost({
	autoFocus = true,
	background,
	children,
	className,
	dock = true,
	dockProps,
	keyboard = true,
	onKeyDownCapture,
	ref,
	renderContent = defaultContent,
	renderFrame = defaultFrame,
	renderIcon,
	renderMenuItems,
	renderStatusBar,
	renderToolbar,
	unmountContentOnMinimize = false,
	zIndexBase = 20,
	...props
}: WindowManagerHostProps) {
	const rootRef = useRef<HTMLDivElement | null>(null);
	const { actions, activeId, order, windows, workspace } = useWindowManager(
		useShallow((state) => ({
			actions: state.actions,
			activeId: state.activeId,
			order: state.order,
			windows: state.windows,
			workspace: state.workspace,
		})),
	);

	useEffect(() => {
		if (typeof dock === 'boolean' && workspace.dock.visible !== dock) actions.setDock({ visible: dock });
	}, [actions, dock, workspace.dock.visible]);

	useEffect(() => {
		const element = rootRef.current;
		if (!element) return;
		const update = () => {
			const rect = element.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0) actions.setWorkspaceSize({ width: rect.width, height: rect.height });
		};
		update();
		if (typeof ResizeObserver !== 'undefined') {
			const observer = new ResizeObserver(update);
			observer.observe(element);
			return () => observer.disconnect();
		}
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, [actions]);

	const handleKeyboard = (event: ReactKeyboardEvent<HTMLDivElement>) => {
		if (!keyboard) return;
		const active = activeId ? windows[activeId] : undefined;
		if (event.ctrlKey && event.key === 'F6') {
			event.preventDefault();
			actions.cycleFocus(event.shiftKey ? -1 : 1);
			return;
		}
		if (event.altKey && event.key === 'F9' && active) {
			event.preventDefault();
			actions.minimize(active.id);
			return;
		}
		if (event.altKey && event.key === 'F10' && active) {
			event.preventDefault();
			actions.toggleMaximize(active.id);
			return;
		}
		if (event.key === 'Escape' && active?.mode === 'fullscreen') {
			event.preventDefault();
			actions.restore(active.id);
			return;
		}
		if (
			!active ||
			!event.ctrlKey ||
			!event.altKey ||
			!event.key.startsWith('Arrow') ||
			isEditableTarget(event.target)
		) {
			return;
		}
		event.preventDefault();
		const step = event.shiftKey ? 24 : 10;
		const horizontal = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
		const vertical = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
		if (event.shiftKey) actions.resizeBy(active.id, { width: horizontal, height: vertical });
		else actions.moveBy(active.id, { x: horizontal, y: vertical });
	};

	const hostWorkspace =
		dock === false && workspace.dock.visible
			? { ...workspace, dock: { ...workspace.dock, visible: false } }
			: workspace;

	return (
		<div
			{...props}
			ref={(element) => {
				rootRef.current = element;
				assignRef(ref, element);
			}}
			data-window-manager-host
			className={cn('bg-base-200 relative isolate h-full min-h-80 w-full overflow-hidden', className)}
			onKeyDownCapture={(event) => {
				onKeyDownCapture?.(event);
				if (!event.defaultPrevented) handleKeyboard(event);
			}}
		>
			{background}
			{children}
			{order.map((id, index) => {
				const win = windows[id];
				if (!win) return null;
				return (
					<ManagedWindowSurface
						key={id}
						actions={actions}
						active={activeId === id}
						autoFocus={autoFocus}
						index={index}
						overlayZIndex={Math.max(WINDOW_MANAGER_DOCK_Z_INDEX + 1, zIndexBase + order.length + 1)}
						renderContent={renderContent}
						renderFrame={renderFrame}
						renderIcon={renderIcon}
						renderMenuItems={renderMenuItems}
						renderStatusBar={renderStatusBar}
						renderToolbar={renderToolbar}
						unmountContentOnMinimize={unmountContentOnMinimize}
						win={win}
						workspace={hostWorkspace}
						zIndexBase={zIndexBase}
					/>
				);
			})}
			{dock === true ? (
				<WindowManagerDock
					menuZIndex={Math.max(WINDOW_MANAGER_DOCK_Z_INDEX + 1, zIndexBase + order.length + 1)}
					renderIcon={renderIcon}
					{...dockProps}
				/>
			) : (
				dock || null
			)}
		</div>
	);
}

export type WindowManagerPortalHostProps = Omit<WindowManagerHostProps, 'ref'> & {
	container?: Element | (() => Element | null) | null;
};

export function WindowManagerPortalHost({ container, className, ...props }: WindowManagerPortalHostProps) {
	const [target, setTarget] = useState<Element | null>(null);
	useEffect(() => {
		setTarget(typeof container === 'function' ? container() : (container ?? document.body));
	}, [container]);
	if (!target) return null;
	return createPortal(<WindowManagerHost className={cn('fixed inset-0 min-h-0', className)} {...props} />, target);
}

type ManagedWindowSurfaceProps = {
	actions: WindowManagerActions;
	active: boolean;
	autoFocus: boolean;
	index: number;
	overlayZIndex: number;
	renderContent: NonNullable<WindowManagerHostProps['renderContent']>;
	renderFrame: NonNullable<WindowManagerHostProps['renderFrame']>;
	renderIcon?: WindowManagerHostProps['renderIcon'];
	renderMenuItems?: WindowManagerHostProps['renderMenuItems'];
	renderStatusBar?: WindowManagerHostProps['renderStatusBar'];
	renderToolbar?: WindowManagerHostProps['renderToolbar'];
	unmountContentOnMinimize: boolean;
	win: ManagedWindow;
	workspace: WindowManagerWorkspaceState;
	zIndexBase: number;
};

function ManagedWindowSurface({
	actions,
	active,
	autoFocus,
	index,
	overlayZIndex,
	renderContent,
	renderFrame,
	renderIcon,
	renderMenuItems,
	renderStatusBar,
	renderToolbar,
	unmountContentOnMinimize,
	win,
	workspace,
	zIndexBase,
}: ManagedWindowSurfaceProps) {
	const surfaceRef = useRef<HTMLDivElement | null>(null);
	const titleId = useId();
	const minimized = win.mode === 'minimized';
	const bounds = getWindowManagerRenderBounds(win, workspace);
	const area = getWindowManagerAvailableBounds(workspace);
	const motionArea =
		win.mode === 'fullscreen' ? { x: 0, y: 0, width: workspace.width, height: workspace.height } : area;
	const movable = win.mode === 'normal' && win.capabilities.move;
	const resizable = win.mode === 'normal' && win.capabilities.resize;
	const content = minimized && unmountContentOnMinimize ? null : renderContent(win);
	const frame = renderFrame({
		win,
		active,
		content,
		dragCancelProps: { 'data-window-drag-cancel': true },
		dragHandleProps: {
			className: WINDOW_MANAGER_DRAG_HANDLE_CLASS,
			'data-window-drag-handle': true,
		},
		icon: renderIcon?.(win),
		menuItems: renderMenuItems?.({ actions, win }),
		overlayZIndex,
		toolbar: renderToolbar?.(win),
		statusBar: renderStatusBar?.(win),
		titleId,
		actions,
	});

	useEffect(() => {
		if (!autoFocus || !active || minimized || !surfaceRef.current) return;
		if (!surfaceRef.current.contains(document.activeElement)) surfaceRef.current.focus({ preventScroll: true });
	}, [active, autoFocus, minimized]);

	return (
		<WindowManagerMotionSurface
			cancel='[data-window-drag-cancel],button,input,textarea,select,a,[contenteditable="true"]'
			disableDragging={!movable}
			dragHandleClassName={WINDOW_MANAGER_DRAG_HANDLE_CLASS}
			enableResizing={resizable}
			interactionKey={win.mode}
			movementBounds={{ x: motionArea.x, y: motionArea.y, width: motionArea.width, height: motionArea.height }}
			maxHeight={Math.min(win.size.maxHeight ?? motionArea.height, motionArea.height)}
			maxWidth={Math.min(win.size.maxWidth ?? motionArea.width, motionArea.width)}
			minHeight={Math.min(win.size.minHeight, motionArea.height)}
			minWidth={Math.min(win.size.minWidth, motionArea.width)}
			position={{ x: bounds.x, y: bounds.y }}
			size={{ width: bounds.width, height: bounds.height }}
			style={{
				display: minimized ? 'none' : undefined,
				zIndex: zIndexBase + index,
			}}
			onMoveStart={() => {
				actions.focus(win.id);
			}}
			onMoveStop={(position) => {
				actions.setBounds(win.id, position, 'move');
			}}
			onResizeStart={() => {
				actions.focus(win.id);
			}}
			onResizeStop={(next) => {
				actions.setBounds(win.id, next, 'resize');
			}}
		>
			<div
				ref={surfaceRef}
				role='dialog'
				aria-label={win.title}
				aria-modal='false'
				tabIndex={-1}
				inert={minimized}
				data-window-id={win.id}
				data-window-mode={win.mode}
				data-window-pinned={win.pinned || undefined}
				className='size-full min-h-0 min-w-0 outline-none'
				onFocusCapture={() => {
					if (!active) actions.focus(win.id);
				}}
				onMouseDownCapture={() => {
					if (!active) actions.focus(win.id);
				}}
			>
				{frame}
			</div>
		</WindowManagerMotionSurface>
	);
}

function defaultFrame({
	actions,
	active,
	content,
	icon,
	menuItems,
	overlayZIndex,
	statusBar,
	titleId,
	toolbar,
	win,
}: WindowManagerFrameRenderContext) {
	if (win.chrome === 'none') {
		return (
			<div className={cn(WINDOW_MANAGER_DRAG_HANDLE_CLASS, 'bg-base-100 size-full overflow-auto rounded-sm shadow-lg')}>
				{content}
			</div>
		);
	}
	return (
		<WindowManagerFrame active={active} mode={win.mode}>
			<WindowManagerTitleBar
				id={titleId}
				icon={icon}
				title={win.title}
				onDoubleClick={(event) => {
					if (!win.capabilities.maximize || win.mode === 'fullscreen') return;
					if (event.target instanceof Element && event.target.closest('[data-window-drag-cancel]')) return;
					event.preventDefault();
					actions.toggleMaximize(win.id);
				}}
				controls={
					<WindowManagerControls
						menu={
							<WindowManagerMenu
								pinned={win.pinned}
								zIndex={overlayZIndex}
								onPinnedChange={(pinned) => actions.setPinned(win.id, pinned)}
							>
								{menuItems}
							</WindowManagerMenu>
						}
						mode={win.mode}
						canClose={win.capabilities.close}
						canFullscreen={win.capabilities.fullscreen}
						canMaximize={win.capabilities.maximize}
						canMinimize={win.capabilities.minimize}
						onClose={() => actions.close(win.id)}
						onFullscreen={() => actions.toggleFullscreen(win.id)}
						onMaximize={() => actions.toggleMaximize(win.id)}
						onMinimize={() => actions.minimize(win.id)}
					/>
				}
			/>
			{toolbar ? <WindowManagerToolbar>{toolbar}</WindowManagerToolbar> : null}
			<WindowManagerContent>{content}</WindowManagerContent>
			{statusBar ? <WindowManagerStatusBar>{statusBar}</WindowManagerStatusBar> : null}
		</WindowManagerFrame>
	);
}

function defaultContent(win: ManagedWindow) {
	return (
		<div className='grid min-h-full place-items-center p-6 text-center'>
			<div>
				<div className='font-medium'>{win.title}</div>
				<div className='text-base-content/60 mt-1 text-sm'>Register a renderer for “{win.kind}”.</div>
			</div>
		</div>
	);
}

function isEditableTarget(target: EventTarget | null) {
	return (
		target instanceof HTMLElement &&
		(target.isContentEditable ||
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			target instanceof HTMLSelectElement)
	);
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
	if (typeof ref === 'function') ref(value);
	else if (ref) ref.current = value;
}
