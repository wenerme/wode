import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type PluginOption } from 'vite';
import { playwright } from '@vitest/browser-playwright';
import type { TestProjectConfiguration } from 'vitest/config';
import { registryAliases } from './vite-registry-aliases.ts';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const playwrightChannel = process.env.STORYBOOK_PLAYWRIGHT_CHANNEL;

type StorybookProjectOptions = {
	initialGlobals: Record<string, unknown>;
	name?: string;
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
			...(name ? { name } : {}),
			testTimeout: 30_000,
			browser: {
				enabled: true,
				provider: playwright(playwrightChannel ? { launchOptions: { channel: playwrightChannel } } : {}),
				headless: true,
				instances: [{ browser: 'chromium' as const }],
			},
		},
	};
}

export default defineConfig({
	plugins: [react(), tailwindcss()] as PluginOption[],
	resolve: {
		alias: registryAliases,
	},
	test: {
		projects: process.env.STORYBOOK_CONFIG_DIR
			? [
					storybookProject({
						initialGlobals: {
							theme: 'wener',
							density: 'comfortable',
							viewport: { value: 'reset', isRotated: false },
						},
					}),
				]
			: [
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
