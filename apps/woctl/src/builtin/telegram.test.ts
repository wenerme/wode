import { createMemoryCliConfigStore } from 'common/context';
import { describe, expect, it, vi } from 'vitest';
import { createCli } from '../createCli';

function setup(readOnly = true) {
	const bytes = new Uint8Array([0, 255, 1, 2]);
	const fetch = vi.fn(async (input: unknown) => {
		const path = new URL(String(input)).pathname;
		if (path.startsWith('/file/')) return new Response(bytes, { headers: { 'content-type': 'application/pdf' } });
		if (path.endsWith('/getUpdates')) return Response.json({ ok: true, result: [{ update_id: 42 }] });
		if (path.endsWith('/getFile')) return Response.json({ ok: true, result: { file_id: 'fixture-file', file_path: 'documents/example.pdf', file_size: 4 } });
		return Response.json({ ok: true, result: { id: 1, is_bot: true, first_name: 'Fixture', message_id: 2 } });
	});
	const getEnv = vi.fn(() => `123456789:${'x'.repeat(35)}`);
	const readText = vi.fn(async () => 'text from fixture');
	const readBytes = vi.fn(async () => bytes);
	const writeBytes = vi.fn(async () => undefined);
	const cli = createCli({
		config: createMemoryCliConfigStore({ services: [{ name: 'bot', type: 'telegram', readOnly, options: { botTokenEnv: 'TELEGRAM_TEST_TOKEN' } }] }),
		fetch: fetch as unknown as typeof globalThis.fetch, getEnv, readText, readBytes, writeBytes,
	});
	const stdout: string[] = [];
	const io = { signal: new AbortController().signal, stdout: (text: string) => stdout.push(text) };
	return { cli, fetch, getEnv, readText, readBytes, writeBytes, stdout, io, bytes };
}

describe('Telegram Bot built-in integration', () => {
	it('keeps telegram/tg names and identity/status aliases', async () => {
		const { cli, fetch, getEnv, stdout, io } = setup();
		await cli.executeLine('telegram --help', io);
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
		await cli.executeLine('tg whoami --json', io);
		expect(JSON.parse(stdout.at(-1)!)).toMatchObject({ ok: true, result: { is_bot: true } });
		await cli.executeLine('telegram status --json', io);
		expect(fetch).toHaveBeenCalledTimes(2);
		expect(fetch.mock.calls.map(([url]) => new URL(String(url)).pathname.split('/').at(-1))).toEqual(['getMe', 'getMe']);
	});

	it('can call typed reads and raw read methods through a read-only runtime', async () => {
		const { cli, fetch, io } = setup();
		await cli.executeLine('tg chat get @fixture_channel --json', io);
		await cli.executeLine('tg api getChat --params chat_id=@fixture_channel --json', io);
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('blocks readonly writes before file inputs or credentials, including updates', async () => {
		const { cli, fetch, getEnv, readText, readBytes, io } = setup();
		for (const command of [
			'tg send --chat 1 --text @message.txt --yes',
			'tg send-document --chat 1 --file @report.pdf --yes',
			'tg commands set --data @commands.json --yes',
			'tg webhook set https://example.com/telegram --secret-token @secret.txt --yes',
			'tg updates --offset 10 --yes',
			'tg api getUpdates --params offset=10 --yes',
		]) await expect(cli.executeLine(command, io)).rejects.toThrow('read-only');
		expect(readText).not.toHaveBeenCalled();
		expect(readBytes).not.toHaveBeenCalled();
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});

	it('requires confirmation on writable services before file inputs or credentials', async () => {
		const { cli, fetch, getEnv, readText, readBytes, io } = setup(false);
		for (const command of [
			'tg send --chat 1 --text @message.txt',
			'tg send-photo --chat 1 --file @photo.jpg',
			'tg commands set --data @commands.json',
			'tg api getUpdates',
		]) await expect(cli.executeLine(command, io)).rejects.toThrow('requires --yes');
		expect(readText).not.toHaveBeenCalled();
		expect(readBytes).not.toHaveBeenCalled();
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});

	it('uploads binary media through the wire contract and preserves JSON results', async () => {
		const { cli, fetch, readBytes, stdout, io, bytes } = setup(false);
		await cli.executeLine('tg send-document --chat 1 --file @report.pdf --yes --json', io);
		expect(readBytes).toHaveBeenCalledWith('@report.pdf', expect.objectContaining({ maxBytes: 20 * 1024 * 1024 }));
		const init = (fetch.mock.calls[0] as unknown as [unknown, RequestInit])[1];
		expect(init.body).toBeInstanceOf(FormData);
		const file = (init.body as FormData).get('document') as File;
		expect(file.name).toBe('report.pdf');
		expect(new Uint8Array(await file.arrayBuffer())).toEqual(bytes);
		expect(JSON.parse(stdout.at(-1)!)).toMatchObject({ ok: true, result: { message_id: 2 } });
	});

	it('downloads a file through native/wire projection and the host binary output', async () => {
		const { cli, writeBytes, stdout, io, bytes } = setup();
		await cli.executeLine('tg file info fixture-file --json', io);
		expect(JSON.parse(stdout.at(-1)!).result.file_path).toBe('documents/example.pdf');
		await cli.executeLine('tg file download documents/example.pdf --out report.pdf --json', io);
		expect(writeBytes).toHaveBeenCalledWith('report.pdf', bytes, expect.objectContaining({ signal: expect.any(AbortSignal) }));
		expect(JSON.parse(stdout.at(-1)!)).toMatchObject({ byteLength: 4, out: 'report.pdf' });
		expect(stdout.at(-1)).not.toContain('base64');
	});

	it('rejects invalid request parameters without reading the bot token', async () => {
		const { cli, fetch, getEnv, io } = setup(false);
		await expect(cli.executeLine('tg updates --limit 101 --yes', io)).rejects.toThrow();
		await expect(cli.executeLine('tg file download ../file --json', io)).rejects.toThrow();
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});
});
