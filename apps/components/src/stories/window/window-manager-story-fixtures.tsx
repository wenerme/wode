'use client';

import { Activity, Focus, Gauge, PanelLeft, PanelRight, Plus, RotateCcw, Server, Settings } from 'lucide-react';
import { useState } from 'react';
import {
	createWindowManagerStore,
	useWindowManager,
	useWindowManagerActions,
	WindowManagerHost,
	WindowManagerMenuItem,
	WindowManagerPersistence,
	WindowManagerPortalHost,
	WindowManagerProvider,
	type WindowManagerStore,
} from '@/window/window-manager';
import {
	renderWindowManagerStoryIcon,
	WindowManagerStoryContent,
	WindowManagerStoryStatus,
	WindowManagerStoryToolbar,
} from './window-manager-story-content';

const initialWindows = [
	{
		id: 'overview',
		key: 'overview',
		kind: 'overview',
		title: 'Service overview',
		icon: 'overview',
		bounds: { x: 36, y: 72, width: 620, height: 440 },
	},
	{
		id: 'query',
		key: 'query',
		kind: 'query',
		title: 'Query console',
		icon: 'query',
		bounds: { x: 310, y: 132, width: 650, height: 430 },
	},
	{
		id: 'runbook',
		key: 'runbook',
		kind: 'runbook',
		title: 'Runbook',
		icon: 'runbook',
		bounds: { x: 574, y: 84, width: 470, height: 480 },
	},
] as const;

const demoDockUser = {
	displayName: '林舟',
	loginName: 'linzhou',
	hasNotification: true,
	onLock: () => undefined,
	onOpenProfile: () => undefined,
	onSignOut: () => undefined,
};

export function createWindowManagerStoryStore(dock: 'bottom' | 'left' | 'right' = 'bottom') {
	return createWindowManagerStore({
		workspace: { width: 1120, height: 700, dock: { position: dock, size: dock === 'bottom' ? 52 : 58 } },
		initialWindows,
	});
}

export function ManagedWindowManagerStory({ store = createWindowManagerStoryStore() }: { store?: WindowManagerStore }) {
	return (
		<WindowManagerProvider store={store}>
			<WindowManagerHost
				className='h-screen min-h-[34rem]'
				background={<WorkspaceBackdrop />}
				dockProps={{
					user: demoDockUser,
					renderUserMenuItems: () => (
						<WindowManagerMenuItem>
							<Settings className='size-4' />
							<span>偏好设置</span>
						</WindowManagerMenuItem>
					),
				}}
				renderContent={(win) => <WindowManagerStoryContent win={win} />}
				renderIcon={renderWindowManagerStoryIcon}
				renderMenuItems={({ actions, win }) => (
					<WindowManagerMenuItem onClick={() => actions.center(win.id)}>
						<Focus className='size-4' />
						<span>窗口居中</span>
					</WindowManagerMenuItem>
				)}
				renderToolbar={(win) => <WindowManagerStoryToolbar win={win} />}
				renderStatusBar={(win) => <WindowManagerStoryStatus win={win} />}
			/>
		</WindowManagerProvider>
	);
}

export function PersistentWindowManagerStory() {
	const [storage] = useState(() => {
		const values = new Map<string, string>();
		return {
			getItem: (key: string) => values.get(key) ?? null,
			removeItem: (key: string) => values.delete(key),
			setItem: (key: string, value: string) => values.set(key, value),
		};
	});
	const [runtime, setRuntime] = useState(() => ({ generation: 0, store: createWindowManagerStoryStore() }));
	const [, setRevision] = useState(0);
	return (
		<div className='relative h-screen'>
			<button
				type='button'
				className='btn btn-ghost btn-sm absolute right-3 bottom-28 z-[11000]'
				onClick={() => setRevision((value) => value + 1)}
			>
				Rerender parent
			</button>
			<button
				type='button'
				className='btn btn-neutral btn-sm absolute right-3 bottom-16 z-[11000]'
				onClick={() =>
					setRuntime((current) => ({ generation: current.generation + 1, store: createWindowManagerStoryStore() }))
				}
			>
				Reload runtime
			</button>
			<WindowManagerProvider key={runtime.generation} store={runtime.store}>
				<WindowManagerPersistence
					debounceMs={80}
					storage={storage}
					storageKey='storybook.window-manager.layout'
					onError={() => undefined}
					serializeData={() => undefined}
				/>
				<WindowManagerHost
					className='h-screen'
					background={<WorkspaceBackdrop />}
					renderContent={(win) => <WindowManagerStoryContent win={win} />}
					renderIcon={renderWindowManagerStoryIcon}
					renderToolbar={(win) => <WindowManagerStoryToolbar win={win} />}
					renderStatusBar={(win) => <WindowManagerStoryStatus win={win} />}
				/>
			</WindowManagerProvider>
		</div>
	);
}

