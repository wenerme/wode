import { describe, expect, it, vi } from 'vitest';
import type { ServiceCliInputContext } from '../../cli/ServiceCliDefinition';
import type { ITelegramService } from '../ITelegramService';
import { TelegramCliDefinition } from './index';

const operation = (name: string, group?: string) => TelegramCliDefinition.commands.find((item) => item.name === name && item.group === group)!;
function context(options: ServiceCliInputContext['options'] = {}, args: string[] = []) {
	return { args, options, readText: vi.fn(async (text: string) => text), readBytes: vi.fn(async () => new Uint8Array([1, 2, 3])), writeBytes: vi.fn(async () => undefined) };
}

describe('Telegram Bot CLI common operations', () => {
	it.each([
		['send', undefined, { chat: '1', text: '@message.txt' }],
		['edit', 'message', { chat: '1', message: '2', text: '@message.txt' }],
		['send-photo', undefined, { chat: '1', file: '@photo.jpg' }],
		['send-document', undefined, { chat: '1', file: '@doc.pdf' }],
		['set', 'commands', { data: '@commands.json' }],
		['set', 'webhook', { 'secret-token': '@secret.txt' }],
	] as const)('%s checks confirmation before input ports', async (name, group, options) => {
		const ctx = context(options, name === 'set' && group === 'webhook' ? ['https://example.com/webhook'] : []);
		await expect(Promise.resolve().then(() => operation(name, group).prepare(ctx))).rejects.toThrow('requires --yes');
		expect(ctx.readText).not.toHaveBeenCalled();
		expect(ctx.readBytes).not.toHaveBeenCalled();
	});

	it('marks every typed write command for host preflight before input', () => {
		for (const name of ['send', 'send-photo', 'send-document', 'updates']) expect(operation(name).mutating).toBe(true);
		for (const name of ['edit', 'delete', 'copy', 'forward', 'pin', 'unpin']) expect(operation(name, 'message').mutating).toBe(true);
		for (const group of ['webhook', 'commands']) for (const name of ['set', 'delete']) expect(operation(name, group).mutating).toBe(true);
	});

	it('prepares a bounded binary upload with native bytes', async () => {
		const sendDocument = vi.fn(async () => ({ ok: true, result: { message_id: 2 } }));
		const ctx = context({ chat: '@channel', file: './notes.txt', yes: true });
		const run = await operation('send-document').prepare(ctx);
		await run({ sendDocument } as unknown as ITelegramService, {});
		expect(ctx.readBytes).toHaveBeenCalledWith('@./notes.txt', expect.objectContaining({ maxBytes: 20 * 1024 * 1024 }));
		expect(sendDocument).toHaveBeenCalledWith(expect.objectContaining({ chatId: '@channel', document: { bytes: new Uint8Array([1, 2, 3]), filename: 'notes.txt' } }), {});
	});

	it('keeps file-id sends independent of binary ports and preserves captions', async () => {
		const sendPhoto = vi.fn(async () => ({ ok: true, result: { message_id: 1 } }));
		const ctx = context({ chat: '1', source: 'fixture-file-id', caption: '  caption  ', yes: true });
		const run = await operation('send-photo').prepare(ctx);
		await run({ sendPhoto } as unknown as ITelegramService, {});
		expect(ctx.readBytes).not.toHaveBeenCalled();
		expect(sendPhoto).toHaveBeenCalledWith(expect.objectContaining({ photo: 'fixture-file-id', caption: '  caption  ' }), {});
	});

	it('rejects unsafe or ambiguous upload input before reading bytes', async () => {
		for (const options of [{ file: 'a', source: 'b' }, { file: '-', name: '../bad' }, { file: '-', caption: '-', name: 'photo.jpg' }]) {
			const ctx = context({ chat: '1', yes: true, ...options });
			await expect(Promise.resolve().then(() => operation('send-photo').prepare(ctx))).rejects.toThrow();
			expect(ctx.readBytes).not.toHaveBeenCalled();
		}
	});

	it('writes downloaded bytes to the host and returns metadata only', async () => {
		const bytes = new Uint8Array([0, 255, 1]);
		const downloadFile = vi.fn(async () => ({ bytes, filePath: 'documents/sample.pdf', byteLength: 3 }));
		const ctx = context({ out: 'sample.pdf' }, ['documents/sample.pdf']);
		const signal = new AbortController().signal;
		const run = await operation('download', 'file').prepare(ctx);
		await expect(run({ downloadFile } as unknown as ITelegramService, { signal })).resolves.toEqual({ filePath: 'documents/sample.pdf', byteLength: 3, out: 'sample.pdf' });
		expect(ctx.writeBytes).toHaveBeenCalledWith('sample.pdf', bytes, { signal });
	});

	it('exports Base64 in structured output and validates the destination before downloading', async () => {
		const downloadFile = vi.fn(async () => ({ bytes: new Uint8Array([1, 2, 3]), filePath: 'documents/sample.pdf', byteLength: 3 }));
		const ctx = context({ json: true }, ['documents/sample.pdf']);
		const run = await operation('download', 'file').prepare(ctx);
		await expect(run({ downloadFile } as unknown as ITelegramService, {})).resolves.toMatchObject({ base64: 'AQID', byteLength: 3 });
		expect(() => operation('download', 'file').prepare(context({}, ['documents/sample.pdf']))).toThrow('Provide --out');
	});

	it('treats getUpdates as a write through both typed and raw commands', async () => {
		await expect(Promise.resolve().then(() => operation('updates').prepare(context()))).rejects.toThrow('requires --yes');
		await expect(Promise.resolve().then(() => operation('api').prepare(context({}, ['getUpdates'])))).rejects.toThrow('requires --yes');
		const getUpdates = vi.fn(async () => ({ ok: true, result: [] }));
		const run = await operation('updates').prepare(context({ yes: true, offset: '-1', limit: '20', timeout: '0', 'allowed-update': ['message', 'callback_query'] }));
		await run({ getUpdates } as unknown as ITelegramService, {});
		expect(getUpdates).toHaveBeenCalledWith({ offset: -1, limit: 20, timeout: 0, allowedUpdates: ['message', 'callback_query'] }, {});
	});

	it('accepts JSON values in raw params and rejects duplicate or dangerous keys', async () => {
		const request = vi.fn(async () => ({ ok: true, result: true }));
		const run = await operation('api').prepare(context({ yes: true, params: ['chat_id=123', 'reply_markup=json:{"inline_keyboard":[]}'] }, ['sendMessage']));
		await run({ request } as unknown as ITelegramService, {});
		expect(request).toHaveBeenCalledWith({ method: 'sendMessage', params: { chat_id: '123', reply_markup: { inline_keyboard: [] } } }, {});
		for (const params of [['a=1', 'a=2'], ['__proto__=x'], ['test=json:{']]) {
			await expect(operation('api').prepare(context({ params }, ['getMe']))).rejects.toThrow();
		}
	});
});
