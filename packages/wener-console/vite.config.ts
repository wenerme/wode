import process from 'node:process';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, lazyPlugins, loadEnv, type PluginOption } from 'vite-plus';

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
	const env = loadEnv(mode, process.cwd(), '');
	process.env = Object.assign(process.env, env);
	return defineConfig({
		plugins: lazyPlugins((): PluginOption[] => [
			//
			// { enforce: 'pre', ...mdx({}) },
			react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
			tailwindcss(),
		]),
		resolve: {
			alias: {
				'@': new URL('./src/', import.meta.url).pathname,
			},
		},
	});
};
