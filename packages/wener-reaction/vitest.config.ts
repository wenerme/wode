import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		setupFiles: ['./vitest.setup.ts'],
		environment: 'jsdom', // or 'happy-dom'
	},
});
