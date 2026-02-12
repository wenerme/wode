#!/usr/bin/env node
import fs from 'node:fs';
import * as esbuild from 'esbuild';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

const banner = `// Bundled with esbuild
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
`;

const commonOptions: esbuild.BuildOptions = {
	bundle: true,
	logLevel: 'info',
	banner: { js: banner },
	define: {
		NODE_ENV: JSON.stringify('production'),
		__DEV__: JSON.stringify(false),
		'process.env.NODE_ENV': JSON.stringify('production'),
	},
	keepNames: true,
	treeShaking: true,
	minifySyntax: true,
	format: 'esm',
	platform: 'node',
	charset: 'utf8',
	target: 'node18',
	sourcemap: false,
	legalComments: 'none',
	// External native modules
	external: [
		'better-sqlite3',
		'bun:sqlite',
		'kysely-bun-sqlite',
		'oracledb',
		'mariadb/callback',
		'mysql',
		'@nestjs/websockets',
		'@nestjs/microservices',
		'@nestjs/platform-express',
		'@larksuiteoapi/node-sdk',
	],
};

// Ensure dist directory exists
fs.mkdirSync('dist', { recursive: true });

console.log('Building MCPS...');

// Build library entry (index.ts)
const libResult = await esbuild.build({
	...commonOptions,
	entryPoints: ['src/index.ts'],
	outfile: 'dist/index.mjs',
});

// Build CLI entry (mcps-cli.ts)
const cliResult = await esbuild.build({
	...commonOptions,
	entryPoints: ['src/mcps-cli.ts'],
	outfile: 'dist/mcps-cli.mjs',
});

if (libResult.errors.length === 0 && cliResult.errors.length === 0) {
	// Process CLI output - add shebang
	const cliOutfile = 'dist/mcps-cli.mjs';
	let content = fs.readFileSync(cliOutfile, 'utf-8');
	content = content.replace(/^#!.*\n/gm, '');
	fs.writeFileSync(cliOutfile, `#!/usr/bin/env node\n${content}`);
	fs.chmodSync(cliOutfile, 0o755);

	const libStats = fs.statSync('dist/index.mjs');
	const cliStats = fs.statSync(cliOutfile);

	console.log(`✅ Build successful!`);
	console.log(`📦 Library: dist/index.mjs (${(libStats.size / 1024).toFixed(1)}KB)`);
	console.log(`📦 CLI: ${cliOutfile} (${(cliStats.size / 1024).toFixed(1)}KB)`);
	console.log(`🚀 Ready for npm publish and npx usage`);
} else {
	console.error('❌ Build failed:', [...libResult.errors, ...cliResult.errors]);
	process.exit(1);
}
