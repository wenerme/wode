import { CliConfigError, createMemoryCliConfigStore } from 'common/context';
import { describe, expect, it, vi } from 'vitest';
import { VERSION } from './core';
import { createWocliCli } from './createWocliCli';
import { createWocliWebCli } from './web';

function output() {
	const stdout: string[] = [];
	const stderr: string[] = [];
	return {
		stdout,
		stderr,
		io: {
			signal: new AbortController().signal,
			stdout: (text: string) => stdout.push(text),
			stderr: (text: string) => stderr.push(text),
		},
	};
}

function emptyStore() {
	return createMemoryCliConfigStore({});
}

describe('basic diagnostics', () => {
	it('prints stable offline info for an empty configuration', async () => {
		const cli = createWocliWebCli({ config: emptyStore(), info: { runtime: 'test' } });
		const { io, stdout, stderr } = output();
		const result = await cli.execute(['info', '--json'], io);
		const value = JSON.parse(stdout.pop() ?? '');
		expect(result.exitCode).toBe(0);
		expect(value).toMatchObject({
			runtime: 'test',
			version: VERSION,
			context: 'local',
			services: { configured: 0, enabled: 0, disabled: 0, unsupported: 0 },
			ai: { providers: 0, models: 0, prompts: 0 },
			error: null,
		});
		expect(value).not.toHaveProperty('baseUrl');
		expect(stderr).toEqual([]);
	});

	it('checks enabled, disabled and unsupported services plus invalid defaults without side effects', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>();
		const getEnv = vi.fn(() => {
			throw new Error('diagnostics must not resolve secrets');
		});
		const readText = vi.fn(async () => {
			throw new Error('diagnostics must not read files');
		});
		const config = createMemoryCliConfigStore({
			services: [
				{ name: 'system', type: 'system' },
				{ name: 'future', type: 'future' },
				{ name: 'off', type: 'system', disabled: true },
			],
			defaults: { system: 'future', missing: 'absent' },
		});
		const cli = createWocliWebCli({ config, fetch, getEnv, readText });
		const { io, stdout } = output();
		const result = await cli.executeLine('context check --json', io);
		const value = JSON.parse(stdout.pop() ?? '');
		expect(result.exitCode).toBe(1);
		expect(value.services).toEqual(
			expect.arrayContaining([
				{ name: 'system', provider: 'system', status: 'enabled' },
				{ name: 'future', provider: 'future', status: 'unsupported' },
				{ name: 'off', provider: 'system', status: 'disabled' },
			]),
		);
		expect(value.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: 'default-provider-mismatch', severity: 'error', service: 'future' }),
				expect.objectContaining({ code: 'missing-default', severity: 'error', service: 'absent' }),
			]),
		);
		expect(fetch).not.toHaveBeenCalled();
		expect(getEnv).not.toHaveBeenCalled();
		expect(readText).not.toHaveBeenCalled();
		const verify = await cli.executeLine('service verify --json', io);
		expect(verify.exitCode).toBe(1);
		const checked = JSON.parse(stdout.pop() ?? '');
		expect(checked.services).toHaveLength(3);
		const alias = await cli.executeLine('service check --json', io);
		expect(alias.exitCode).toBe(1);
		expect(JSON.parse(stdout.pop() ?? '')).toEqual(checked);
	});

	it('returns success for non-strict unsupported warnings and failure in strict mode', async () => {
		const cli = createWocliWebCli({
			config: createMemoryCliConfigStore({ services: [{ name: 'future', type: 'future' }] }),
		});
		const { io, stdout } = output();
		const relaxed = await cli.executeLine('ctx check --json', io);
		expect(relaxed.exitCode).toBe(0);
		expect(JSON.parse(stdout.pop() ?? '')).toMatchObject({ ok: true, issues: [{ code: 'unsupported-provider' }] });
		const strict = await cli.executeLine('context check --strict --json', io);
		expect(strict.exitCode).toBe(1);
		expect(JSON.parse(stdout.pop() ?? '')).toMatchObject({ ok: false, issues: [{ severity: 'warning' }] });
	});

	it('uses flag over verbose and env log levels, writing diagnostics only to stderr', async () => {
		const cli = createWocliWebCli({ config: emptyStore(), env: { WOCLI_LOG_LEVEL: 'error' } });
		const first = output();
		await cli.executeLine('--help', first.io);
		expect(first.stdout.join('\n')).toContain('info');
		expect(first.stderr).toEqual([]);
		const verbose = output();
		await cli.executeLine('--verbose --help', verbose.io);
		expect(verbose.stderr.join('\n')).toMatch(/\[info\]|\[debug\]/u);
		const quiet = output();
		await cli.executeLine('--log-level error --help', quiet.io);
		expect(quiet.stderr).toEqual([]);
		await expect(cli.executeLine('--log-level nope --help', quiet.io)).rejects.toThrow('Invalid --log-level');
		const version = output();
		await cli.executeLine('-v', version.io);
		expect(version.stdout.join('')).toContain(VERSION);
	});

	it('keeps info available in sanitized configuration recovery mode', async () => {
		const config = {
			load: vi.fn(async () => {
				throw new CliConfigError('Invalid YAML: apiKey: fixture-secret\nforged: true');
			}),
			save: vi.fn(),
		};
		const cli = createWocliCli({
			config,
			info: { runtime: 'node', node: 'fixture-node', platform: 'fixture-platform', configPath: '/tmp/woctl.yaml' },
		});
		const { io, stdout, stderr } = output();
		const result = await cli.executeLine('info --json', io);
		const value = JSON.parse(stdout.pop() ?? '');
		expect(result.exitCode).toBe(0);
		expect(value).toMatchObject({ runtime: 'node', node: 'fixture-node', configPath: '/tmp/woctl.yaml' });
		expect(value.error).toBe('Configuration unavailable');
		expect(stdout.join('\n')).not.toContain('fixture-secret');
		expect(stderr).toEqual([]);
		const verbose = output();
		await cli.executeLine('info --verbose --json', verbose.io);
		expect(verbose.stderr.join('\n')).not.toContain('fixture-secret');
		expect(verbose.stderr.join('\n')).toContain('context=<unavailable>');
		await expect(cli.executeLine('service verify --json', io)).rejects.toBeInstanceOf(CliConfigError);
	});

	it('reports prototype-named missing defaults without treating inherited properties as services', async () => {
		const cli = createWocliWebCli({
			config: createMemoryCliConfigStore({ defaults: { constructor: 'constructor', toString: 'toString' } }),
		});
		const { io, stdout } = output();
		const result = await cli.executeLine('context check --json', io);
		const value = JSON.parse(stdout.pop() ?? '');
		expect(result.exitCode).toBe(1);
		expect(value.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: 'missing-default', service: 'constructor' }),
				expect.objectContaining({ code: 'missing-default', service: 'toString' }),
			]),
		);
	});
});
