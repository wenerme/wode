import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const expectedDir = join(appRoot, 'public', 'r');
const outputDir = await mkdtemp(join(tmpdir(), 'wener-components-registry-'));
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

try {
	const result = spawnSync(pnpm, ['exec', 'shadcn', 'build', '--output', outputDir], {
		cwd: appRoot,
		stdio: 'inherit',
	});
	if (result.status !== 0) process.exit(result.status ?? 1);

	const expectedFiles = await listJsonFiles(expectedDir);
	const actualFiles = await listJsonFiles(outputDir);
	const failures = [];

	if (!isDeepStrictEqual(expectedFiles, actualFiles)) {
		failures.push(`file set differs\nexpected: ${expectedFiles.join(', ')}\nactual:   ${actualFiles.join(', ')}`);
	}

	for (const file of expectedFiles.filter((name) => actualFiles.includes(name))) {
		const expected = JSON.parse(await readFile(join(expectedDir, file), 'utf8'));
		const actual = JSON.parse(await readFile(join(outputDir, file), 'utf8'));
		if (!isDeepStrictEqual(expected, actual)) failures.push(`${file} is stale`);
	}

	if (failures.length > 0) {
		console.error(`Registry check failed:\n- ${failures.join('\n- ')}`);
		console.error('Run: pnpm -C apps/components registry:build');
		process.exitCode = 1;
	} else {
		console.log(`Registry check passed (${expectedFiles.length} files).`);
	}
} finally {
	await rm(outputDir, { recursive: true, force: true });
}

async function listJsonFiles(directory) {
	return (await readdir(directory, { withFileTypes: true }))
		.filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
		.map((entry) => entry.name)
		.sort();
}
