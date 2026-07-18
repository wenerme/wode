'use client';

import type { ComponentPropsWithRef } from 'react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type ConsoleAboutClientSnapshot = {
	colorScheme?: 'dark' | 'light';
	devicePixelRatio?: number;
	language?: string;
	reducedMotion?: boolean;
	screen?: string;
	timezone?: string;
	userAgent?: string;
	viewport?: string;
};

export type ConsoleAboutClientMessages = {
	colorSchemeLabel: string;
	darkScheme: string;
	devicePixelRatioLabel: string;
	languageLabel: string;
	lightScheme: string;
	no: string;
	reducedMotionLabel: string;
	screenLabel: string;
	timezoneLabel: string;
	unavailable: string;
	userAgentSummary: string;
	viewportLabel: string;
	yes: string;
};

export type ConsoleAboutClientInfoProps = ComponentPropsWithRef<'div'> & {
	messages?: Partial<ConsoleAboutClientMessages>;
	showUserAgent?: boolean;
};

const defaultClientMessages: ConsoleAboutClientMessages = {
	colorSchemeLabel: '偏好主题',
	darkScheme: '暗色',
	devicePixelRatioLabel: '设备像素比',
	languageLabel: '语言',
	lightScheme: '亮色',
	no: '否',
	reducedMotionLabel: '减少动态效果',
	screenLabel: '屏幕',
	timezoneLabel: '时区',
	unavailable: '—',
	userAgentSummary: '查看用户代理',
	viewportLabel: '窗口',
	yes: '是',
};

export function ConsoleAboutClientInfo({
	className,
	messages: messageOverrides,
	showUserAgent = true,
	...props
}: ConsoleAboutClientInfoProps) {
	const [snapshot, setSnapshot] = useState<ConsoleAboutClientSnapshot>();
	const messages = { ...defaultClientMessages, ...messageOverrides };

	useEffect(() => {
		const update = () => setSnapshot(readClientSnapshot());
		const dark = getMediaQuery('(prefers-color-scheme: dark)');
		const reducedMotion = getMediaQuery('(prefers-reduced-motion: reduce)');
		update();
		window.addEventListener('resize', update);
		const unsubscribeDark = subscribeMediaQuery(dark, update);
		const unsubscribeReducedMotion = subscribeMediaQuery(reducedMotion, update);
		return () => {
			window.removeEventListener('resize', update);
			unsubscribeDark();
			unsubscribeReducedMotion();
		};
	}, []);

	const details = [
		[messages.viewportLabel, snapshot?.viewport],
		[messages.screenLabel, snapshot?.screen],
		[messages.devicePixelRatioLabel, snapshot?.devicePixelRatio],
		[messages.languageLabel, snapshot?.language],
		[messages.timezoneLabel, snapshot?.timezone],
		[
			messages.colorSchemeLabel,
			snapshot?.colorScheme
				? snapshot.colorScheme === 'dark'
					? messages.darkScheme
					: messages.lightScheme
				: undefined,
		],
		[
			messages.reducedMotionLabel,
			snapshot?.reducedMotion === undefined ? undefined : snapshot.reducedMotion ? messages.yes : messages.no,
		],
	] as const;

	return (
		<div className={cn('min-w-0', className)} {...props}>
			<dl className='border-base-300 grid border-y sm:grid-cols-2'>
				{details.map(([label, value], index) => (
					<div
						key={label}
						className={cn(
							'border-base-300 grid grid-cols-[7rem_minmax(0,1fr)] gap-3 border-b py-2.5 text-sm',
							'sm:px-3 sm:odd:border-r sm:odd:pl-0 sm:even:pr-0',
							index >= details.length - 2 && 'sm:border-b-0',
						)}
					>
						<dt className='text-base-content/70'>{label}</dt>
						<dd className='min-w-0 font-medium break-words'>{value ?? messages.unavailable}</dd>
					</div>
				))}
			</dl>
			{showUserAgent ? (
				<details className='border-base-300 mt-3 border-b pb-3'>
					<summary className='hover:text-primary focus-visible:ring-primary w-fit cursor-pointer text-sm font-medium outline-none focus-visible:ring-2'>
						{messages.userAgentSummary}
					</summary>
					<div className='bg-base-200/60 mt-2 overflow-x-auto rounded-sm p-3 font-mono text-xs leading-5 break-all'>
						{snapshot?.userAgent ?? messages.unavailable}
					</div>
				</details>
			) : null}
		</div>
	);
}

function readClientSnapshot(): ConsoleAboutClientSnapshot {
	const dark = getMediaQuery('(prefers-color-scheme: dark)');
	const reducedMotion = getMediaQuery('(prefers-reduced-motion: reduce)');
	return {
		viewport: `${window.innerWidth}×${window.innerHeight}`,
		screen: `${window.screen.width}×${window.screen.height}`,
		devicePixelRatio: window.devicePixelRatio,
		language: navigator.language,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		colorScheme: dark ? (dark.matches ? 'dark' : 'light') : undefined,
		reducedMotion: reducedMotion?.matches,
		userAgent: navigator.userAgent,
	};
}

function getMediaQuery(query: string) {
	return typeof window.matchMedia === 'function' ? window.matchMedia(query) : undefined;
}

function subscribeMediaQuery(query: MediaQueryList | undefined, listener: () => void) {
	if (!query) return () => undefined;
	if (typeof query.addEventListener === 'function') {
		query.addEventListener('change', listener);
		return () => query.removeEventListener('change', listener);
	}
	if (typeof query.addListener === 'function') {
		query.addListener(listener);
		return () => query.removeListener(listener);
	}
	return () => undefined;
}
