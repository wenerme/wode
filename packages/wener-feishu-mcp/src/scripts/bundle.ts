import { resolve } from 'path';
import { build } from 'esbuild';

async function bundle() {
	const result = await build({
		entryPoints: [resolve('src/main.ts')],
		outfile: resolve('dist/main.mjs'),
		bundle: true,
		minify: true,
		platform: 'node',
		target: 'node18',
		format: 'esm',
		external: [
			// Node built-ins
			'fs',
			'path',
			'url',
			'util',
			'events',
			'stream',
			'crypto',
			'http',
			'https',
			'os',
		],
		define: {
			'process.env.NODE_ENV': '"production"',
		},
		mainFields: ['module', 'main'],
		resolveExtensions: ['.ts', '.js', '.mjs'],
	});

	if (result.errors.length > 0) {
		console.error('Build errors:', result.errors);
		process.exit(1);
	}

	if (result.warnings.length > 0) {
		console.warn('Build warnings:', result.warnings);
	}

	console.log('Bundle created successfully: dist/main.mjs');
}

bundle().catch((error) => {
	console.error('Bundle failed:', error);
	process.exit(1);
});
