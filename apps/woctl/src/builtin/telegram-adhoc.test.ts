import { createMemoryCliConfigStore } from 'common/context';
import { describe, expect, it, vi } from 'vitest';
import { createCli } from '../createCli';

const token = `123456789:${'a'.repeat(35)}`;
const storedToken = `987654321:${'b'.repeat(35)}`;

function setup(initial: Parameters<typeof createMemoryCliConfigStore>[0] = {}, remote = false) {
	const config = createMemoryCliConfigStore(initial);
	const save = vi.spyOn(config, 'save');
	const fetch = vi.fn(async (_input: unknown, _init?: RequestInit) => Response.json({ ok: true, result: { id: 1, is_bot: true, message_id: 2 } }));
	const getEnv = vi.fn(() => storedToken);
	const readText = vi.fn(async () => 'file content');
	const getSchema = vi.fn(async () => ({ tools: { whoami: { inputSchema: {} } } }));
	const call = vi.fn(async () => ({ ok: true, result: { id: 3 } }));
	const cli = createCli({ config, fetch, getEnv, readText, ...(remote ? { runtime: { getSchema, call } } : {}) });
	const stdout: string[] = [];
	const stderr: string[] = [];
	const io = { signal: new AbortController().signal, stdout: (text: string) => stdout.push(text), stderr: (text: string) => stderr.push(text) };
	return { cli, config, save, fetch, getEnv, readText, getSchema, call, stdout, stderr, io };
}

describe('Telegram ad hoc connections', () => {
	it.each([
		['tg', '--token', token, 'whoami', '--json'],
		['telegram', 'whoami', '--token', token, '--json'],
		['tg', 'chat', 'get', '@fixture_channel', '--token', token, '--json'],
	])('uses an inline token before or after the command: %j', async (...argv) => {
		const test = setup();
		const original = await test.config.load();
		await test.cli.execute(argv, test.io);
		expect(test.fetch).toHaveBeenCalledOnce();
		expect(String(test.fetch.mock.calls[0]![0])).toContain(`/bot${token}/`);
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.save).not.toHaveBeenCalled();
		expect(await test.config.load()).toEqual(original);
		expect(JSON.parse(test.stdout.at(-1)!)).toMatchObject({ ok: true });
	});

	it('defaults the name to the canonical provider and selects the temporary connection automatically', async () => {
		const test = setup();
		await test.cli.execute(['tg', '--token', token, '--list-services', '--json'], test.io);
		expect(JSON.parse(test.stdout.at(-1)!)).toEqual([{ name: 'telegram', provider: 'telegram', readOnly: false, default: true, adHoc: true }]);
		await test.cli.execute(['tg', '--token', token, '--service', 'session-bot', '--list-services', '--json'], test.io);
		expect(JSON.parse(test.stdout.at(-1)!)[0].name).toBe('session-bot');
		await test.cli.execute(['tg', '--token', token, '--service', 'session-bot', 'whoami', '--json'], test.io);
		expect(test.fetch).toHaveBeenCalledOnce();
		expect(test.save).not.toHaveBeenCalled();
	});

	it('takes precedence over configured defaults without changing the configured instance', async () => {
		const test = setup({ services: [
			{ name: 'telegram', type: 'telegram', readOnly: true, options: { botTokenEnv: 'SAVED_TOKEN' } },
			{ name: 'other', type: 'telegram', options: { botTokenEnv: 'SAVED_TOKEN' } },
		], defaults: { telegram: 'other' } });
		const original = await test.config.load();
		await test.cli.execute(['tg', '--token', token, 'whoami', '--json'], test.io);
		expect(String(test.fetch.mock.calls[0]![0])).toContain(`/bot${token}/`);
		expect(test.getEnv).not.toHaveBeenCalled();
		await test.cli.execute(['tg', 'whoami', '--json'], test.io);
		expect(String(test.fetch.mock.calls[1]![0])).toContain(`/bot${storedToken}/`);
		expect(test.getEnv).toHaveBeenCalledExactlyOnceWith('SAVED_TOKEN');
		expect(await test.config.load()).toEqual(original);
		expect(test.save).not.toHaveBeenCalled();
	});

	it('selects a configured instance named after the type when no explicit default is set', async () => {
		const test = setup({ services: [
			{ name: 'other', type: 'telegram', options: { botTokenEnv: 'OTHER_TOKEN' } },
			{ name: 'telegram', type: 'telegram', options: { botTokenEnv: 'DEFAULT_TOKEN' } },
		] });
		await test.cli.executeLine('tg whoami --json', test.io);
		expect(test.getEnv).toHaveBeenCalledExactlyOnceWith('DEFAULT_TOKEN');
	});

	it('keeps write confirmation before input files and supports an explicit read-only connection', async () => {
		const test = setup();
		await expect(test.cli.execute(['tg', '--token', token, 'send', '--chat', '1', '--text', '@message.txt'], test.io)).rejects.toThrow('requires --yes');
		await expect(test.cli.execute(['tg', '--token', token, '--read-only', 'send', '--chat', '1', '--text', '@message.txt', '--yes'], test.io)).rejects.toThrow('read-only');
		expect(test.readText).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		await test.cli.execute(['tg', '--token', token, 'send', '--chat', '1', '--text', 'hello', '--yes', '--json'], test.io);
		expect(JSON.parse(String(test.fetch.mock.calls[0]![1]?.body))).toMatchObject({ chat_id: 1, text: 'hello' });
		expect(test.save).not.toHaveBeenCalled();
	});

	it('rejects invalid connection parameters without reading input, resolving stored credentials or fetching', async () => {
		const test = setup();
		for (const argv of [
			['tg', '--token', 'invalid-sensitive-token', 'send', '--chat', '1', '--text', '@message.txt', '--yes'],
			['tg', '--token', token, '--service', '../bad', 'whoami'],
			['tg', '--read-only', 'whoami'],
		]) await expect(test.cli.execute(argv, test.io)).rejects.toThrow();
		expect(test.readText).not.toHaveBeenCalled();
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
		expect(test.save).not.toHaveBeenCalled();
	});

	it('keeps inline credentials out of help, discovery, diagnostics and subsequent invocations', async () => {
		const test = setup();
		await test.cli.execute(['tg', '--token', token], test.io);
		expect(test.stdout.at(-1)).not.toContain('No enabled');
		await test.cli.execute(['tg', '--token', token, 'whoami', '--json', '--verbose'], test.io);
		await test.cli.execute(['tg', '--token', token, '--list-services', '--json'], test.io);
		expect(test.stdout.join('') + test.stderr.join('')).not.toContain(token);
		expect(JSON.stringify(test.cli.catalog())).not.toContain(token);
		expect(await test.cli.describe({ argv: ['tg', '--token', token] })).not.toEqual([]);
		await expect(test.cli.executeLine('tg whoami', test.io)).rejects.toThrow('No enabled telegram');
		expect((await test.config.load()).services).toEqual({});
	});

	it('uses the local provider for inline credentials even when the host supplies a remote runtime', async () => {
		const test = setup({}, true);
		await test.cli.execute(['tg', '--token', token, 'whoami', '--json'], test.io);
		expect(test.fetch).toHaveBeenCalledOnce();
		expect(test.getSchema).not.toHaveBeenCalled();
		expect(test.call).not.toHaveBeenCalled();
		expect(test.getEnv).not.toHaveBeenCalled();
	});
});
