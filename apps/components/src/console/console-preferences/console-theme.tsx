'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
	assertConsoleThemeOptions,
	type ConsoleThemeColorScheme,
	type ConsoleThemeOption,
	defaultConsoleThemeOptions,
} from './console-theme-catalog';

export type { ConsoleThemeColorScheme, ConsoleThemeOption } from './console-theme-catalog';
export { defaultConsoleThemeOptions } from './console-theme-catalog';

export const DEFAULT_CONSOLE_DISPLAY_SETTINGS_KEY = 'console.display-settings.v1';
export const CONSOLE_DISPLAY_SETTINGS_EVENT = 'wener:console-display-settings';

export type ConsoleDisplayDensity = 'comfortable' | 'compact';
export type ConsoleDisplayRadius = 'square' | 'soft' | 'rounded';
export type ConsoleMotionPreference = 'system' | 'reduced' | 'full';
export type ConsoleThemeMode = 'system' | ConsoleThemeColorScheme;

export type ConsoleDisplaySettings = {
	themeMode: ConsoleThemeMode;
	lightTheme: string;
	darkTheme: string;
	density: ConsoleDisplayDensity;
	radius: ConsoleDisplayRadius;
	motion: ConsoleMotionPreference;
};

export type ConsoleDisplaySettingsEventDetail = {
	storageKey: string;
	settings: ConsoleDisplaySettings;
};

export type ResolvedConsoleTheme = {
	theme: string;
	colorScheme: ConsoleThemeColorScheme;
	option: ConsoleThemeOption;
};

export const defaultConsoleDisplaySettings: ConsoleDisplaySettings = {
	themeMode: 'system',
	lightTheme: 'wener',
	darkTheme: 'dark',
	density: 'comfortable',
	radius: 'soft',
	motion: 'system',
};

export function getDefaultConsoleDisplaySettings(
	themeOptions: readonly ConsoleThemeOption[] = defaultConsoleThemeOptions,
): ConsoleDisplaySettings {
	const defaults = getConsoleThemeDefaults(themeOptions);
	return {
		...defaultConsoleDisplaySettings,
		lightTheme: defaults.light.value,
		darkTheme: defaults.dark.value,
	};
}

export type ConsoleThemeControllerProps = {
	storageKey?: string;
	themeOptions?: readonly ConsoleThemeOption[];
};

export function ConsoleThemeController({
	storageKey = DEFAULT_CONSOLE_DISPLAY_SETTINGS_KEY,
	themeOptions = defaultConsoleThemeOptions,
}: ConsoleThemeControllerProps) {
	assertConsoleThemeOptions(themeOptions);
	useEffect(() => {
		const colorMedia = window.matchMedia('(prefers-color-scheme: dark)');
		const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
		const apply = () => applyConsoleDisplaySettings(loadConsoleDisplaySettings(storageKey, themeOptions), themeOptions);
		const onStorage = (event: StorageEvent) => {
			if (event.key === storageKey) apply();
		};
		const onSettings = (event: Event) => {
			const detail = (event as CustomEvent<ConsoleDisplaySettingsEventDetail>).detail;
			if (detail?.storageKey === storageKey) applyConsoleDisplaySettings(detail.settings, themeOptions);
		};
		apply();
		colorMedia.addEventListener('change', apply);
		motionMedia.addEventListener('change', apply);
		window.addEventListener('storage', onStorage);
		window.addEventListener(CONSOLE_DISPLAY_SETTINGS_EVENT, onSettings);
		return () => {
			colorMedia.removeEventListener('change', apply);
			motionMedia.removeEventListener('change', apply);
			window.removeEventListener('storage', onStorage);
			window.removeEventListener(CONSOLE_DISPLAY_SETTINGS_EVENT, onSettings);
		};
	}, [storageKey, themeOptions]);
	return null;
}

