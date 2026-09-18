import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import {
	applyConsoleDisplaySettings,
	CONSOLE_DISPLAY_SETTINGS_EVENT,
	defaultConsoleDisplaySettings,
	getDefaultConsoleDisplaySettings,
	loadConsoleDisplaySettings,
	normalizeConsoleDisplaySettings,
	patchConsoleDisplaySettings,
	resolveConsoleMotion,
	resolveConsoleTheme,
	saveConsoleDisplaySettings,
} from './console-theme';
import {
	defaultConsoleThemeOptions,
	filterConsoleThemeOptions,
	getConsoleThemesByColorScheme,
} from './console-theme-catalog';

describe('console theme catalog', () => {
	it('contains every DaisyUI theme plus wener exactly once', () => {
		expect(defaultConsoleThemeOptions).toHaveLength(36);
		expect(new Set(defaultConsoleThemeOptions.map((theme) => theme.value)).size).toBe(36);
		expect(getConsoleThemesByColorScheme(defaultConsoleThemeOptions, 'light')).toHaveLength(22);
		expect(getConsoleThemesByColorScheme(defaultConsoleThemeOptions, 'dark')).toHaveLength(14);
	});

	it('filters themes by localized label, value, and description', () => {
		expect(filterConsoleThemeOptions(defaultConsoleThemeOptions, '  WENER ')).toHaveLength(1);
		expect(filterConsoleThemeOptions(defaultConsoleThemeOptions, '企业').map((theme) => theme.value)).toEqual([
			'corporate',
		]);
		expect(filterConsoleThemeOptions(defaultConsoleThemeOptions, '青蓝').map((theme) => theme.value)).toEqual([
			'wener',
		]);
		expect(filterConsoleThemeOptions(defaultConsoleThemeOptions, '')).toHaveLength(36);
	});
});

afterEach(() => vi.unstubAllGlobals());

const reducedThemeOptions = [
	{ value: 'corporate', label: 'Corporate', colorScheme: 'light' as const },
	{ value: 'business', label: 'Business', colorScheme: 'dark' as const },
];

describe('normalizeConsoleDisplaySettings', () => {
	it('migrates the legacy system theme to paired defaults', () => {
		expect(normalizeConsoleDisplaySettings({ theme: 'system', density: 'compact' })).toEqual({
			...defaultConsoleDisplaySettings,
			density: 'compact',
		});
	});

	it('migrates legacy light and dark themes into the matching slot', () => {
		expect(normalizeConsoleDisplaySettings({ theme: 'corporate' })).toMatchObject({
			themeMode: 'light',
			lightTheme: 'corporate',
		});
		expect(normalizeConsoleDisplaySettings({ theme: 'business' })).toMatchObject({
			themeMode: 'dark',
			darkTheme: 'business',
		});
	});

	it('preserves an unknown legacy custom theme as a light theme', () => {
		const migrated = normalizeConsoleDisplaySettings({ theme: 'tenant-brand' });
		expect(migrated).toMatchObject({
			themeMode: 'light',
			lightTheme: 'tenant-brand',
		});
		expect(resolveConsoleTheme(migrated, defaultConsoleThemeOptions, false)).toMatchObject({
			theme: 'tenant-brand',
			colorScheme: 'light',
			option: { description: '自定义主题' },
		});
	});

	it('derives paired defaults from a reduced catalog', () => {
		expect(getDefaultConsoleDisplaySettings(reducedThemeOptions)).toMatchObject({
			lightTheme: 'corporate',
			darkTheme: 'business',
		});
		expect(
			normalizeConsoleDisplaySettings(
				{ themeMode: 'system', lightTheme: 'wener', darkTheme: 'dark' },
				reducedThemeOptions,
			),
		).toMatchObject({ lightTheme: 'corporate', darkTheme: 'business' });
	});

	it('migrates legacy reduced motion booleans without changing their meaning', () => {
		expect(normalizeConsoleDisplaySettings({ reducedMotion: true }).motion).toBe('reduced');
		expect(normalizeConsoleDisplaySettings({ reducedMotion: false }).motion).toBe('full');
		expect(normalizeConsoleDisplaySettings({}).motion).toBe('system');
		expect(normalizeConsoleDisplaySettings({ motion: 'reduced' }).motion).toBe('reduced');
	});

	it('applies consecutive patches without dropping prior fields', () => {
		const first = patchConsoleDisplaySettings(defaultConsoleDisplaySettings, { darkTheme: 'business' });
		const second = patchConsoleDisplaySettings(first, { density: 'compact' });
		expect(second).toMatchObject({ darkTheme: 'business', density: 'compact' });
	});

	it('requires a unique light and dark pair', () => {
		expect(() =>
			normalizeConsoleDisplaySettings(undefined, [{ value: 'only-light', label: 'Only light', colorScheme: 'light' }]),
		).toThrow('at least one dark theme');
		expect(() =>
			normalizeConsoleDisplaySettings(undefined, [
				{ value: 'same', label: 'Light', colorScheme: 'light' },
				{ value: 'same', label: 'Dark', colorScheme: 'dark' },
			]),
		).toThrow('unique values');
	});
});

