import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// ['packages/*/vitest.config.{e2e,unit}.ts'],
		projects: ['apps/*', 'packages/*'],
	},
});
