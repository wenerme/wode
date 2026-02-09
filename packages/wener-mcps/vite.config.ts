import devServer, { defaultOptions } from '@hono/vite-dev-server';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		react(),
		devServer({
			entry: 'src/dev.server.ts',
			exclude: ['/', /[.](png|jpe?g|html|js|mjs)$/, ...defaultOptions.exclude],
		}),
	],
	resolve: {
		alias: {
			'@': new URL('./src/', import.meta.url).pathname,
			'#': new URL('./src/', import.meta.url).pathname,
		},
	},
	server: {
		port: 3036,
		// proxy: {
		// 	'/api': {
		// 		target: 'http://localhost:8036',
		// 		changeOrigin: true,
		// 	},
		// 	'/mcp': {
		// 		target: 'http://localhost:8036',
		// 		changeOrigin: true,
		// 	},
		// },
	},
});
