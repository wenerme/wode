import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		setupFiles: ['./vitest.setup.ts'],
		environment: 'jsdom', // or 'happy-dom'
	},
});
