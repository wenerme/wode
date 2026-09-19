import assert from 'node:assert/strict';
import { chmodSync, cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = resolve(import.meta.dirname, '..');
const justfile = join(repoRoot, 'just', 'package.just');
const fixture = mkdtempSync(join(repoRoot, '.just-package-contract-'));
const bin = join(fixture, 'bin');
const logFile = join(fixture, 'pnpm.log');
const mockPnpm = join(bin, 'pnpm');

mkdirSync(join(fixture, 'src'), { recursive: true });
mkdirSync(join(fixture, 'lib'), { recursive: true });
mkdirSync(bin, { recursive: true });
cpSync(justfile, join(fixture, 'package.just'));
writeFileSync(join(fixture, 'src', 'index.ts'), 'export const value = 1;\n');
writeFileSync(join(fixture, 'src', 'asset.json'), '{}\n');
writeFileSync(join(fixture, 'src', 'asset.css'), ':root {}\n');
writeFileSync(
	mockPnpm,
	`#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
const log = process.env.MOCK_PNPM_LOG;
if (log) fs.appendFileSync(log, JSON.stringify({ cwd: process.cwd(), args }) + '\\n');
if (process.env.MOCK_FAIL_VP && args.includes('vp')) process.exit(17);
if (process.env.MOCK_FAIL_SWC && args.includes('swc')) process.exit(19);
if (args.includes('swc')) {
  const out = args[args.indexOf('-d') + 1];
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'index.js'), 'export const built = true;\\n');
}
if (args.includes('ts-add-js-extension')) {
  const out = args.find((arg) => arg.startsWith('--dir='))?.slice(6);
  if (out) fs.mkdirSync(out, { recursive: true });
}
`,
);
chmodSync(mockPnpm, 0o755);

const run = (args, extraEnv = {}) =>
	spawnSync('just', ['--justfile', join(fixture, 'package.just'), ...args], {
		cwd: fixture,
		encoding: 'utf8',
		env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, MOCK_PNPM_LOG: logFile, ...extraEnv },
	});

const readLog = () =>
	readFileSync(logFile, 'utf8')
		.trim()
		.split('\n')
		.filter(Boolean)
		.map((line) => JSON.parse(line));

try {
	const fmt = run(['package-fmt', '--check']);
	assert.equal(fmt.status, 0, fmt.stderr);
	const fmtInvocation = readLog().at(-1);
	assert.deepEqual(fmtInvocation.args, ['exec', 'vp', 'fmt', 'src', 'package.json', '--check']);
	assert.equal(fmtInvocation.cwd, fixture);

	writeFileSync(join(fixture, 'lib', 'index.js'), 'old build\n', { flag: 'w' });
	const build = run(['package-swc-build', 'lib', 'false', 'json-css', 'false']);
	assert.equal(build.status, 0, build.stderr);
	assert.equal(readFileSync(join(fixture, 'lib', 'index.js'), 'utf8'), 'export const built = true;\n');
	assert.equal(readFileSync(join(fixture, 'lib', 'asset.json'), 'utf8'), '{}\n');
	assert.equal(readFileSync(join(fixture, 'lib', 'asset.css'), 'utf8'), ':root {}\n');
	const swcInvocation = readLog().find((entry) => entry.args.includes('swc'));
	assert.equal(swcInvocation.cwd, fixture);
	assert.equal(swcInvocation.args[swcInvocation.args.indexOf('-d') + 1].startsWith('.just-package-staging/'), true);

	writeFileSync(join(fixture, 'lib', 'index.js'), 'keep after failure\n');
	const failedBuild = run(['package-swc-build', 'lib', 'false', 'none', 'false'], { MOCK_FAIL_SWC: '1' });
	assert.notEqual(failedBuild.status, 0);
	assert.equal(readFileSync(join(fixture, 'lib', 'index.js'), 'utf8'), 'keep after failure\n');

	const unsafeOutput = run(['package-swc-build', '../outside', 'false', 'none', 'false']);
	assert.notEqual(unsafeOutput.status, 0);
	assert.equal(readFileSync(join(fixture, 'lib', 'index.js'), 'utf8'), 'keep after failure\n');

	writeFileSync(join(fixture, 'package.json'), '{"name":"@contract/package"}\n');
	writeFileSync(join(fixture, 'vitest.config.ts'), 'export default {};\n');
	writeFileSync(join(fixture, 'src', 'contract.test.ts'), 'test();\n');
	const failedTest = run(['package-test'], { MOCK_FAIL_VP: '1' });
	assert.notEqual(failedTest.status, 0);
	const localTestInvocation = readLog().find((entry) => entry.args.includes('vp') && entry.args.includes('test'));
	assert.equal(localTestInvocation.cwd, fixture);
	assert.equal(localTestInvocation.args.includes('--config'), true);

	rmSync(join(fixture, 'vitest.config.ts'));
	const rootTest = run(['package-test']);
	assert.equal(rootTest.status, 0, rootTest.stderr);
	const rootTestInvocation = readLog().at(-1);
	assert.equal(rootTestInvocation.cwd, fixture);
	assert.deepEqual(rootTestInvocation.args.slice(0, 2), ['--dir', repoRoot]);
	assert.deepEqual(rootTestInvocation.args.slice(-2), ['--project', '@contract/package']);

	rmSync(join(fixture, 'src', 'contract.test.ts'));
	const noTest = run(['package-test']);
	assert.notEqual(noTest.status, 0);
	assert.match(noTest.stderr, /No test files found/);

	console.log('just package contract checks passed');
} finally {
	rmSync(fixture, { recursive: true, force: true });
}