describe('console display settings browser boundaries', () => {
	it('migrates storage to the canonical motion shape and emits key-scoped updates', () => {
		const browser = installMockWindow({
			stored: {
				'legacy.preferences': JSON.stringify({ theme: 'corporate', reducedMotion: false }),
			},
		});
		const loaded = loadConsoleDisplaySettings('legacy.preferences');
		expect(loaded).toMatchObject({ themeMode: 'light', lightTheme: 'corporate', motion: 'full' });
		expect(JSON.parse(browser.values.get('legacy.preferences') ?? '{}')).toEqual(loaded);

		let eventDetail: unknown;
		browser.target.addEventListener(CONSOLE_DISPLAY_SETTINGS_EVENT, (event) => {
			eventDetail = (event as CustomEvent).detail;
		});
		saveConsoleDisplaySettings({ ...loaded, density: 'compact' }, 'next.preferences');
		expect(eventDetail).toMatchObject({
			storageKey: 'next.preferences',
			settings: { density: 'compact', motion: 'full' },
		});
	});

	it('keeps defaults usable when storage reads or writes fail', () => {
		const browser = installMockWindow();
		browser.throwOnGet = true;
		expect(loadConsoleDisplaySettings('broken.preferences')).toEqual(defaultConsoleDisplaySettings);
		browser.throwOnGet = false;
		browser.throwOnSet = true;
		expect(() => saveConsoleDisplaySettings(defaultConsoleDisplaySettings, 'broken.preferences')).not.toThrow();
	});

	it('applies resolved theme, density, radius, and system motion to a root', () => {
		installMockWindow({ dark: true, reducedMotion: true });
		const classes = new Map<string, boolean>();
		const root = {
			dataset: {} as Record<string, string>,
			classList: { toggle: (name: string, force?: boolean) => classes.set(name, Boolean(force)) },
			style: {} as Record<string, string>,
		} as unknown as HTMLElement;
		const resolved = applyConsoleDisplaySettings(
			{ ...defaultConsoleDisplaySettings, darkTheme: 'business', density: 'compact', radius: 'rounded' },
			defaultConsoleThemeOptions,
			root,
		);
		expect(resolved).toMatchObject({ theme: 'business', colorScheme: 'dark' });
		expect(root.dataset).toMatchObject({
			theme: 'business',
			density: 'compact',
			radius: 'rounded',
			motionPreference: 'system',
			motion: 'reduced',
		});
		expect(classes.get('dark')).toBe(true);
		expect(root.style.colorScheme).toBe('dark');
	});
});

describe('resolveConsoleMotion', () => {
	it('follows the system or an explicit preference', () => {
		expect(resolveConsoleMotion({ motion: 'system' }, true)).toBe(true);
		expect(resolveConsoleMotion({ motion: 'system' }, false)).toBe(false);
		expect(resolveConsoleMotion({ motion: 'reduced' }, false)).toBe(true);
		expect(resolveConsoleMotion({ motion: 'full' }, true)).toBe(false);
	});
});

type MockWindowOptions = {
	stored?: Record<string, string>;
	dark?: boolean;
	reducedMotion?: boolean;
};

function installMockWindow(options: MockWindowOptions = {}) {
	const target = new EventTarget();
	const values = new Map(Object.entries(options.stored ?? {}));
	const browser = {
		target,
		values,
		throwOnGet: false,
		throwOnSet: false,
	};
	const localStorage = {
		getItem(key: string) {
			if (browser.throwOnGet) throw new Error('storage read failed');
			return values.get(key) ?? null;
		},
		setItem(key: string, value: string) {
			if (browser.throwOnSet) throw new Error('storage write failed');
			values.set(key, value);
		},
	} as Storage;
	const windowMock = {
		localStorage,
		matchMedia(query: string) {
			return {
				matches: query.includes('color-scheme') ? Boolean(options.dark) : Boolean(options.reducedMotion),
			} as MediaQueryList;
		},
		addEventListener: target.addEventListener.bind(target),
		removeEventListener: target.removeEventListener.bind(target),
		dispatchEvent: target.dispatchEvent.bind(target),
	} as unknown as Window;
	vi.stubGlobal('window', windowMock);
	return browser;
}

describe('resolveConsoleTheme', () => {
	const settings = {
		...defaultConsoleDisplaySettings,
		themeMode: 'system' as const,
		lightTheme: 'corporate',
		darkTheme: 'dim',
	};

	it('uses the configured light and dark theme when the system changes', () => {
		expect(resolveConsoleTheme(settings, defaultConsoleThemeOptions, false)).toMatchObject({
			theme: 'corporate',
			colorScheme: 'light',
		});
		expect(resolveConsoleTheme(settings, defaultConsoleThemeOptions, true)).toMatchObject({
			theme: 'dim',
			colorScheme: 'dark',
		});
	});

	it('rejects a theme assigned to the wrong color scheme', () => {
		expect(
			resolveConsoleTheme({ ...settings, themeMode: 'dark', darkTheme: 'light' }, defaultConsoleThemeOptions, true),
		).toMatchObject({ theme: 'dark', colorScheme: 'dark' });
	});
});
