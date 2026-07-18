import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type PluginOption } from 'vite-plus';

export default defineConfig({
	plugins: [react(), tailwindcss()] as PluginOption[],
	resolve: {
		alias: {
			'@': new URL('./src/', import.meta.url).pathname,
		},
	},
});
