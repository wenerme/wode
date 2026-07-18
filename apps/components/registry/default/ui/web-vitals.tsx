'use client';

import { useEffect, useRef } from 'react';
import type { MetricType, MetricWithAttribution, ReportOpts } from 'web-vitals';

export const WEB_VITAL_EVENT = 'wener:web-vital';

export type WebVitalMetric = MetricType | MetricWithAttribution;
export type WebVitalsReporter = (metric: WebVitalMetric) => void;
export type WebVitalsLoadStrategy = 'idle' | 'immediate';

export type UseReportWebVitalsOptions = {
	enabled?: boolean;
	/** Collector identity options are captured when this hook is first enabled. */
	attribution?: boolean;
	reportAllChanges?: boolean;
	loadStrategy?: WebVitalsLoadStrategy;
	idleTimeout?: number;
	/** Delay before retrying a failed dynamic import. Set false to disable retries. */
	retryDelay?: number | false;
	onError?: (error: unknown) => void;
};

export type WebVitalsProps = UseReportWebVitalsOptions & {
	onMetric?: WebVitalsReporter;
};

export function WebVitals({ onMetric = dispatchWebVital, onError = reportWebVitalsError, ...options }: WebVitalsProps) {
	useReportWebVitals(onMetric, { ...options, onError });
	return null;
}

export function useReportWebVitals(
	onMetric: WebVitalsReporter,
	{
		enabled = true,
		attribution = false,
		reportAllChanges = false,
		loadStrategy = 'idle',
		idleTimeout = 2000,
		retryDelay = 5000,
		onError,
	}: UseReportWebVitalsOptions = {},
) {
	const reporterRef = useRef(onMetric);
	const errorRef = useRef(onError);
	const collectorOptionsRef = useRef<CollectorOptions | undefined>(undefined);
	reporterRef.current = onMetric;
	errorRef.current = onError;
	if (enabled && !collectorOptionsRef.current) collectorOptionsRef.current = { attribution, reportAllChanges };

	useEffect(() => {
		const collectorOptions = collectorOptionsRef.current;
		if (!enabled || typeof window === 'undefined' || !collectorOptions) return;
		let unsubscribe: (() => void) | undefined;
		const cancelSchedule = scheduleWebVitalsCollection(
			() => {
				unsubscribe = subscribeWebVitalsCollector(collectorOptions, {
					onMetric: (metric) => reporterRef.current(metric),
					onError: (error) => errorRef.current?.(error),
					retryDelay,
				});
			},
			loadStrategy,
			idleTimeout,
		);
		return () => {
			cancelSchedule();
			unsubscribe?.();
		};
	}, [enabled, idleTimeout, loadStrategy, retryDelay]);
}

export function dispatchWebVital(metric: WebVitalMetric) {
	if (typeof window === 'undefined') return;
	window.dispatchEvent(new CustomEvent<WebVitalMetric>(WEB_VITAL_EVENT, { detail: metric }));
}

type CollectorOptions = {
	attribution: boolean;
	reportAllChanges: boolean;
};

type CollectorSubscriber = {
	onMetric: WebVitalsReporter;
	onError: (error: unknown) => void;
	retryDelay: number | false;
};

type WebVitalsModule = {
	onCLS: (reporter: WebVitalsReporter, options?: ReportOpts) => void;
	onFCP: (reporter: WebVitalsReporter, options?: ReportOpts) => void;
	onINP: (reporter: WebVitalsReporter, options?: ReportOpts) => void;
	onLCP: (reporter: WebVitalsReporter, options?: ReportOpts) => void;
	onTTFB: (reporter: WebVitalsReporter, options?: ReportOpts) => void;
};

type WebVitalsCollector = {
	initialized: boolean;
	loading?: Promise<void>;
	retryAttempt?: number;
	retryTimer?: ReturnType<typeof setTimeout>;
	subscribers: Set<CollectorSubscriber>;
};

const collectors = new Map<string, WebVitalsCollector>();

