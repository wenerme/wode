import { defineConfig } from 'vite-plus';

// Keep the existing offline CI baseline explicit. The general workspace
// config also discovers service-dependent and browser tests.
export default defineConfig({
	test: {
		include: [
			'scripts/run-ci-tests.test.ts',
			'packages/wener-utils/src/langs/getObjectId.test.ts',
			'packages/wener-server/src/entity/defineEntity.test.ts',
			'packages/wener-server/src/entity/defineEntitySchemaClass.test.ts',
			'packages/wener-common/src/fs/server/dbfs.test.ts',
		],
	},
});
