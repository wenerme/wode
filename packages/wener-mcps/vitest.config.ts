import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default ({ mode }: { mode: string }) => {
	const env = loadEnv(mode, process.cwd(), '');
	process.env = Object.assign(process.env, env);
	return defineConfig({
		resolve: {
			alias: {
				'@': new URL('./src/', import.meta.url).pathname,
				'#': new URL('./src/', import.meta.url).pathname,
			},
		},
		test: {
			include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
			testTimeout: 30_000,
		},
	});
};
