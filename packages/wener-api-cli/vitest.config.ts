import { defineConfig } from 'vite-plus';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['tests/**/*.test.ts'],
	},
});
