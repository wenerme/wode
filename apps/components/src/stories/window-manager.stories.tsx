'use client';

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	Activity,
	BookOpenCheck,
	Database,
	FileClock,
	Focus,
	Gauge,
	PanelLeft,
	PanelRight,
	Plus,
	RotateCcw,
	Server,
	Settings,
	SquareTerminal,
	X,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
	createWindowManagerStore,
	type ManagedWindow,
	useWindowManager,
	useWindowManagerActions,
	WindowManagerHost,
	WindowManagerMenuItem,
	WindowManagerPersistence,
	WindowManagerPortalHost,
	WindowManagerProvider,
	type WindowManagerStore,
} from '../../registry/default/blocks/window-manager';
import { Status } from '../../registry/default/ui/status';
import { FileManagerWindowDemo } from './file-manager-window-demo';

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

function createDemoStore(dock: 'bottom' | 'left' | 'right' = 'bottom') {
	return createWindowManagerStore({
		workspace: { width: 1120, height: 700, dock: { position: dock, size: dock === 'bottom' ? 52 : 58 } },
		initialWindows,
	});
}

function ManagedWorkspace({ store = createDemoStore() }: { store?: WindowManagerStore }) {
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
				renderContent={(win) => <WindowContent win={win} />}
				renderIcon={renderWindowIcon}
				renderMenuItems={({ actions, win }) => (
					<WindowManagerMenuItem onClick={() => actions.center(win.id)}>
						<Focus className='size-4' />
						<span>窗口居中</span>
					</WindowManagerMenuItem>
				)}
				renderToolbar={(win) => <WindowToolbar win={win} />}
				renderStatusBar={(win) => <WindowStatus win={win} />}
			/>
		</WindowManagerProvider>
	);
}

function PersistentWorkspace() {
	const [storage] = useState(() => {
		const values = new Map<string, string>();
		return {
			getItem: (key: string) => values.get(key) ?? null,
			removeItem: (key: string) => values.delete(key),
			setItem: (key: string, value: string) => values.set(key, value),
		};
	});
	const [runtime, setRuntime] = useState(() => ({ generation: 0, store: createDemoStore() }));
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
				onClick={() => setRuntime((current) => ({ generation: current.generation + 1, store: createDemoStore() }))}
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
					renderContent={(win) => <WindowContent win={win} />}
					renderIcon={renderWindowIcon}
					renderToolbar={(win) => <WindowToolbar win={win} />}
					renderStatusBar={(win) => <WindowStatus win={win} />}
				/>
			</WindowManagerProvider>
		</div>
	);
}

