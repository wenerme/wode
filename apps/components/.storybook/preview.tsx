import type { Preview } from '@storybook/react-vite';
import { useLayoutEffect } from 'react';
import {
	applyConsoleDisplaySettings,
	defaultConsoleDisplaySettings,
} from '../registry/default/blocks/console-preferences/console-theme';
import { defaultConsoleThemeOptions } from '../registry/default/blocks/console-preferences/console-theme-catalog';
import '#/styles.css';

type ThemeSyncProps = {
	enabled: boolean;
	theme: string;
	density: 'comfortable' | 'compact';
};

function ThemeSync({ enabled, theme, density }: ThemeSyncProps) {
	useLayoutEffect(() => {
		if (!enabled) return;
		const option = defaultConsoleThemeOptions.find((item) => item.value === theme);
		applyConsoleDisplaySettings({
			...defaultConsoleDisplaySettings,
			themeMode: theme === 'system' ? 'system' : (option?.colorScheme ?? 'light'),
			lightTheme: option?.colorScheme === 'light' ? option.value : defaultConsoleDisplaySettings.lightTheme,
			darkTheme: option?.colorScheme === 'dark' ? option.value : defaultConsoleDisplaySettings.darkTheme,
			density,
		});
	}, [density, enabled, theme]);
	return null;
}

const themeToolbarItems = [
	{ value: 'system', title: 'Follow system' },
	...defaultConsoleThemeOptions.map((theme) => ({ value: theme.value, title: theme.label })),
];

const preview: Preview = {
	globalTypes: {
		theme: {
			description: 'DaisyUI theme',
			toolbar: {
				icon: 'paintbrush',
				items: themeToolbarItems,
			},
		},
		density: {
			description: 'Console information density',
			toolbar: {
				icon: 'component',
				items: [
					{ value: 'comfortable', title: 'Comfortable' },
					{ value: 'compact', title: 'Compact' },
				],
			},
		},
	},
	initialGlobals: {
		theme: 'wener',
		density: 'comfortable',
	},
	decorators: [
		(Story, context) => (
			<>
				<ThemeSync
					enabled={context.parameters.consoleThemeOwner !== 'story'}
					theme={String(context.globals.theme ?? 'wener')}
					density={context.globals.density === 'compact' ? 'compact' : 'comfortable'}
				/>
				<div className='bg-base-200 text-base-content min-h-screen'>
					<Story />
				</div>
			</>
		),
	],
	parameters: {
		layout: 'fullscreen',
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		options: {
			storySort: {
				order: ['Overview', 'Console', ['Shell', 'Data View', 'Window & Frame', 'Preferences', 'Integrated'], 'Legacy'],
			},
		},
	},
};

export default preview;
