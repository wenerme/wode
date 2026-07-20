import { dirname } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

function getAbsolutePath(value: string): any {
	return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const config: StorybookConfig = {
	// No matching indexer found for .stories.mdx
	// .mdx cause translate to import js
	// stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	staticDirs: ['../public', '../src/assets'],
	addons: [getAbsolutePath('@storybook/addon-links')],
	framework: {
		name: getAbsolutePath('@storybook/react-vite'),
		options: {},
	},
	docs: {},
	core: {
		disableTelemetry: true,
		disableWhatsNewNotifications: true,
		builder: {
			name: getAbsolutePath('@storybook/builder-vite'),
			options: {},
		},
	},
	// debug vite config
	viteFinal: (config) => {
		return {
			...config,
			server: {
				...config.server,
				proxy: {
					...config.server?.proxy,
					'/api/': {
						target: `http://127.0.0.1:${process.env.WEB_API_SERVER_PORT || '8055'}`,
						changeOrigin: true,
					},
				},
			},
		};
	},
};
export default config;
