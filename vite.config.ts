import { defineConfig } from 'vite-plus';

export default defineConfig({
	lint: {
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
		importOrderTypeScriptVersion: '5.4.2',
		sortTailwindcss: {
			functions: ['clsx', 'tw', 'cn'],
		},
		sortPackageJson: false,
		ignorePatterns: [],
	},
});
