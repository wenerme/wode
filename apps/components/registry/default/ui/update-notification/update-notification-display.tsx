'use client';

import { ArrowRight, RefreshCw, Rocket, X } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import type { UpdateNotificationController } from './use-update-notification';

export type UpdateNotificationLabels = {
	title: ReactNode;
	description: ReactNode;
	announcement: string;
	currentVersion: string;
	latestVersion: string;
	refresh: string;
	dismiss: string;
};

export type UpdateNotificationDisplayBaseProps = {
	notification: UpdateNotificationController;
	labels?: Partial<UpdateNotificationLabels>;
	onRefresh?: (notification: UpdateNotificationController) => void;
};

export type UpdateNotificationToastProps = ComponentPropsWithRef<'aside'> & UpdateNotificationDisplayBaseProps;
export type UpdateNotificationBannerProps = ComponentPropsWithRef<'aside'> & UpdateNotificationDisplayBaseProps;
export type UpdateNotificationInlineProps = ComponentPropsWithRef<'section'> & UpdateNotificationDisplayBaseProps;

export const defaultUpdateNotificationLabels: UpdateNotificationLabels = {
	title: '发现新版本',
	description: '新版本已经发布，刷新页面后即可使用。',
	announcement: '发现新版本，请刷新页面。',
	currentVersion: '当前',
	latestVersion: '最新',
	refresh: '立即刷新',
	dismiss: '稍后处理',
};

export function UpdateNotificationToast({
	notification,
	labels: labelOverrides,
	onRefresh,
	className,
	...props
}: UpdateNotificationToastProps) {
	const mounted = useMounted();
	const titleId = useId();
	const labels = { ...defaultUpdateNotificationLabels, ...labelOverrides };
	const announcement = useUpdateAnnouncement(notification, labels);
	if (!mounted) return null;

	return createPortal(
		<>
			<LiveAnnouncement text={announcement} />
			{notification.open && (
				<aside
					{...props}
					aria-labelledby={titleId}
					className={joinClassNames(
						'bg-base-100 text-base-content border-base-300 fixed right-4 bottom-4 z-[80] w-[min(calc(100vw-2rem),24rem)] border p-4 shadow-xl',
						className,
					)}
				>
					<div className='flex items-start gap-3'>
						<div
							className='bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-md'
							aria-hidden='true'
						>
							<Rocket className='size-4' />
						</div>
						<div className='min-w-0 flex-1'>
							<h2 id={titleId} className='pr-7 text-sm font-semibold'>
								{labels.title}
							</h2>
							<div className='text-base-content/70 mt-1 text-sm leading-5'>{labels.description}</div>
							<VersionTransition notification={notification} labels={labels} className='mt-3' />
						</div>
						<DismissButton notification={notification} label={labels.dismiss} className='-mt-1 -mr-1' />
					</div>
					<div className='mt-4 flex justify-end'>
						<RefreshButton notification={notification} label={labels.refresh} onRefresh={onRefresh} />
					</div>
				</aside>
			)}
		</>,
		document.body,
	);
}

export function UpdateNotificationBanner({
	notification,
	labels: labelOverrides,
	onRefresh,
	className,
	...props
}: UpdateNotificationBannerProps) {
	const mounted = useMounted();
	const titleId = useId();
	const labels = { ...defaultUpdateNotificationLabels, ...labelOverrides };
	const announcement = useUpdateAnnouncement(notification, labels);
	if (!mounted) return null;

	return createPortal(
		<>
			<LiveAnnouncement text={announcement} />
			{notification.open && (
				<aside
					{...props}
					aria-labelledby={titleId}
					className={joinClassNames(
						'bg-base-100 text-base-content border-base-300 fixed inset-x-0 top-0 z-[80] border-b shadow-md',
						className,
					)}
				>
					<div className='mx-auto grid max-w-6xl grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-4 py-3 md:flex md:flex-nowrap md:gap-x-4 md:px-6'>
						<div
							className='bg-primary/10 text-primary col-start-1 row-start-1 grid size-9 shrink-0 place-items-center rounded-md'
							aria-hidden='true'
						>
							<Rocket className='size-4' />
						</div>
						<div className='col-[2/4] row-start-1 min-w-0 flex-1'>
							<h2 id={titleId} className='text-sm font-semibold'>
								{labels.title}
							</h2>
							<div className='text-base-content/70 mt-0.5 text-sm leading-5'>{labels.description}</div>
						</div>
						<VersionTransition notification={notification} labels={labels} className='col-[1/4] row-start-2' />
						<div className='col-[1/4] row-start-3 ml-auto flex items-center gap-1'>
							<RefreshButton notification={notification} label={labels.refresh} onRefresh={onRefresh} />
							<DismissButton notification={notification} label={labels.dismiss} />
						</div>
					</div>
				</aside>
			)}
		</>,
		document.body,
	);
}

