#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const outfile = 'dist/index.mjs';

// Find node_modules paths for pnpm compatibility
const findNodeModulesPaths = (): string[] => {
	const paths: string[] = [];
	let dir = process.cwd();
	while (dir !== path.dirname(dir)) {
		const nodeModulesPath = path.join(dir, 'node_modules');
		if (fs.existsSync(nodeModulesPath)) {
			paths.push(nodeModulesPath);
		}
		dir = path.dirname(dir);
	}
	return paths;
};

const options: esbuild.BuildOptions = {
	entryPoints: ['src/index.ts'],
	bundle: true,
	logLevel: 'info',
	banner: {
		js: `// Bundled with esbuild
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
	// For pnpm strict mode compatibility
	nodePaths: findNodeModulesPaths(),
};

// Ensure dist directory exists
fs.mkdirSync('dist', { recursive: true });

console.log('Building API CLI...');

const result = await esbuild.build(options);

if (result.errors.length === 0) {
	// Ensure shebang is at the very start of the file
	let content = fs.readFileSync(outfile, 'utf-8');
	// Remove any existing shebangs (might be from source or banner)
	content = content.replace(/^#!.*\n/gm, '');
	// Add single shebang at the start
	fs.writeFileSync(outfile, `#!/usr/bin/env node\n${content}`);

	// Make the output file executable
	fs.chmodSync(outfile, 0o755);

	const stats = fs.statSync(outfile);
	const sizeKB = (stats.size / 1024).toFixed(1);

	console.log(`Build successful!`);
	console.log(`Output: ${outfile} (${sizeKB}KB)`);
	console.log(`Ready for npm publish and npx usage`);
} else {
	console.error('Build failed:', result.errors);
	process.exit(1);
}
