import { chmod } from 'node:fs/promises';
import { build } from 'esbuild';

const target = process.argv[2] ?? 'cli';
const web = target !== 'cli';
await build({
	entryPoints: [target === 'cli' ? 'src/cli/main.ts' : target === 'web' ? 'src/web/index.ts' : `src/${target}.ts`],
	outfile: `dist/${target}.js`,
	bundle: true,
	platform: web ? 'browser' : 'node',
	format: 'esm',
	target: web ? 'es2022' : 'node24',
	legalComments: 'none',
	external: web ? [] : ['pg-native'],
	...(web
		? {}
		: {
				banner: {
					js: '#!/usr/bin/env node\nimport { createRequire as __createRequire } from "node:module";\nconst require = __createRequire(import.meta.url);',
				},
			}),
	logLevel: 'info',
});
if (!web) await chmod('dist/cli.js', 0o755);
