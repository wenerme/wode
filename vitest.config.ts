import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		workspace: ['apps/*', 'packages/*'],
	},
});
