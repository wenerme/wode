'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

export const UPDATE_NOTIFICATION_DEFAULT_INTERVAL = 5 * 60 * 1000;

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export type UpdateCheckStatus = 'idle' | 'checking' | 'ready' | 'error';
export type UpdateAvailabilityStatus = 'unknown' | 'current' | 'available' | 'dismissed';
export type UpdateCheckReason = 'mount' | 'visibility' | 'interval' | 'configuration' | 'manual';

export type UpdateCheckContext = {
	reason: UpdateCheckReason;
};

export type UpdateDetectedEvent = {
	currentVersion: string;
	latestVersion: string;
	checkedAt: number;
	reason: UpdateCheckReason;
};

export type UpdateNotificationState = {
	checkStatus: UpdateCheckStatus;
	updateStatus: UpdateAvailabilityStatus;
	currentVersion?: string;
	latestVersion?: string;
	checkedAt?: number;
	error?: unknown;
	open: boolean;
};

export type UpdateNotificationController = UpdateNotificationState & {
	check: (reason?: UpdateCheckReason) => Promise<void>;
	dismiss: () => void;
	reopen: () => void;
};

export type UseUpdateNotificationOptions = {
	/** Fetches the deployed version. Pair semantic source changes with sourceKey; callback identity may change freely. */
	getVersion: (context: UpdateCheckContext) => string | undefined | Promise<string | undefined>;
	/** Loaded-page version, captured on first render. When omitted, the first successful check becomes the baseline. */
	currentVersion?: string;
	/** Change this key when the version source changes to invalidate an in-flight check and check the new source. */
	sourceKey?: string | number;
	enabled?: boolean;
	interval?: number | false;
	checkOnMount?: boolean;
	checkOnVisibility?: boolean;
	onUpdate?: (event: UpdateDetectedEvent) => void;
	onError?: (error: unknown) => void;
};

export type ResolveUpdateVersionInput = {
	currentVersion?: string;
	latestVersion: string;
	dismissedVersion?: string;
};

export type ResolvedUpdateVersion = {
	currentVersion: string;
	latestVersion: string;
	updateStatus: Exclude<UpdateAvailabilityStatus, 'unknown'>;
	open: boolean;
};

const initialState: UpdateNotificationState = {
	checkStatus: 'idle',
	updateStatus: 'unknown',
	open: false,
};

type UpdateConfiguration = {
	enabled: boolean;
	generation: number;
	getVersion: UseUpdateNotificationOptions['getVersion'];
	sourceKey?: string | number;
};

type InFlightCheck = {
	generation: number;
	promise: Promise<void>;
};

