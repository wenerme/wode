import process from 'node:process';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv, type PluginOption } from 'vite';

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
	const env = loadEnv(mode, process.cwd(), '');
	process.env = Object.assign(process.env, env);

	return defineConfig({
		plugins: [react(), tailwindcss()] as PluginOption[],
		server: {
			proxy: {
				'/api/': {
					target: `http://127.0.0.1:${process.env.WEB_API_SERVER_PORT || '3001'}`,
					changeOrigin: true,
				},
				'/graphql': {
					target: `http://127.0.0.1:${process.env.WEB_API_SERVER_PORT || '3001'}`,
					changeOrigin: true,
				},
			},
		},
		resolve: {
			alias: {
				'@': new URL('./src/', import.meta.url).pathname,
			},
		},
		build: {
			sourcemap: false,
			rollupOptions: {
				onwarn(warning, defaultHandler) {
					// https://github.com/vitejs/vite/issues/15012
					if (warning.code === 'SOURCEMAP_ERROR') {
						return;
					}
					defaultHandler(warning);
				},
			},
		},
	});
};
