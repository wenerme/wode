import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react-swc';
import { loadEnv, type PluginOption } from 'vite';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
	const env = loadEnv(mode, process.cwd(), '');
	process.env = Object.assign(process.env, env);

	return defineConfig({
		plugins: [react()] as PluginOption[],
		resolve: {
			alias: {
				'@': new URL('./src/', import.meta.url).pathname,
			},
		},
		test: {
			projects: [
				// Unit tests
				{
					test: {
						name: 'unit',
						include: ['src/**/*.test.{ts,tsx}'],
						server: {
							deps: {
								inline: ['@wener/console'],
							},
						},
					},
				},
				// Storybook tests
				{
					plugins: [
						storybookTest({
							configDir: path.join(__dirname, '.storybook'),
							storybookScript: 'pnpm storybook --ci',
						}),
					],
					test: {
						name: 'storybook',
						browser: {
							enabled: true,
							headless: true,
							provider: 'playwright',
							instances: [{ browser: 'chromium' }],
						},
						setupFiles: ['.storybook/vitest.setup.ts'],
					},
				},
			],
		},
	});
};
