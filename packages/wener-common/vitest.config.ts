import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';

export default defineConfig({
	plugins: [
		react({
			tsDecorators: true,
		}),
	],
	test: {
		include: ['src/**/*.test.ts', 'src/**/*.test-d.ts'],
		alias: {
			'@/': new URL('./src/', import.meta.url).pathname,
		},
	},
});