export function UpdateNotificationInline({
	notification,
	labels: labelOverrides,
	onRefresh,
	className,
	...props
}: UpdateNotificationInlineProps) {
	const titleId = useId();
	const labels = { ...defaultUpdateNotificationLabels, ...labelOverrides };
	const announcement = useUpdateAnnouncement(notification, labels);

	return (
		<>
			<LiveAnnouncement text={announcement} />
			{notification.open && (
				<section
					{...props}
					aria-labelledby={titleId}
					className={joinClassNames('border-base-300 bg-base-100 text-base-content border-y px-4 py-3', className)}
				>
					<div className='flex flex-wrap items-center gap-x-4 gap-y-3'>
						<div
							className='bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-md'
							aria-hidden='true'
						>
							<Rocket className='size-4' />
						</div>
						<div className='min-w-[12rem] flex-1'>
							<h2 id={titleId} className='text-sm font-semibold'>
								{labels.title}
							</h2>
							<div className='text-base-content/70 mt-0.5 text-sm'>{labels.description}</div>
						</div>
						<VersionTransition notification={notification} labels={labels} />
						<div className='ml-auto flex items-center gap-1'>
							<button type='button' className='btn btn-ghost btn-sm' onClick={notification.dismiss}>
								{labels.dismiss}
							</button>
							<RefreshButton notification={notification} label={labels.refresh} onRefresh={onRefresh} />
						</div>
					</div>
				</section>
			)}
		</>
	);
}

type VersionTransitionProps = {
	notification: UpdateNotificationController;
	labels: UpdateNotificationLabels;
	className?: string;
};

function VersionTransition({ notification, labels, className }: VersionTransitionProps) {
	if (!notification.currentVersion || !notification.latestVersion) return null;
	return (
		<div className={joinClassNames('flex min-w-0 flex-wrap items-center gap-2 text-xs tabular-nums', className)}>
			<span className='flex min-w-0 items-center gap-2'>
				<span className='min-w-0'>
					<span className='text-base-content/70'>{labels.currentVersion}</span>{' '}
					<code className='break-all font-mono'>{notification.currentVersion}</code>
				</span>
				<ArrowRight className='text-base-content/60 size-3.5 shrink-0' aria-hidden='true' />
			</span>
			<span className='min-w-0'>
				<span className='text-base-content/70'>{labels.latestVersion}</span>{' '}
				<code className='text-base-content break-all font-mono font-semibold'>{notification.latestVersion}</code>
			</span>
		</div>
	);
}

type NotificationActionProps = {
	notification: UpdateNotificationController;
	label: string;
	className?: string;
};

function DismissButton({ notification, label, className }: NotificationActionProps) {
	return (
		<button
			type='button'
			className={joinClassNames('btn btn-ghost btn-sm btn-square shrink-0', className)}
			onClick={notification.dismiss}
			aria-label={label}
			title={label}
		>
			<X className='size-4' />
		</button>
	);
}

type RefreshButtonProps = NotificationActionProps & {
	onRefresh?: (notification: UpdateNotificationController) => void;
};

function RefreshButton({ notification, label, onRefresh }: RefreshButtonProps) {
	return (
		<button
			type='button'
			className='btn btn-primary btn-sm shrink-0'
			onClick={() => (onRefresh ?? refreshPage)(notification)}
		>
			<RefreshCw className='size-4' />
			{label}
		</button>
	);
}

function LiveAnnouncement({ text }: { text: string }) {
	return (
		<span className='sr-only' role='status' aria-live='polite' aria-atomic='true'>
			{text}
		</span>
	);
}

function useUpdateAnnouncement(notification: UpdateNotificationController, labels: UpdateNotificationLabels) {
	const [announcement, setAnnouncement] = useState('');
	const message = notification.open
		? [
				labels.announcement,
				notification.currentVersion && `${labels.currentVersion} ${notification.currentVersion}.`,
				notification.latestVersion && `${labels.latestVersion} ${notification.latestVersion}.`,
			]
				.filter(Boolean)
				.join(' ')
		: '';
	useEffect(() => {
		const handle = window.setTimeout(() => setAnnouncement(message), 0);
		return () => window.clearTimeout(handle);
	}, [message]);
	return announcement;
}

function refreshPage() {
	if (typeof window !== 'undefined') window.location.reload();
}

function useMounted() {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	return mounted;
}

function joinClassNames(...classNames: Array<string | undefined>) {
	return classNames.filter(Boolean).join(' ');
}