export function PortalWindowManagerStory() {
	const [store] = useState(() =>
		createWindowManagerStore({
			initialWindows: [
				{
					id: 'portal-tools',
					kind: 'runbook',
					title: 'Portal tools',
					icon: 'runbook',
					bounds: { x: 120, y: 90, width: 520, height: 420 },
				},
			],
		}),
	);
	return (
		<WindowManagerProvider store={store}>
			<WindowManagerPortalHost
				className='h-screen'
				background={<div className='bg-base-200 absolute inset-0' />}
				renderContent={(win) => <WindowManagerStoryContent win={win} />}
				renderIcon={renderWindowManagerStoryIcon}
				renderStatusBar={(win) => <WindowManagerStoryStatus win={win} />}
			/>
		</WindowManagerProvider>
	);
}

function WorkspaceBackdrop() {
	const actions = useWindowManagerActions();
	const dock = useWindowManager((state) => state.workspace.dock);
	return (
		<div className='absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_70%_15%,color-mix(in_oklab,var(--color-primary)_8%,transparent),transparent_32%)]'>
			<div className='border-base-300 bg-base-100/82 absolute inset-x-0 top-0 z-10 flex min-h-12 items-center gap-1 border-b px-2 backdrop-blur'>
				<div className='mr-2 hidden min-w-0 items-center gap-2 sm:flex'>
					<div className='bg-neutral text-neutral-content grid size-7 place-items-center rounded-sm'>
						<Gauge className='size-4' />
					</div>
					<span className='truncate text-sm font-semibold'>Operations workspace</span>
				</div>
				<button
					type='button'
					className='btn btn-neutral btn-sm'
					onClick={() =>
						actions.open({
							key: 'audit',
							kind: 'audit',
							title: 'Audit logs',
							icon: 'audit',
							bounds: { width: 720, height: 460 },
						})
					}
				>
					<Plus className='size-3.5' />
					Audit logs
				</button>
				<button
					type='button'
					className='btn btn-ghost btn-sm hidden sm:inline-flex'
					onClick={() =>
						actions.open({
							key: 'live-metrics',
							kind: 'metrics',
							title: 'Live metrics',
							icon: 'metrics',
							chrome: 'none',
							bounds: { width: 360, height: 240 },
						})
					}
				>
					<Activity className='size-3.5' />
					Live metrics
				</button>
				<span className='flex-1' />
				<div className='join hidden sm:flex' aria-label='Dock position'>
					<button
						type='button'
						aria-label='Dock left'
						className='btn btn-ghost btn-sm join-item px-2'
						data-active={dock.position === 'left' || undefined}
						onClick={() => actions.setDock({ position: 'left', size: 58 })}
					>
						<PanelLeft className='size-4' />
					</button>
					<button
						type='button'
						aria-label='Dock bottom'
						className='btn btn-ghost btn-sm join-item px-2'
						data-active={dock.position === 'bottom' || undefined}
						onClick={() => actions.setDock({ position: 'bottom', size: 52 })}
					>
						<Server className='size-4 rotate-90' />
					</button>
					<button
						type='button'
						aria-label='Dock right'
						className='btn btn-ghost btn-sm join-item px-2'
						data-active={dock.position === 'right' || undefined}
						onClick={() => actions.setDock({ position: 'right', size: 58 })}
					>
						<PanelRight className='size-4' />
					</button>
				</div>
				<button
					type='button'
					aria-label='Reset window layout'
					title='Reset window layout'
					className='btn btn-ghost btn-sm px-2'
					onClick={actions.resetLayout}
				>
					<RotateCcw className='size-4' />
				</button>
			</div>
			<div className='text-base-content/45 absolute bottom-20 left-7 hidden max-w-60 text-xs leading-5 sm:block'>
				<div className='font-medium'>example-cluster / production</div>
				<div>12 services · 3 regions</div>
			</div>
		</div>
	);
}
