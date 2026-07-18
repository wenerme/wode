import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type PluginOption } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';
import type { TestProjectConfiguration } from 'vite-plus/test/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

type StorybookProjectOptions = {
	initialGlobals: Record<string, unknown>;
	name: string;
};

function storybookProject({ initialGlobals, name }: StorybookProjectOptions): TestProjectConfiguration {
	return {
		extends: true,
		plugins: [
			storybookTest({
				configDir: path.join(dirname, '.storybook'),
				initialGlobals,
				storybookScript: 'pnpm storybook',
			}),
		] as PluginOption[],
		test: {
			name,
			browser: {
				enabled: true,
				provider: playwright({}),
				headless: true,
				instances: [{ browser: 'chromium' as const }],
			},
		},
	};
}

export default defineConfig({
	plugins: [react(), tailwindcss()] as PluginOption[],
	resolve: {
		alias: {
			'@': new URL('./src/', import.meta.url).pathname,
		},
	},
	test: {
		projects: [
			storybookProject({
				name: 'storybook-light-mobile',
				initialGlobals: {
					theme: 'wener',
					density: 'comfortable',
					viewport: { value: 'mobile1', isRotated: false },
				},
			}),
			storybookProject({
				name: 'storybook-dark-desktop',
				initialGlobals: {
					theme: 'night',
					density: 'compact',
					viewport: { value: 'reset', isRotated: false },
				},
			}),
		],
	},
});