function PortalWorkspace() {
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
				renderContent={(win) => <WindowContent win={win} />}
				renderIcon={renderWindowIcon}
				renderStatusBar={(win) => <WindowStatus win={win} />}
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

function WindowContent({ win }: { win: ManagedWindow }) {
	if (win.kind === 'overview') return <OverviewContent />;
	if (win.kind === 'query') return <QueryContent />;
	if (win.kind === 'runbook') return <RunbookContent />;
	if (win.kind === 'audit') return <AuditContent />;
	if (win.kind === 'metrics') return <MetricsContent win={win} />;
	return <div className='p-4'>{win.title}</div>;
}

function OverviewContent() {
	const services = [
		['API gateway', 'Healthy', '12 ms'],
		['PostgreSQL', 'Healthy', '8 ms'],
		['Event stream', 'Delayed', '2.4 s'],
		['Object storage', 'Healthy', '41 ms'],
	];
	return (
		<div className='min-h-full p-4'>
			<div className='grid grid-cols-2 gap-px border md:grid-cols-4'>
				{[
					['Availability', '99.98%'],
					['Requests', '1.82M'],
					['P95 latency', '184 ms'],
					['Open alerts', '3'],
				].map(([label, value]) => (
					<div key={label} className='bg-base-100 p-3'>
						<div className='text-base-content/55 text-[11px]'>{label}</div>
						<div className='mt-1 text-lg font-semibold'>{value}</div>
					</div>
				))}
			</div>
			<div className='mt-4 overflow-hidden border'>
				{services.map(([name, state, latency]) => (
					<div key={name} className='border-base-300 flex items-center gap-3 border-b px-3 py-2.5 last:border-0'>
						<Database className='text-base-content/40 size-4' />
						<span className='min-w-0 flex-1 truncate text-sm'>{name}</span>
						<Status tone={state === 'Delayed' ? 'warning' : 'success'} size='sm'>
							{state}
						</Status>
						<span className='text-base-content/55 w-12 text-right font-mono text-xs'>{latency}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function QueryContent() {
	return (
		<div className='grid min-h-full grid-rows-[minmax(11rem,1fr)_minmax(8rem,0.75fr)]'>
			<pre className='bg-neutral text-neutral-content min-h-0 overflow-auto p-4 font-mono text-xs leading-6'>
				<code>{`select service, region, status, p95_latency_ms\nfrom service_health\nwhere environment = 'production'\norder by p95_latency_ms desc;`}</code>
			</pre>
			<div className='min-h-0 overflow-auto'>
				<table className='table-xs table-pin-rows table'>
					<thead>
						<tr>
							<th>Service</th>
							<th>Region</th>
							<th>Status</th>
							<th className='text-right'>P95</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>events</td>
							<td>ap-east-1</td>
							<td>delayed</td>
							<td className='text-right'>2410</td>
						</tr>
						<tr>
							<td>objects</td>
							<td>ap-southeast-1</td>
							<td>healthy</td>
							<td className='text-right'>184</td>
						</tr>
						<tr>
							<td>gateway</td>
							<td>ap-east-1</td>
							<td>healthy</td>
							<td className='text-right'>96</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
}

function RunbookContent() {
	return (
		<div className='p-4'>
			<div className='mb-4 flex items-start gap-3'>
				<div className='bg-info/12 text-info grid size-9 shrink-0 place-items-center rounded-sm'>
					<BookOpenCheck className='size-4' />
				</div>
				<div>
					<h3 className='text-sm font-semibold'>Event stream delay</h3>
					<p className='text-base-content/60 mt-1 text-xs'>Owned by Platform Operations</p>
				</div>
			</div>
			<ol className='space-y-2'>
				{[
					'Confirm consumer lag by region',
					'Inspect the last deployment',
					'Pause non-critical replay jobs',
					'Escalate after 15 minutes',
				].map((step, index) => (
					<li key={step} className='border-base-300 flex gap-3 border-b py-3 text-sm'>
						<span className='bg-base-200 grid size-6 shrink-0 place-items-center rounded-sm text-xs font-semibold'>
							{index + 1}
						</span>
						<span className='pt-0.5'>{step}</span>
					</li>
				))}
			</ol>
		</div>
	);
}

function AuditContent() {
	return (
		<div className='min-h-full overflow-auto'>
			<table className='table-sm table-pin-rows table'>
				<thead>
					<tr>
						<th>Time</th>
						<th>Actor</th>
						<th>Action</th>
						<th>Resource</th>
					</tr>
				</thead>
				<tbody>
					{Array.from({ length: 10 }, (_, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: Deterministic audit fixture rows have no state.
						<tr key={index}>
							<td className='font-mono text-xs'>14:{String(32 - index).padStart(2, '0')}:08</td>
							<td>operator-{(index % 3) + 1}</td>
							<td>{index % 2 ? 'policy.read' : 'service.update'}</td>
							<td>service/ac-{index + 1}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function MetricsContent({ win }: { win: ManagedWindow }) {
	const actions = useWindowManagerActions();
	return (
		<div className='border-primary/30 bg-neutral text-neutral-content flex size-full flex-col overflow-hidden rounded-sm border shadow-xl'>
			<div className='flex h-9 items-center border-b border-white/10 px-3 text-xs'>
				<Activity className='mr-2 size-3.5 text-emerald-400' />
				Live metrics
				<span className='flex-1' />
				<button
					type='button'
					aria-label='Close live metrics'
					className='grid size-7 place-items-center hover:bg-white/10'
					onClick={() => actions.close(win.id)}
				>
					<X className='size-3.5' />
				</button>
			</div>
			<div className='grid flex-1 grid-cols-6 items-end gap-1 px-4 pt-8 pb-4'>
				{[42, 64, 38, 78, 55, 88, 48, 68, 81, 61, 91, 72].map((height) => (
					<div key={height} className='min-h-1 bg-emerald-400/75' style={{ height: `${height}%` }} />
				))}
			</div>
		</div>
	);
}

function WindowToolbar({ win }: { win: ManagedWindow }) {
	if (win.kind === 'overview')
		return (
			<>
				<Status tone='success' size='sm'>
					Production
				</Status>
				<span className='text-base-content/50 text-xs'>Updated now</span>
			</>
		);
	if (win.kind === 'query')
		return (
			<>
				<button type='button' className='btn btn-neutral btn-xs'>
					<SquareTerminal className='size-3' />
					Run
				</button>
				<span className='text-base-content/50 text-xs'>readonly</span>
			</>
		);
	if (win.kind === 'audit')
		return (
			<>
				<FileClock className='size-3.5' />
				<span className='text-xs'>Last 30 minutes</span>
			</>
		);
	return null;
}

function WindowStatus({ win }: { win: ManagedWindow }) {
	return (
		<>
			<span className='bg-success size-1.5 rounded-full' />
			<span>{win.kind === 'query' ? 'Connected · 3 rows' : 'Ready'}</span>
			<span className='flex-1' />
			<span>{win.mode}</span>
		</>
	);
}

function renderWindowIcon(win: ManagedWindow): ReactNode {
	if (win.icon === 'overview') return <Gauge className='size-4' />;
	if (win.icon === 'query') return <SquareTerminal className='size-4' />;
	if (win.icon === 'runbook') return <BookOpenCheck className='size-4' />;
	if (win.icon === 'audit') return <FileClock className='size-4' />;
	if (win.icon === 'metrics') return <Activity className='size-4' />;
	return <Server className='size-4' />;
}

const meta = {
	title: 'Blocks/Window Manager',
	component: WindowManagerHost,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'A context-scoped multi-window runtime with deterministic state transitions, draggable/resizable geometry, dock/task switching, portal hosting, versioned opt-in persistence, and customizable renderers.',
			},
		},
	},
} satisfies Meta<typeof WindowManagerHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InteractiveWorkspace: Story = {
	render: () => <ManagedWorkspace store={createDemoStore()} />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getAllByRole('dialog')).toHaveLength(3);
		const surface = canvasElement.querySelector('[data-window-id="runbook"]');
		expect(surface).toHaveAttribute('data-window-mode', 'normal');

		const runbook = canvas.getByRole('dialog', { name: 'Runbook' });
		const titleBar = runbook.querySelector('header');
		expect(titleBar).not.toBeNull();
		const menuTrigger = within(runbook).getByRole('button', { name: '窗口菜单' });
		const documentBody = within(canvasElement.ownerDocument.body);
		const motionSurface = surface?.parentElement?.parentElement as HTMLElement | undefined;
		expect(motionSurface).toBeDefined();
		const transformBeforeCenter = motionSurface?.style.transform;
		await userEvent.click(menuTrigger);
		await userEvent.click(await documentBody.findByRole('menuitem', { name: '窗口居中' }));
		await waitFor(() => expect(motionSurface?.style.transform).not.toBe(transformBeforeCenter));
		await userEvent.click(menuTrigger);
		await userEvent.click(await documentBody.findByRole('menuitem', { name: '窗口置顶' }));
		expect(surface).toHaveAttribute('data-window-pinned', 'true');
		await userEvent.click(menuTrigger);
		await expect(documentBody.findByRole('menuitem', { name: '取消置顶' })).resolves.toBeInTheDocument();
		await userEvent.click(documentBody.getByRole('menuitem', { name: '取消置顶' }));
		expect(surface).not.toHaveAttribute('data-window-pinned');
		await userEvent.dblClick(within(runbook).getByRole('button', { name: '最大化' }));
		expect(surface).toHaveAttribute('data-window-mode', 'normal');
		await userEvent.dblClick(titleBar as HTMLElement);
		expect(surface).toHaveAttribute('data-window-mode', 'maximized');
		await userEvent.click(within(runbook).getByRole('button', { name: '工作区全屏' }));
		expect(surface).toHaveAttribute('data-window-mode', 'fullscreen');
		await expect(canvas.queryByRole('navigation', { name: '窗口停靠栏' })).not.toBeInTheDocument();
		await userEvent.keyboard('{Control>}{F6}{/Control}');
		expect(surface).toHaveAttribute('data-window-mode', 'fullscreen');
		await userEvent.keyboard('{Escape}');
		expect(surface).toHaveAttribute('data-window-mode', 'maximized');
		await expect(canvas.getByRole('navigation', { name: '窗口停靠栏' })).toBeInTheDocument();
		await userEvent.dblClick(titleBar as HTMLElement);
		expect(surface).toHaveAttribute('data-window-mode', 'normal');

		await userEvent.click(canvas.getByRole('button', { name: 'Audit logs' }));
		const audit = await canvas.findByRole('dialog', { name: 'Audit logs' });
		await expect(audit).toBeInTheDocument();
		const dock = canvas.getByRole('navigation', { name: '窗口停靠栏' });
		const auditDock = within(dock).getByRole('button', { name: 'Audit logs' });
		await userEvent.click(auditDock);
		expect(canvasElement.querySelector('[data-window-id="window-1"]')).toHaveAttribute('data-window-mode', 'minimized');
		await userEvent.click(within(dock).getByRole('button', { name: /Audit logs/ }));
		await userEvent.click(within(audit).getByRole('button', { name: '关闭' }));
		await expect(canvas.queryByRole('dialog', { name: 'Audit logs' })).not.toBeInTheDocument();

		await userEvent.click(within(dock).getByRole('button', { name: '窗口管理' }));
		await expect(documentBody.findByRole('menuitem', { name: '窗口居中' })).resolves.toBeInTheDocument();
		await expect(documentBody.getByRole('menuitem', { name: '关闭当前窗口' })).toBeInTheDocument();
		await expect(documentBody.getByRole('menuitem', { name: '最小化所有窗口' })).toBeInTheDocument();
		await expect(documentBody.getByRole('menuitem', { name: '关闭所有窗口' })).toBeInTheDocument();
		await expect(documentBody.getByText('窗口管理 (3)')).toBeInTheDocument();
		await userEvent.click(documentBody.getByRole('menuitem', { name: '窗口居中' }));

		const accountMenu = within(dock).getByRole('button', { name: '账户菜单，有新通知' });
		await userEvent.click(accountMenu);
		const accountPopup = within(await documentBody.findByRole('menu'));
		await expect(accountPopup.getByText('林舟')).toBeInTheDocument();
		await expect(accountPopup.getByText('@linzhou')).toBeInTheDocument();
		await expect(accountPopup.getByRole('menuitem', { name: '个人资料' })).toBeInTheDocument();
		await expect(accountPopup.getByRole('menuitem', { name: '锁定' })).toBeInTheDocument();
		await expect(accountPopup.getByRole('menuitem', { name: '退出登录' })).toBeInTheDocument();
		await userEvent.click(accountPopup.getByRole('menuitem', { name: '偏好设置' }));
		await waitFor(() => expect(accountMenu).toHaveAttribute('aria-expanded', 'false'));
	},
};

export const FileManagerIntegration: Story = {
	render: () => <FileManagerWindowDemo />,
	parameters: {
		docs: {
			description: {
				story: 'FileManager 通过 scoped showFileManager helper 作为 WindowManager 内容运行。',
			},
		},
	},
};

export const PersistentLayout: Story = {
	render: () => <PersistentWorkspace />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const runbook = canvas.getByRole('dialog', { name: 'Runbook' });
		await new Promise((resolve) => setTimeout(resolve, 120));
		await userEvent.click(within(runbook).getByRole('button', { name: '最大化' }));
		await userEvent.click(canvas.getByRole('button', { name: 'Rerender parent' }));
		await waitFor(() =>
			expect(canvasElement.querySelector('[data-window-id="runbook"]')).toHaveAttribute(
				'data-window-mode',
				'maximized',
			),
		);
		await new Promise((resolve) => setTimeout(resolve, 120));
		await userEvent.click(canvas.getByRole('button', { name: 'Reload runtime' }));
		await waitFor(() =>
			expect(canvasElement.querySelector('[data-window-id="runbook"]')).toHaveAttribute(
				'data-window-mode',
				'maximized',
			),
		);
	},
};

export const PortalHost: Story = {
	render: () => <PortalWorkspace />,
};

export const LeftDock: Story = {
	render: () => <ManagedWorkspace store={createDemoStore('left')} />,
};

export const RightDockDark: Story = {
	globals: { theme: 'business' },
	render: () => <ManagedWorkspace store={createDemoStore('right')} />,
};