export function useConsoleDisplaySettings({
	storageKey = DEFAULT_CONSOLE_DISPLAY_SETTINGS_KEY,
	themeOptions = defaultConsoleThemeOptions,
}: ConsoleThemeControllerProps = {}) {
	const [settings, setSettings] = useState<ConsoleDisplaySettings>(() =>
		getDefaultConsoleDisplaySettings(themeOptions),
	);
	const settingsRef = useRef(settings);
	const systemDark = useSyncExternalStore(
		subscribeConsoleSystemColorScheme,
		getConsoleSystemPrefersDark,
		getConsoleServerPrefersDark,
	);
	const systemReducedMotion = useSyncExternalStore(
		subscribeConsoleSystemReducedMotion,
		getConsoleSystemPrefersReducedMotion,
		getConsoleServerPrefersReducedMotion,
	);

	useEffect(() => {
		const sync = () => {
			const next = loadConsoleDisplaySettings(storageKey, themeOptions);
			settingsRef.current = next;
			setSettings(next);
			applyConsoleDisplaySettings(next, themeOptions);
		};
		const onStorage = (event: StorageEvent) => {
			if (event.key === storageKey) sync();
		};
		const onSettings = (event: Event) => {
			const detail = (event as CustomEvent<ConsoleDisplaySettingsEventDetail>).detail;
			if (detail?.storageKey !== storageKey) return;
			const next = normalizeConsoleDisplaySettings(detail.settings, themeOptions);
			settingsRef.current = next;
			setSettings(next);
			applyConsoleDisplaySettings(next, themeOptions);
		};
		sync();
		window.addEventListener('storage', onStorage);
		window.addEventListener(CONSOLE_DISPLAY_SETTINGS_EVENT, onSettings);
		return () => {
			window.removeEventListener('storage', onStorage);
			window.removeEventListener(CONSOLE_DISPLAY_SETTINGS_EVENT, onSettings);
		};
	}, [storageKey, themeOptions]);

	useEffect(() => {
		applyConsoleDisplaySettings(settingsRef.current, themeOptions);
	}, [systemDark, systemReducedMotion, themeOptions]);

	const replace = useCallback(
		(next: ConsoleDisplaySettings) => {
			const normalized = normalizeConsoleDisplaySettings(next, themeOptions);
			settingsRef.current = normalized;
			setSettings(normalized);
			saveConsoleDisplaySettings(normalized, storageKey, themeOptions);
			applyConsoleDisplaySettings(normalized, themeOptions);
		},
		[storageKey, themeOptions],
	);

	const update = useCallback(
		(patch: Partial<ConsoleDisplaySettings>) =>
			replace(patchConsoleDisplaySettings(settingsRef.current, patch, themeOptions)),
		[replace, themeOptions],
	);

	const reset = useCallback(() => replace(getDefaultConsoleDisplaySettings(themeOptions)), [replace, themeOptions]);
	const resolvedTheme = useMemo(
		() => resolveConsoleTheme(settings, themeOptions, systemDark),
		[settings, systemDark, themeOptions],
	);
	const motionReduced = resolveConsoleMotion(settings, systemReducedMotion);
	return { settings, systemDark, systemReducedMotion, motionReduced, resolvedTheme, update, reset } as const;
}

export function normalizeConsoleDisplaySettings(
	input?: unknown,
	themeOptions: readonly ConsoleThemeOption[] = defaultConsoleThemeOptions,
): ConsoleDisplaySettings {
	const defaults = getConsoleThemeDefaults(themeOptions);
	const value = isRecord(input) ? input : {};
	const legacyTheme = typeof value.theme === 'string' && value.theme ? value.theme : undefined;
	let themeMode: ConsoleThemeMode =
		value.themeMode === 'light' || value.themeMode === 'dark' || value.themeMode === 'system'
			? value.themeMode
			: 'system';
	let lightTheme = typeof value.lightTheme === 'string' && value.lightTheme ? value.lightTheme : undefined;
	let darkTheme = typeof value.darkTheme === 'string' && value.darkTheme ? value.darkTheme : undefined;

	if (!('themeMode' in value) && legacyTheme) {
		if (legacyTheme === 'system') {
			themeMode = 'system';
		} else {
			const legacyOption =
				themeOptions.find((option) => option.value === legacyTheme) ??
				defaultConsoleThemeOptions.find((option) => option.value === legacyTheme);
			themeMode = legacyOption?.colorScheme ?? 'light';
			if (themeMode === 'dark') darkTheme = legacyTheme;
			else lightTheme = legacyTheme;
		}
	}

	return {
		themeMode,
		lightTheme: normalizeThemeSlot(lightTheme, 'light', defaults.light, themeOptions),
		darkTheme: normalizeThemeSlot(darkTheme, 'dark', defaults.dark, themeOptions),
		density: value.density === 'compact' ? 'compact' : 'comfortable',
		radius: value.radius === 'square' || value.radius === 'rounded' ? value.radius : 'soft',
		motion:
			value.motion === 'reduced' || value.motion === 'full' || value.motion === 'system'
				? value.motion
				: 'reducedMotion' in value
					? value.reducedMotion === true
						? 'reduced'
						: 'full'
					: 'system',
	};
}