function subscribeWebVitalsCollector(options: CollectorOptions, subscriber: CollectorSubscriber) {
	const key = `${options.attribution ? 'attribution' : 'standard'}:${options.reportAllChanges ? 'changes' : 'final'}`;
	let collector = collectors.get(key);
	if (!collector) {
		collector = { initialized: false, subscribers: new Set() };
		collectors.set(key, collector);
	}
	collector.subscribers.add(subscriber);
	if (collector.retryTimer) {
		if (subscriber.retryDelay !== false) rescheduleCollectorRetry(collector, options);
	} else {
		startWebVitalsCollector(collector, options);
	}
	return () => {
		collector.subscribers.delete(subscriber);
		if (collector.retryTimer && subscriber.retryDelay !== false) rescheduleCollectorRetry(collector, options);
	};
}

function startWebVitalsCollector(collector: WebVitalsCollector, options: CollectorOptions) {
	if (collector.initialized || collector.loading || collector.retryTimer) return;
	collector.loading = loadWebVitalsModule(options.attribution)
		.then((module) => {
			collector.loading = undefined;
			if (collector.subscribers.size === 0) return;
			collector.initialized = true;
			collector.retryAttempt = 0;
			const report: WebVitalsReporter = (metric) => {
				for (const subscriber of collector.subscribers) {
					try {
						subscriber.onMetric(metric);
					} catch (error) {
						notifySubscriberError(subscriber, error);
					}
				}
			};
			const reportOptions: ReportOpts = { reportAllChanges: options.reportAllChanges };
			module.onCLS(report, reportOptions);
			module.onFCP(report, reportOptions);
			module.onINP(report, reportOptions);
			module.onLCP(report, reportOptions);
			module.onTTFB(report, reportOptions);
		})
		.catch((error) => {
			collector.loading = undefined;
			for (const subscriber of collector.subscribers) notifySubscriberError(subscriber, error);
			scheduleCollectorRetry(collector, options);
		});
}

function scheduleCollectorRetry(collector: WebVitalsCollector, options: CollectorOptions) {
	const delays = Array.from(collector.subscribers)
		.map((subscriber) => subscriber.retryDelay)
		.filter((delay): delay is number => delay !== false);
	if (delays.length === 0) return;
	const attempt = collector.retryAttempt ?? 0;
	const baseDelay = Math.min(...delays.map((delay) => Math.max(250, nonNegativeOr(delay, 5000))));
	const delay = Math.min(baseDelay * 2 ** attempt, 60_000);
	collector.retryTimer = setTimeout(() => {
		collector.retryTimer = undefined;
		collector.retryAttempt = attempt + 1;
		if (hasRetrySubscriber(collector)) startWebVitalsCollector(collector, options);
	}, delay);
}

function rescheduleCollectorRetry(collector: WebVitalsCollector, options: CollectorOptions) {
	if (collector.retryTimer) clearTimeout(collector.retryTimer);
	collector.retryTimer = undefined;
	if (hasRetrySubscriber(collector)) scheduleCollectorRetry(collector, options);
}

function hasRetrySubscriber(collector: WebVitalsCollector) {
	return Array.from(collector.subscribers).some((subscriber) => subscriber.retryDelay !== false);
}

function notifySubscriberError(subscriber: CollectorSubscriber, error: unknown) {
	try {
		subscriber.onError(error);
	} catch (handlerError) {
		console.error('[WebVitals] Error handler failed.', handlerError);
	}
}

async function loadWebVitalsModule(attribution: boolean): Promise<WebVitalsModule> {
	const module = attribution ? await import('web-vitals/attribution') : await import('web-vitals');
	return module as unknown as WebVitalsModule;
}

function scheduleWebVitalsCollection(callback: () => void, strategy: WebVitalsLoadStrategy, idleTimeout: number) {
	const timeout = nonNegativeOr(idleTimeout, 2000);
	if (strategy === 'idle' && typeof window.requestIdleCallback === 'function') {
		const handle = window.requestIdleCallback(callback, { timeout });
		return () => window.cancelIdleCallback(handle);
	}
	const handle = window.setTimeout(callback, strategy === 'immediate' ? 0 : timeout);
	return () => window.clearTimeout(handle);
}

function reportWebVitalsError(error: unknown) {
	console.error('[WebVitals] Failed to collect metrics.', error);
}

function nonNegativeOr(value: number, fallback: number) {
	return Number.isFinite(value) && value >= 0 ? value : fallback;
}
