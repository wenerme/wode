import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
import { loadEnv } from 'vite';
import { createLiveOpenAIConnectionStoryDefinition } from '../src/stories/agent/agent-ai-sdk-story-environment.ts';

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function getAbsolutePath(value: string): string {
	return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(ts|tsx)'],
	staticDirs: ['../public'],
	addons: [
		getAbsolutePath('@storybook/addon-links'),
		getAbsolutePath('@storybook/addon-docs'),
		getAbsolutePath('@storybook/addon-a11y'),
		getAbsolutePath('@storybook/addon-vitest'),
		{
			name: getAbsolutePath('@storybook/addon-mcp'),
			options: {
				toolsets: {
					dev: true,
					docs: true,
					test: true,
				},
			},
		},
	],
	framework: {
		name: getAbsolutePath('@storybook/react-vite'),
		options: {},
	},
	docs: {},
	core: {
		disableTelemetry: true,
		disableWhatsNewNotifications: true,
	},
	features: {
		changeDetection: true,
		componentsManifest: true,
		experimentalDocgenServer: true,
		experimentalReview: true,
	},
	viteFinal(viteConfig, { configType }) {
		const development = configType === 'DEVELOPMENT';
		const mode = viteConfig.mode ?? (development ? 'development' : 'production');
		const environment = development ? loadEnv(mode, appRoot, '') : {};
		return {
			...viteConfig,
			define: {
				...viteConfig.define,
				__WODE_STORYBOOK_OPENAI_CONNECTION__: createLiveOpenAIConnectionStoryDefinition(
					{
						apiKey: environment.OPENAI_API_KEY,
						baseUrl: environment.OPENAI_BASE_URL,
						model: environment.OPENAI_MODEL,
					},
					development,
				),
			},
		};
	},
};

export default config;
