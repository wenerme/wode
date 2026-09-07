import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceFixtureRoot = resolve(appRoot, 'scripts/fixtures/story-taxonomy-invalid');
const expectedFailures = [
	'agent/forbidden-helper.ts: agent Story source imports forbidden console source',
	'agent/noncanonical-registry-path.ts: agent Story source imports forbidden console source',
	'agent/forbidden-alias.ts: Story source must not use registry aliases: @components/agent-composer',
	'agent/relative-console-helper.ts: agent Story source imports forbidden console source',
	'agent/alias-console-helper.ts: agent Story source imports forbidden console source',
	'agent/alias-parent-console-helper.ts: agent Story source imports forbidden console source',
	'agent/alias-escape-registry.ts: agent Story source imports forbidden console source',
	'agent/hash-escape-registry.ts: agent Story source imports forbidden console source',
	'agent/root-escape-registry.ts: agent Story source imports forbidden console source',
	'agent/commented-import.ts: agent Story source imports forbidden console source',
	'agent/commented-dynamic-import.ts: agent Story source imports forbidden console source',
	'agent/type-import.ts: agent Story source imports forbidden console source',
	'agent/re-export.ts: agent Story source imports forbidden console source',
	'agent/import-equals.ts: agent Story source imports forbidden console source',
	'agent/computed-dynamic-import.ts: Story dynamic import must use a static string',
	'agent/template-dynamic-import.ts: agent Story source imports forbidden console source',
	'agent/cast-dynamic-import.ts: agent Story source imports forbidden console source',
];

const staticResult = runCheck(sourceFixtureRoot);
if (staticResult.status === 0 || expectedFailures.some((failure) => !staticResult.output.includes(failure))) {
	throw new Error(`Story structure fixture did not fail as expected:\n${staticResult.output}`);
}

const temporaryRoot = await mkdtemp(join(tmpdir(), 'wode-story-taxonomy-'));
const storiesRoot = join(temporaryRoot, 'stories');
try {
	await mkdir(join(storiesRoot, 'agent'), { recursive: true });
	await writeFile(
		join(storiesRoot, 'agent', 'fs-escape-registry.ts'),
		`import { ConsoleShell } from '/@fs/${appRoot}/src/console/console-shell';\n\nvoid ConsoleShell;\n`,
	);
	await writeFile(
		join(storiesRoot, 'agent', 'file-url-escape-registry.ts'),
		`import { ConsoleShell } from '${pathToFileURL(join(appRoot, 'src/console/console-shell')).href}';\n\nvoid ConsoleShell;\n`,
	);
	const fsResult = runCheck(storiesRoot);
	if (
		fsResult.status === 0 ||
		!fsResult.output.includes('agent/fs-escape-registry.ts: agent Story source imports forbidden console source') ||
		!fsResult.output.includes('agent/file-url-escape-registry.ts: agent Story source imports forbidden console source')
	)
		throw new Error(`Story structure fs fixture did not fail as expected:\n${fsResult.output}`);
} finally {
	await rm(temporaryRoot, { force: true, recursive: true });
}

console.log('Story structure fixture check passed.');

function runCheck(storiesRoot) {
	const result = spawnSync(process.execPath, ['scripts/check-story-structure.mjs'], {
		cwd: appRoot,
		env: { ...process.env, WODE_STORIES_ROOT: storiesRoot },
		encoding: 'utf8',
	});
	return { output: `${result.stdout}${result.stderr}`, status: result.status };
}
