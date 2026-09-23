import type { Preview } from '@storybook/react-vite';
import { useLayoutEffect } from 'react';
import '../src/global.css';

const themes = [
	{ value: 'light', title: 'Light' },
	{ value: 'dark', title: 'Dark' },
] as const;

function ThemeSync({ theme }: { theme: string }) {
	useLayoutEffect(() => {
		document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
	}, [theme]);
	return null;
}

const preview: Preview = {
	globalTypes: {
		theme: {
			description: 'DaisyUI theme',
			toolbar: {
				icon: 'paintbrush',
				items: themes,
			},
		},
	},
	initialGlobals: {
		theme: 'light',
	},
	decorators: [
		(Story, context) => (
			<>
				<ThemeSync theme={String(context.globals.theme ?? 'light')} />
				<div className='bg-base-200 text-base-content min-h-screen p-6'>
					<Story />
				</div>
			</>
		),
	],
	parameters: {
		layout: 'centered',
		a11y: {
			test: 'error',
		},
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};

export default preview;