export function patchConsoleDisplaySettings(
	settings: ConsoleDisplaySettings,
	patch: Partial<ConsoleDisplaySettings>,
	themeOptions: readonly ConsoleThemeOption[] = defaultConsoleThemeOptions,
) {
	return normalizeConsoleDisplaySettings({ ...settings, ...patch }, themeOptions);
}

export function resolveConsoleTheme(
	settings: ConsoleDisplaySettings,
	themeOptions: readonly ConsoleThemeOption[] = defaultConsoleThemeOptions,
	systemDark = getConsoleSystemPrefersDark(),
): ResolvedConsoleTheme {
	const normalized = normalizeConsoleDisplaySettings(settings, themeOptions);
	const colorScheme: ConsoleThemeColorScheme =
		normalized.themeMode === 'system' ? (systemDark ? 'dark' : 'light') : normalized.themeMode;
	const requestedTheme = colorScheme === 'dark' ? normalized.darkTheme : normalized.lightTheme;
	const defaults = getConsoleThemeDefaults(themeOptions);
	const fallback = colorScheme === 'dark' ? defaults.dark : defaults.light;
	const listedOption = themeOptions.find((theme) => theme.value === requestedTheme);
	const option =
		listedOption?.colorScheme === colorScheme
			? listedOption
			: listedOption
				? fallback
				: ({
						value: requestedTheme,
						label: requestedTheme,
						colorScheme,
						description: '自定义主题',
					} satisfies ConsoleThemeOption);
	return { theme: option.value, colorScheme: option.colorScheme, option };
}

export function getConsoleSystemPrefersDark() {
	return getConsoleMediaPreference('(prefers-color-scheme: dark)');
}

export function getConsoleSystemPrefersReducedMotion() {
	return getConsoleMediaPreference('(prefers-reduced-motion: reduce)');
}

export function resolveConsoleMotion(
	settings: Pick<ConsoleDisplaySettings, 'motion'>,
	systemReducedMotion = getConsoleSystemPrefersReducedMotion(),
) {
	return settings.motion === 'system' ? systemReducedMotion : settings.motion === 'reduced';
}

function getConsoleServerPrefersDark() {
	return false;
}

function getConsoleServerPrefersReducedMotion() {
	return false;
}

function subscribeConsoleSystemColorScheme(onChange: () => void) {
	return subscribeConsoleMediaPreference('(prefers-color-scheme: dark)', onChange);
}

function subscribeConsoleSystemReducedMotion(onChange: () => void) {
	return subscribeConsoleMediaPreference('(prefers-reduced-motion: reduce)', onChange);
}

