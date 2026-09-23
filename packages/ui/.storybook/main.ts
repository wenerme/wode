import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import { mergeConfig } from 'vite';

function packagePath(packageName: string) {
	return dirname(fileURLToPath(import.meta.resolve(`${packageName}/package.json`)));
}

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
	addons: [packagePath('@storybook/addon-a11y'), packagePath('@storybook/addon-docs')],
	framework: {
		name: packagePath('@storybook/react-vite'),
		options: {},
	},
	typescript: {
		reactDocgen: 'react-docgen',
	},
	core: {
		disableTelemetry: true,
		disableWhatsNewNotifications: true,
	},
	features: {
		experimentalReview: true,
	},
	async viteFinal(currentConfig) {
		return mergeConfig(currentConfig, {
			plugins: [tailwindcss()],
			css: {
				lightningcss: {
					nonStandard: { deepSelectorCombinator: true },
				},
			},
		});
	},
};

export default config;
