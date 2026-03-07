import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, type PluginOption } from 'vite';

export default defineConfig({
	plugins: [react(), tailwindcss()] as PluginOption[],
	resolve: {
		alias: {
			'@': new URL('./src/', import.meta.url).pathname,
		},
	},
});
