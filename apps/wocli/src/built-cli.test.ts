import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { beforeAll, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

const exec = promisify(execFile);
const cwd = fileURLToPath(new URL('..', import.meta.url));
beforeAll(async () => {
	await exec(process.execPath, ['--import', 'tsx', 'scripts/build.ts', 'cli'], { cwd });
});

it('executes the actual Node build, preserves arguments and persists contexts', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'wocli-built-test-'));
	try {
		const base = ['dist/cli.js', '--config', join(directory, 'config.yaml')];
		const call = (...argv: string[]) =>
			exec(process.execPath, [...base, ...argv], { cwd, env: { ...process.env, WOCTL_CONTEXT: '' } });
		expect((await call('--help')).stdout).toContain('Usage: woctl');
		expect((await call('--version')).stdout.trim()).toBe('0.1.1');
		await writeFile(join(directory, 'config.yaml'), 'services:\n  - name: system\n    type: system\n');
		expect(JSON.parse((await call('system', 'echo', '00012', '--json')).stdout)).toEqual({ text: '00012' });
		await call('context', 'create', 'built');
		await call('context', 'use', 'built');
		expect(JSON.parse((await call('context', 'show', '--json')).stdout).name).toBe('built');
		await expect(call('unknown-command')).rejects.toMatchObject({ code: 2 });
		await expect(call('unknown-command')).rejects.toMatchObject({ stderr: expect.stringContaining('woctl:') });

		const arrayFile = join(directory, 'array-config.yaml');
		const fixture = 'services:\n  - name: system\n    type: system\n';
		await writeFile(arrayFile, fixture);
		const arrayCall = (...argv: string[]) =>
			exec(process.execPath, ['dist/cli.js', '--config', arrayFile, ...argv], {
				cwd,
				env: { ...process.env, WOCTL_CONTEXT: '' },
			});
		expect(JSON.parse((await arrayCall('system', 'echo', '00012', '--json')).stdout)).toEqual({ text: '00012' });
		await arrayCall('--help');
		expect(await readFile(arrayFile, 'utf8')).toBe(fixture);
		await arrayCall('service', 'add', 'extra', '--provider', 'system');
		expect(await readFile(arrayFile, 'utf8')).toBe(fixture);
		const saved = parseYaml(await readFile(join(directory, 'array-config.local.yaml'), 'utf8'));
		expect(saved.services).toEqual([expect.objectContaining({ name: 'extra', type: 'system' })]);
		await writeFile(arrayFile, 'services:\n  - name: off\n    type: system\n    disabled: true\n');
		await expect(arrayCall('service', 'call', 'off', 'echo')).rejects.toMatchObject({
			code: 2,
			stderr: expect.stringContaining('disabled'),
		});
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

it('refreshes context visibility and renders local prompt variables in the actual Node build', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'wocli-visibility-built-test-'));
	try {
		const visibilityFile = join(directory, 'visibility.yaml');
		const activeFile = join(directory, 'visibility.active.yaml');
		const visibilityBase = 'currentContext: local\nservices: []\nprompts:\n  greet:\n    template: Hello {{name}}\n';
		const visibilityActive = 'services:\n  - name: system\n    type: system\n';
		await writeFile(visibilityFile, visibilityBase);
		await writeFile(activeFile, visibilityActive);
		const visibleCall = (...argv: string[]) =>
			exec(process.execPath, ['dist/cli.js', '--config', visibilityFile, ...argv], {
				cwd,
				env: { ...process.env, HOME: directory, WOCTL_CONTEXT: '' },
			});
		expect((await visibleCall('--help')).stdout).not.toMatch(/^\s+system\s/mu);
		expect((await visibleCall('prompt', '--var', 'name=Node', 'render', 'greet')).stdout.trim()).toBe('Hello Node');
		await expect(visibleCall('system', 'info')).rejects.toMatchObject({ code: 2 });
		expect((await visibleCall('--context', 'active', '--help')).stdout).toMatch(/^\s+system\s/mu);
		expect(JSON.parse((await visibleCall('system', 'echo', 'active', '-cactive', '--json')).stdout)).toEqual({
			text: 'active',
		});
		expect(await readFile(visibilityFile, 'utf8')).toBe(visibilityBase);
		expect(await readFile(activeFile, 'utf8')).toBe(visibilityActive);
		await writeFile(activeFile, 'services: []\n');
		expect((await visibleCall('--context', 'active', '--help')).stdout).not.toMatch(/^\s+system\s/mu);
		await expect(visibleCall('system', 'info', '--context', 'active')).rejects.toMatchObject({ code: 2 });
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

it('runs offline diagnostics and log flags in the actual Node build', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'wocli-diagnostics-built-test-'));
	try {
		const config = join(directory, 'config.yaml');
		await writeFile(
			config,
			[
				'services:',
				'  - name: system',
				'    type: system',
				'  - name: future',
				'    type: future',
				'  - name: disabled',
				'    type: system',
				'    disabled: true',
				'defaults:',
				'  services:',
				'    system: future',
			].join('\n'),
		);
		const call = (...argv: string[]) =>
			exec(process.execPath, ['dist/cli.js', '--config', config, ...argv], {
				cwd,
				env: { ...process.env, WOCTL_CONTEXT: '' },
			});
		const info = await call('info', '--json', '--verbose');
		const value = JSON.parse(info.stdout);
		expect(value).toMatchObject({
			configPath: config,
			services: { configured: 3, enabled: 2, disabled: 1, unsupported: 1 },
		});
		expect(info.stderr).toMatch(/\[info\]/u);
		const check = (await call('service', 'verify', '--json').catch((error) => error)) as {
			code: number;
			stdout: string;
		};
		expect(check.code).toBe(1);
		expect(JSON.parse(check.stdout)).toMatchObject({ ok: false });
		const relaxed = (await call('service', 'verify', '--strict').catch((error) => error)) as { code: number };
		expect(relaxed.code).toBe(1);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});