function getConsoleMediaPreference(query: string) {
	return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

function subscribeConsoleMediaPreference(query: string, onChange: () => void) {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => undefined;
	const media = window.matchMedia(query);
	media.addEventListener('change', onChange);
	return () => media.removeEventListener('change', onChange);
}

export function loadConsoleDisplaySettings(
	storageKey = DEFAULT_CONSOLE_DISPLAY_SETTINGS_KEY,
	themeOptions: readonly ConsoleThemeOption[] = defaultConsoleThemeOptions,
): ConsoleDisplaySettings {
	const defaults = getDefaultConsoleDisplaySettings(themeOptions);
	if (typeof window === 'undefined') return defaults;
	try {
		const raw = window.localStorage.getItem(storageKey);
		if (!raw) return defaults;
		const parsed = JSON.parse(raw);
		const normalized = normalizeConsoleDisplaySettings(parsed, themeOptions);
		const canonical = JSON.stringify(normalized);
		if (!isCanonicalConsoleDisplaySettings(parsed) || JSON.stringify(parsed) !== canonical) {
			try {
				window.localStorage.setItem(storageKey, canonical);
			} catch {
				// Parsed settings remain usable when migration cannot be persisted.
			}
		}
		return normalized;
	} catch {
		return defaults;
	}
}

export function saveConsoleDisplaySettings(
	settings: ConsoleDisplaySettings,
	storageKey = DEFAULT_CONSOLE_DISPLAY_SETTINGS_KEY,
	themeOptions: readonly ConsoleThemeOption[] = defaultConsoleThemeOptions,
) {
	if (typeof window === 'undefined') return;
	const normalized = normalizeConsoleDisplaySettings(settings, themeOptions);
	try {
		window.localStorage.setItem(storageKey, JSON.stringify(normalized));
	} catch {
		// Keep the current document reactive when storage is unavailable.
	}
	window.dispatchEvent(
		new CustomEvent<ConsoleDisplaySettingsEventDetail>(CONSOLE_DISPLAY_SETTINGS_EVENT, {
			detail: { storageKey, settings: normalized },
		}),
	);
}

export function applyConsoleDisplaySettings(
	settings: ConsoleDisplaySettings,
	themeOptions: readonly ConsoleThemeOption[] = defaultConsoleThemeOptions,
	root: HTMLElement | undefined = typeof document === 'undefined' ? undefined : document.documentElement,
): ResolvedConsoleTheme {
	const normalized = normalizeConsoleDisplaySettings(settings, themeOptions);
	const resolved = resolveConsoleTheme(normalized, themeOptions);
	if (!root) return resolved;

	root.dataset.theme = resolved.theme;
	root.dataset.themeMode = normalized.themeMode;
	root.dataset.themePreference = normalized.themeMode;
	root.dataset.lightTheme = normalized.lightTheme;
	root.dataset.darkTheme = normalized.darkTheme;
	root.dataset.colorMode = resolved.colorScheme;
	root.dataset.density = normalized.density;
	root.dataset.radius = normalized.radius;
	root.dataset.motionPreference = normalized.motion;
	root.dataset.motion = resolveConsoleMotion(normalized) ? 'reduced' : 'normal';
	root.classList.toggle('dark', resolved.colorScheme === 'dark');
	root.style.colorScheme = resolved.colorScheme;
	return resolved;
}

function getConsoleThemeDefaults(themeOptions: readonly ConsoleThemeOption[]) {
	assertConsoleThemeOptions(themeOptions);
	const light = themeOptions.find((theme) => theme.colorScheme === 'light');
	const dark = themeOptions.find((theme) => theme.colorScheme === 'dark');
	if (!light || !dark) throw new Error('Console theme option validation failed.');
	return { light, dark };
}

function normalizeThemeSlot(
	value: string | undefined,
	colorScheme: ConsoleThemeColorScheme,
	fallback: ConsoleThemeOption,
	themeOptions: readonly ConsoleThemeOption[],
) {
	if (!value) return fallback.value;
	const listedOption = themeOptions.find((theme) => theme.value === value);
	if (listedOption) return listedOption.colorScheme === colorScheme ? value : fallback.value;
	const builtInOption = defaultConsoleThemeOptions.find((theme) => theme.value === value);
	return builtInOption ? fallback.value : value;
}

function isCanonicalConsoleDisplaySettings(value: unknown): value is ConsoleDisplaySettings {
	if (!isRecord(value)) return false;
	return (
		(value.themeMode === 'system' || value.themeMode === 'light' || value.themeMode === 'dark') &&
		typeof value.lightTheme === 'string' &&
		typeof value.darkTheme === 'string' &&
		(value.density === 'comfortable' || value.density === 'compact') &&
		(value.radius === 'square' || value.radius === 'soft' || value.radius === 'rounded') &&
		(value.motion === 'system' || value.motion === 'reduced' || value.motion === 'full')
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
