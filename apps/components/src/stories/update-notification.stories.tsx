import type { Meta, StoryObj } from '@storybook/react-vite';
import { CloudUpload, Eye, GitBranch, RefreshCw } from 'lucide-react';
import { StrictMode, useRef, useState } from 'react';
import {
	UpdateNotificationBanner,
	type UpdateNotificationController,
	type UpdateNotificationDisplay,
	UpdateNotificationInline,
	UpdateNotificationPresenter,
	UpdateNotificationToast,
	useUpdateNotification,
} from '../../registry/default/ui/update-notification';

const meta = {
	title: 'Utilities/Update Notification',
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Toast: Story = {
	render: () => <PresentationFixture display='toast' />,
};

export const Banner: Story = {
	render: () => <PresentationFixture display='banner' />,
};

export const Inline: Story = {
	render: () => <PresentationFixture display='inline' />,
};

export const StateAndDisplay: Story = {
	render: () => (
		<StrictMode>
			<StateAndDisplayDemo />
		</StrictMode>
	),
};

function PresentationFixture({ display }: { display: UpdateNotificationDisplay }) {
	const [open, setOpen] = useState(true);
	const [lastAction, setLastAction] = useState('等待操作');
	const notification: UpdateNotificationController = {
		checkStatus: 'ready',
		updateStatus: open ? 'available' : 'dismissed',
		currentVersion: '2026.07.12.1',
		latestVersion: '2026.07.12.2',
		checkedAt: Date.now(),
		open,
		check: async () => undefined,
		dismiss: () => {
			setOpen(false);
			setLastAction('已稍后处理');
		},
		reopen: () => {
			setOpen(true);
			setLastAction('等待操作');
		},
	};
	const shared = {
		notification,
		onRefresh: () => setLastAction('已请求刷新'),
	};

	return (
		<>
			<main className='mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 md:px-8'>
				<h1 className='sr-only'>Update notification {display}</h1>
				{display === 'inline' && (
					<div className='mt-12'>
						<UpdateNotificationInline {...shared} />
					</div>
				)}
				<div className='mt-auto flex items-end justify-between gap-4 py-8'>
					<span className='text-base-content/70 text-sm'>{lastAction}</span>
					{!open && (
						<button type='button' className='btn btn-neutral btn-sm' onClick={notification.reopen}>
							<Eye className='size-4' />
							重新显示
						</button>
					)}
				</div>
			</main>
			{display === 'toast' && <UpdateNotificationToast {...shared} />}
			{display === 'banner' && <UpdateNotificationBanner {...shared} />}
		</>
	);
}

function StateAndDisplayDemo() {
	const deployedVersionRef = useRef('2026.07.12.1');
	const [deployedVersion, setDeployedVersion] = useState(deployedVersionRef.current);
	const [display, setDisplay] = useState<UpdateNotificationDisplay>('toast');
	const [refreshRequested, setRefreshRequested] = useState(false);
	const [checkCount, setCheckCount] = useState(0);
	const [sourceKey, setSourceKey] = useState('stable');
	const notification = useUpdateNotification({
		getVersion: () => {
			setCheckCount((count) => count + 1);
			return deployedVersionRef.current;
		},
		currentVersion: '2026.07.12.1',
		sourceKey,
		interval: false,
		checkOnVisibility: false,
	});

	const publish = async () => {
		const nextVersion = incrementVersion(deployedVersionRef.current);
		deployedVersionRef.current = nextVersion;
		setDeployedVersion(nextVersion);
		await notification.check();
	};

	return (
		<main className='mx-auto min-h-screen w-full max-w-5xl px-4 py-8 md:px-8'>
			<header className='border-base-300 flex flex-wrap items-end justify-between gap-4 border-b pb-5'>
				<div>
					<div className='text-base-content/70 text-xs font-medium'>RELEASE CHANNEL</div>
					<h1 className='mt-1 text-xl font-semibold'>Web update status</h1>
				</div>
				<fieldset className='join'>
					<legend className='sr-only'>通知展示方式</legend>
					{(['toast', 'banner', 'inline'] as const).map((item) => (
						<button
							key={item}
							type='button'
							className={`btn join-item btn-sm ${display === item ? 'btn-neutral' : 'btn-ghost'}`}
							aria-pressed={display === item}
							onClick={() => setDisplay(item)}
						>
							{item}
						</button>
					))}
				</fieldset>
			</header>

			<section className='border-base-300 grid gap-px border-y bg-base-300 sm:grid-cols-2 lg:grid-cols-6'>
				<StatusValue label='检查状态' value={notification.checkStatus} />
				<StatusValue label='更新状态' value={notification.updateStatus} />
				<StatusValue label='检查次数' value={String(checkCount)} />
				<StatusValue label='版本源' value={sourceKey} />
				<StatusValue label='页面版本' value={notification.currentVersion ?? '-'} />
				<StatusValue label='部署版本' value={deployedVersion} />
			</section>

			<div className='mt-5 flex flex-wrap items-center gap-2'>
				<button type='button' className='btn btn-primary btn-sm' onClick={() => void publish()}>
					<CloudUpload className='size-4' />
					发布下一版本
				</button>
				<button type='button' className='btn btn-ghost btn-sm' onClick={() => void notification.check()}>
					<RefreshCw className={`size-4 ${notification.checkStatus === 'checking' ? 'animate-spin' : ''}`} />
					检查
				</button>
				<button
					type='button'
					className='btn btn-ghost btn-sm'
					onClick={() => setSourceKey((key) => (key === 'stable' ? 'canary' : 'stable'))}
				>
					<GitBranch className='size-4' />
					切换通道
				</button>
				{notification.updateStatus === 'dismissed' && (
					<button type='button' className='btn btn-ghost btn-sm' onClick={notification.reopen}>
						<Eye className='size-4' />
						重新显示
					</button>
				)}
				{refreshRequested && <span className='text-success ml-auto text-sm font-medium'>刷新请求已收到</span>}
			</div>

			{display === 'inline' && (
				<div className='mt-8'>
					<UpdateNotificationPresenter
						display={display}
						notification={notification}
						onRefresh={() => setRefreshRequested(true)}
					/>
				</div>
			)}
			{display !== 'inline' && (
				<UpdateNotificationPresenter
					display={display}
					notification={notification}
					onRefresh={() => setRefreshRequested(true)}
				/>
			)}
		</main>
	);
}

function StatusValue({ label, value }: { label: string; value: string }) {
	return (
		<div className='bg-base-100 px-4 py-4'>
			<div className='text-base-content/70 text-xs'>{label}</div>
			<div className='mt-1 break-all font-mono text-sm font-medium'>{value}</div>
		</div>
	);
}

function incrementVersion(version: string) {
	const segments = version.split('.');
	const patch = Number(segments.at(-1) ?? 0);
	segments[segments.length - 1] = String(Number.isFinite(patch) ? patch + 1 : 1);
	return segments.join('.');
}
