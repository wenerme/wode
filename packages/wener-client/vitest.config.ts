import process from 'node:process';
import { loadEnv } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
	// loadEnv will automatically load .env, .env.local, .env.[mode], .env.[mode].local
	const env = loadEnv(mode, process.cwd(), '');

	// Merge all env vars into process.env so they're available in tests
	Object.assign(process.env, env);

	return defineConfig({
		plugins: [],
		resolve: { alias: { '@': new URL('./src/', import.meta.url).pathname } },
		test: {
			exclude: [...configDefaults.exclude, '**/*.bun.test.ts'],
			server: { deps: {} },
			deps: { optimizer: { web: {} } },
		},
	});
};
