import { readFileSync } from 'node:fs';
import { createMemoryCliConfigStore, parseCliConfigLayer } from 'common/context';
import { expect, it, vi } from 'vitest';
import { parse } from 'yaml';
import { createCli } from '../createCli';

it('shows Feishu and Telegram from the local example and lists APIs without credentials', async () => {
	const config = parseCliConfigLayer(parse(readFileSync(new URL('../../examples/woctl.services.yaml', import.meta.url), 'utf8')), { kind: 'base' });
	const getEnv = vi.fn();
	const fetch = vi.fn();
	const cli = createCli({ config: createMemoryCliConfigStore(config), getEnv, fetch });
	const stdout: string[] = [];
	const io = { signal: new AbortController().signal, stdout: (text: string) => stdout.push(text) };
	await cli.executeLine('feishu --help', io);
	expect(stdout.join('\n')).toContain('api');
	await cli.executeLine('tg --help', io);
	expect(stdout.at(-1)).toContain('whoami');
	await cli.executeLine('feishu api list --api-service im --risk read --json', io);
	expect(JSON.parse(stdout.at(-1)!).items.length).toBeGreaterThan(0);
	expect(getEnv).not.toHaveBeenCalled();
	expect(fetch).not.toHaveBeenCalled();
});

it('keeps unconfigured commands in the static catalog while context help filters them', async () => {
	const cli = createCli({ config: createMemoryCliConfigStore({ services: [] }) });
	const names = (await cli.describe()).map((command) => command.name);
	expect(names).not.toContain('feishu');
	expect(names).not.toContain('telegram');
	const stdout: string[] = [];
	const io = { signal: new AbortController().signal, stdout: (text: string) => stdout.push(text) };
	await cli.executeLine('catalog --json', io);
	const catalogNames = JSON.parse(stdout.at(-1)!).commands.map((command: { name: string }) => command.name);
	expect(catalogNames).toContain('feishu');
	expect(catalogNames).toContain('telegram');
	await cli.executeLine('feishu --help', io);
	expect(stdout.at(-1)).toContain('No enabled feishu service is configured');
});

it('shows explicitly requested domain help without a connection, including aliases and child help', async () => {
	const getEnv = vi.fn();
	const fetch = vi.fn();
	const readText = vi.fn();
	const cli = createCli({ config: createMemoryCliConfigStore({ services: [] }), getEnv, fetch, readText });
	const stdout: string[] = [];
	const io = { signal: new AbortController().signal, stdout: (text: string) => stdout.push(text) };
	for (const command of ['tg', 'tg --help', 'telegram', 'tg whoami --help', 'tg send --help', 'feishu', 'feishu api call --help']) {
		await cli.executeLine(command, io);
		expect(stdout.at(-1)).toContain('No enabled');
		expect(stdout.at(-1)).toContain('woctl service add');
	}
	await cli.executeLine('tg --list-services --json', io);
	expect(JSON.parse(stdout.at(-1)!)).toEqual([]);
	for (const command of ['tg whoami', 'tg send --chat 1 --text @message.txt --yes', 'feishu chat list']) {
		await expect(cli.executeLine(command, io)).rejects.toThrow(/No enabled (telegram|feishu) service is configured/u);
	}
	expect(getEnv).not.toHaveBeenCalled();
	expect(fetch).not.toHaveBeenCalled();
	expect(readText).not.toHaveBeenCalled();
});
