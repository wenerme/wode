import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Exercise real Just processes with inert tools. Never build, publish or start
// an application while testing shell argument boundaries and dispatch.
const root = resolve(import.meta.dirname, '..');
const fixture = mkdtempSync(join(tmpdir(), 'wode just recipes '));
const realFixture = realpathSync(fixture);
const bin = join(fixture, 'bin');
const log = join(fixture, 'commands.jsonl');
const nested = join(fixture, 'packages', 'example');
mkdirSync(bin);
mkdirSync(nested, { recursive: true });
mkdirSync(join(fixture, 'apps/server/src/apps/example-server'), { recursive: true });
mkdirSync(join(fixture, 'apps/console'), { recursive: true });
mkdirSync(join(fixture, 'apps/components'), { recursive: true });
const realNested = realpathSync(nested);
assert.equal(spawnSync('git', ['init', '-q'], { cwd: fixture }).status, 0);
writeFileSync(join(fixture, 'apps/server/src/apps/example-server/main.ts'), 'export {};\n');
writeFileSync(join(fixture, 'package.json'), '{"type":"module"}\n');
cpSync(join(root, 'just'), join(fixture, 'just'), { recursive: true });
cpSync(join(root, 'justfile'), join(fixture, 'justfile'));
for (const tool of ['pnpm', 'buf', 'docker', 'rsync']) {
	const toolName = JSON.stringify(tool);
	writeFileSync(
		join(bin, tool),
		`#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const tool = ${toolName};
const args = process.argv.slice(2);
fs.appendFileSync(process.env.TASK_LOG, JSON.stringify({ tool, args, cwd: process.cwd(), server: process.env.SERVER }) + '\\n');
if (tool === 'pnpm' && args.includes('tsx') && process.env.SERVER) {
  fs.mkdirSync(path.join(process.cwd(), 'dist/apps', process.env.SERVER), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), 'dist/apps', process.env.SERVER, 'main.mjs'), 'export {};\\n');
}
process.exit(Number(process.env.TASK_EXIT || 0));
`.replace("'\\\\n'", "'\\n'"),
		{ mode: 0o755 },
	);
}
const run = (args, cwd = nested, env = {}) => {
	writeFileSync(log, '');
	return spawnSync('just', args, {
		cwd,
		encoding: 'utf8',
		env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, TASK_LOG: log, ...env },
	});
};
const calls = () =>
	readFileSync(log, 'utf8')
		.trim()
		.split('\n')
		.filter(Boolean)
		.map((line) => JSON.parse(line));
const ok = (result) => assert.equal(result.status, 0, result.stderr);

try {
	ok(run([]));
	assert.deepEqual(calls(), [], 'bare just must show help, not perform a task');

	const literal = 'path with spaces; $(touch SHOULD_NOT_EXIST)';
	ok(run(['fmt', literal]));
	assert.deepEqual(calls()[0].args, ['exec', 'vp', 'fmt', literal, '!packages/common/src/protos/**']);
	assert.equal(calls()[0].cwd, realFixture, 'root recipes run at repository root');
	assert.equal(existsSync(join(fixture, 'SHOULD_NOT_EXIST')), false);

	ok(run(['build', '--filter=@example/package with spaces']));
	assert.equal(calls()[0].args.at(-1), '--filter=@example/package with spaces');

	ok(run(['buf-lint', '--path', 'proto/path with spaces']));
	assert.deepEqual(calls()[0].args, ['lint', '--path', 'proto/path with spaces']);

	ok(run(['server-dev', 'example-server', literal]));
	assert.equal(calls()[0].cwd, realpathSync(join(fixture, 'apps/server')));
	assert.deepEqual(calls()[0].args, [
		'node',
		'--loader',
		'ts-node/esm',
		'--watch',
		'src/apps/example-server/main.ts',
		literal,
	]);

	ok(run(['-f', join(fixture, 'just/server-entrypoints.just'), 'server-dev', 'example-server', literal], fixture));
	assert.deepEqual(calls()[0].args, [
		'node',
		'--loader',
		'ts-node/esm',
		'--watch',
		'src/apps/example-server/main.ts',
		literal,
	]);

	ok(run(['server-build', 'example-server']));
	assert.equal(calls().length, 2, 'selected-server build preserves the SWC prerequisite');
	assert.equal(calls()[1].server, 'example-server');
	assert.deepEqual(calls()[1].args, ['exec', 'tsx', 'src/scripts/bundle.esbuild.ts']);

	const badServer = run(['server-dev', 'x"; touch SHOULD_NOT_EXIST; #']);
	assert.notEqual(badServer.status, 0);
	assert.match(badServer.stderr, /Unknown server/);
	assert.match(badServer.stderr, /example-server/);
	assert.deepEqual(calls(), []);
	assert.equal(existsSync(join(fixture, 'apps/server/SHOULD_NOT_EXIST')), false);

	ok(run(['-f', join(fixture, 'just/apps/console.just'), 'dev'], join(fixture, 'apps/console'), { PORT: literal }));
	assert.deepEqual(calls()[0].args, ['exec', 'vp', 'dev', '--port', literal, '--host']);
	assert.equal(existsSync(join(fixture, 'apps/console/SHOULD_NOT_EXIST')), false);

	const failed = run(['components-registry-check'], nested, { TASK_EXIT: '17' });
	assert.equal(failed.status, 17, failed.stderr);

	const noImage = run(['server-deploy', 'example-server']);
	assert.notEqual(noImage.status, 0, 'missing Dockerfile must fail before build/push');
	assert.deepEqual(calls(), []);

	mkdirSync(join(fixture, 'apps/server/builds/example-server'), { recursive: true });
	writeFileSync(join(fixture, 'apps/server/builds/example-server/Dockerfile'), 'FROM scratch\n');
	ok(run(['server-image', 'example-server']));
	const imageCalls = calls();
	assert.deepEqual(imageCalls.at(-1).args, ['buildx', 'bake', '--load', 'example-server']);

	ok(run(['server-deploy', 'example-server']));
	const deployCalls = calls();
	assert.deepEqual(deployCalls.at(-1).args, ['buildx', 'bake', '--push', 'example-server']);

	ok(run(['-f', join(fixture, 'just/bake.just'), 'push', literal], nested));
	assert.deepEqual(calls()[0].args, ['buildx', 'bake', '--push', literal]);
	assert.equal(calls()[0].cwd, realNested, 'standalone Bake recipes preserve caller cwd');
	console.log('just root/server/console/bake contract checks passed');
} finally {
	rmSync(fixture, { recursive: true, force: true });
}
