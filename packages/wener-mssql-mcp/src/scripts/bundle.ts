#!/usr/bin/env node
import fs from 'node:fs';
import * as esbuild from 'esbuild';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const outfile = 'dist/main.mjs';

const options: esbuild.BuildOptions = {
	entryPoints: ['src/main.ts'],
	bundle: true,
	logLevel: 'info',
	banner: {
		js: `#!/usr/bin/env node
// Bundled with esbuild
// ${pkg.name}@${pkg.version}

var require,__filename,__dirname;
{
  const {createRequire} = await import('node:module');
  require ||= createRequire(import.meta.url);
}
{
  const {fileURLToPath} = await import('node:url');
  const {dirname} = await import('node:path');
  __filename ||= fileURLToPath(import.meta.url);
  __dirname ||= dirname(__filename)
};
`,
	},
	define: {
		NODE_ENV: JSON.stringify('production'),
		__DEV__: JSON.stringify(false),
		'process.env.NODE_ENV': JSON.stringify('production'),
	},
	keepNames: true,
	treeShaking: true,
	minifySyntax: true,
	outfile,
	format: 'esm',
	platform: 'node',
	charset: 'utf8',
	target: 'node24',
	sourcemap: false,
	legalComments: 'none',
	// Bundle everything since we want a single executable
	external: [],
};

// Ensure dist directory exists
fs.mkdirSync('dist', { recursive: true });

console.log('Building MSSQL MCP server...');

const result = await esbuild.build(options);

if (result.errors.length === 0) {
	// Make the output file executable
	fs.chmodSync(outfile, 0o755);

	const stats = fs.statSync(outfile);
	const sizeMB = (stats.size / 1024 / 1024).toFixed(1);

	console.log(`✅ Build successful!`);
	console.log(`📦 Output: ${outfile} (${sizeMB}MB)`);
	console.log(`🚀 Ready for npm publish and npx usage`);
} else {
	console.error('❌ Build failed:', result.errors);
	process.exit(1);
}
