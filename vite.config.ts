import { defineConfig } from 'vite-plus';

export default defineConfig({
	lint: {
		ignorePatterns: [
			'packages/common/src/poc/**',
			'packages/common/src/protos/**',
			'packages/wener-miniquery/src/**/parser.js',
			'packages/wener-client/src/**/schema/*.gen.ts',
			'**/*.gen.ts',
			'**/*_connect.ts',
			'**/*_pb.ts',
		],
		jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
		rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
	},
	fmt: {
		bracketSameLine: false,
		objectWrap: 'preserve',
		trailingComma: 'all',
		printWidth: 120,
		singleQuote: true,
		useTabs: true,
		jsxSingleQuote: true,
		importOrder: [
			'^node:',
			'<BUILTIN_MODULES>',
			'[.](polyfill|shim)$',
			'reflect-metadata',
			'^react(-dom)?',
			'<THIRD_PARTY_MODULES>',
			'^@/',
			'^[.][.]',
			'^[.][/]',
		],
		importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy', 'importAttributes'],
		importOrderTypeScriptVersion: '7.0.2',
		sortTailwindcss: {
			functions: ['clsx', 'tw', 'cn'],
		},
		sortPackageJson: false,
		ignorePatterns: [
			'packages/common/src/poc/**',
			'packages/common/src/protos/**',
			'packages/wener-client/libs/WeWorkFinanceSdk/**',
			'packages/wener-client/src/**/schema/*.gen.ts',
			'packages/wener-miniquery/src/**/parser.js',
			'**/*.gen.ts',
			'**/*_connect.ts',
			'**/*_pb.ts',
		],
	},
});
