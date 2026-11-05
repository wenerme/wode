import { createMemoryCliConfigStore } from 'common/context';
import { expect, it, vi } from 'vitest';
import { createCli } from './createCli';

it('sets and validates capability defaults using descriptors without network or credentials', async () => {
	const config = createMemoryCliConfigStore({ services: [
		{ name: 'web', type: 'duckduckgo' }, { name: 'reader', type: 'direct' },
	] });
	const fetch = vi.fn<typeof globalThis.fetch>(async () => { throw new Error('Must remain offline'); });
	const getEnv = vi.fn(() => { throw new Error('Must not resolve credentials'); });
	const cli = createCli({ config, fetch, getEnv });
	const stdout: string[] = [];
	const io = { signal: new AbortController().signal, stdout: (text: string) => stdout.push(text) };
	await cli.executeLine('service default set search web', io);
	await cli.executeLine('service default set fetch reader', io);
	await cli.executeLine('service default show --json', io);
	expect(JSON.parse(stdout.at(-1)!)).toEqual({ search: 'web', fetch: 'reader' });
	const result = await cli.executeLine('context check --strict --json', io);
	expect(result.exitCode).toBe(0);
	expect(JSON.parse(stdout.at(-1)!)).toMatchObject({ ok: true, issues: [] });
	await expect(cli.executeLine('service default set search reader', io)).rejects.toThrow('Service provider does not match');
	expect(fetch).not.toHaveBeenCalled();
	expect(getEnv).not.toHaveBeenCalled();
});

it('reports a default service that does not provide the requested capability', async () => {
	const cli = createCli({ config: createMemoryCliConfigStore({
		services: [{ name: 'reader', type: 'base' }], defaults: { search: 'reader' },
	}) });
	const stdout: string[] = [];
	const result = await cli.executeLine('service verify --json', {
		signal: new AbortController().signal, stdout: (text: string) => stdout.push(text),
	});
	expect(result.exitCode).toBe(1);
	expect(JSON.parse(stdout.at(-1)!)).toMatchObject({ ok: false, issues: [{ code: 'default-provider-mismatch' }] });
});
