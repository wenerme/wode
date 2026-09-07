import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const generatedPath = resolve(import.meta.dirname, '../src/pages.gen.ts');
const before = await readFile(generatedPath, 'utf8');
const result = spawnSync('pnpm', ['exec', 'waku', 'router', 'typegen'], {
	cwd: resolve(import.meta.dirname, '..'),
	encoding: 'utf8',
	stdio: 'pipe',
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) process.exit(result.status ?? 1);

const after = await readFile(generatedPath, 'utf8');
if (after !== before) {
	console.error(
		'Waku router types were stale and have been regenerated. Review src/pages.gen.ts, then rerun router:check.',
	);
	process.exitCode = 1;
} else {
	console.log('Waku router type generation is current.');
}