export function useUpdateNotification({
	getVersion,
	currentVersion,
	sourceKey,
	enabled = true,
	interval = UPDATE_NOTIFICATION_DEFAULT_INTERVAL,
	checkOnMount = true,
	checkOnVisibility = true,
	onUpdate,
	onError,
}: UseUpdateNotificationOptions): UpdateNotificationController {
	const configuredCurrentVersion = currentVersion?.trim() || undefined;
	const [state, setState] = useState<UpdateNotificationState>(() => ({
		...initialState,
		currentVersion: configuredCurrentVersion,
	}));
	const mountedRef = useRef(false);
	const configurationRef = useRef<UpdateConfiguration>({ enabled, generation: 0, getVersion, sourceKey });
	const onUpdateRef = useRef(onUpdate);
	const onErrorRef = useRef(onError);
	const currentVersionRef = useRef<string | undefined>(configuredCurrentVersion);
	const latestVersionRef = useRef<string | undefined>(undefined);
	const dismissedVersionRef = useRef<string | undefined>(undefined);
	const inFlightRef = useRef<InFlightCheck | undefined>(undefined);
	const pendingConfigurationRef = useRef(false);
	const pageVisible = usePageVisibility();

	useIsomorphicLayoutEffect(() => {
		const previous = configurationRef.current;
		const sourceChanged = previous.sourceKey !== sourceKey;
		const configurationChanged = previous.enabled !== enabled || sourceChanged;
		if (sourceChanged) pendingConfigurationRef.current = true;
		configurationRef.current = {
			enabled,
			generation: previous.generation + (configurationChanged ? 1 : 0),
			getVersion,
			sourceKey,
		};
		onUpdateRef.current = onUpdate;
		onErrorRef.current = onError;
		if (configurationChanged) {
			setState((current) => (current.checkStatus === 'checking' ? { ...current, checkStatus: 'idle' } : current));
		}
	}, [enabled, getVersion, onError, onUpdate, sourceKey]);

	useIsomorphicLayoutEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const check = useCallback(async (reason: UpdateCheckReason = 'manual') => {
		const configuration = configurationRef.current;
		if (!configuration.enabled) return;
		if (inFlightRef.current?.generation === configuration.generation) return inFlightRef.current.promise;

		const isCurrentConfiguration = () =>
			mountedRef.current &&
			configurationRef.current.enabled &&
			configurationRef.current.generation === configuration.generation;
		const run = async () => {
			if (mountedRef.current) {
				setState((current) => ({ ...current, checkStatus: 'checking', error: undefined }));
			}
			try {
				const value = await configuration.getVersion({ reason });
				if (!isCurrentConfiguration()) return;
				const latestVersion = value?.trim();
				const checkedAt = Date.now();
				if (!latestVersion) {
					setState((current) => ({ ...current, checkStatus: 'ready', checkedAt, error: undefined }));
					return;
				}

				const previousLatestVersion = latestVersionRef.current;
				const resolved = resolveUpdateVersion({
					currentVersion: currentVersionRef.current,
					latestVersion,
					dismissedVersion: dismissedVersionRef.current,
				});
				currentVersionRef.current = resolved.currentVersion;
				latestVersionRef.current = latestVersion;
				if (resolved.updateStatus === 'current') dismissedVersionRef.current = undefined;
				setState({ ...resolved, checkStatus: 'ready', checkedAt, error: undefined });

				if (resolved.updateStatus === 'available' && previousLatestVersion !== latestVersion) {
					notifyCallback(
						() => onUpdateRef.current?.({ ...resolved, checkedAt, reason }),
						'[UpdateNotification] onUpdate failed.',
					);
				}
			} catch (error) {
				if (!isCurrentConfiguration()) return;
				setState((current) => ({ ...current, checkStatus: 'error', checkedAt: Date.now(), error }));
				notifyCallback(() => onErrorRef.current?.(error), '[UpdateNotification] onError failed.');
			}
		};

		const promise = run();
		const request = { generation: configuration.generation, promise };
		inFlightRef.current = request;
		try {
			await promise;
		} finally {
			if (inFlightRef.current === request) inFlightRef.current = undefined;
		}
	}, []);

	const dismiss = useCallback(() => {
		const latestVersion = latestVersionRef.current;
		if (!latestVersion || latestVersion === currentVersionRef.current) return;
		dismissedVersionRef.current = latestVersion;
		setState((current) => ({ ...current, updateStatus: 'dismissed', open: false }));
	}, []);

	const reopen = useCallback(() => {
		const latestVersion = latestVersionRef.current;
		if (!latestVersion || latestVersion === currentVersionRef.current) return;
		dismissedVersionRef.current = undefined;
		setState((current) => ({ ...current, updateStatus: 'available', open: true }));
	}, []);

	const autoCheckRef = useRef({ activated: false, enabled: false, visible: pageVisible });
	useEffect(() => {
		const previous = autoCheckRef.current;
		const visible = getPageVisibility();
		let reason: UpdateCheckReason | undefined;
		if (enabled && visible) {
			if (pendingConfigurationRef.current) {
				reason = 'configuration';
			} else if (!previous.activated) {
				if (checkOnMount || (!previous.visible && checkOnVisibility)) {
					reason = previous.visible ? 'mount' : 'visibility';
				}
			} else if (!previous.enabled) {
				if (checkOnMount) reason = 'mount';
			} else if (!previous.visible && checkOnVisibility) {
				reason = 'visibility';
			}
		}
		autoCheckRef.current = {
			activated: previous.activated || (enabled && visible),
			enabled,
			visible,
		};
		if (reason) {
			pendingConfigurationRef.current = false;
			void check(reason);
		}
	}, [check, checkOnMount, checkOnVisibility, enabled, pageVisible, sourceKey]);

	useEffect(() => {
		if (!enabled || !getPageVisibility() || interval === false) return;
		const delay = normalizeInterval(interval);
		if (delay === 0) return;
		const handle = window.setInterval(() => void check('interval'), delay);
		return () => window.clearInterval(handle);
	}, [check, enabled, interval, pageVisible]);

	return { ...state, check, dismiss, reopen };
}

export function resolveUpdateVersion({
	currentVersion,
	latestVersion,
	dismissedVersion,
}: ResolveUpdateVersionInput): ResolvedUpdateVersion {
	const baseline = currentVersion ?? latestVersion;
	if (baseline === latestVersion) {
		return { currentVersion: baseline, latestVersion, updateStatus: 'current', open: false };
	}
	const dismissed = dismissedVersion === latestVersion;
	return {
		currentVersion: baseline,
		latestVersion,
		updateStatus: dismissed ? 'dismissed' : 'available',
		open: !dismissed,
	};
}

function usePageVisibility() {
	return useSyncExternalStore(subscribePageVisibility, getPageVisibility, getServerPageVisibility);
}

function subscribePageVisibility(onStoreChange: () => void) {
	if (typeof document === 'undefined') return () => undefined;
	document.addEventListener('visibilitychange', onStoreChange);
	return () => document.removeEventListener('visibilitychange', onStoreChange);
}

function getPageVisibility() {
	return typeof document === 'undefined' || !document.hidden;
}

function getServerPageVisibility() {
	return true;
}

function normalizeInterval(interval: number) {
	if (!Number.isFinite(interval) || interval <= 0) return 0;
	return Math.max(1000, interval);
}

function notifyCallback(callback: () => void, message: string) {
	try {
		callback();
	} catch (error) {
		console.error(message, error);
	}
}
