import { describe, expect, it, vi } from 'vitest';
import type { ServiceCliInputContext } from '../../cli/ServiceCliDefinition';
import type { IFeishuService } from '../IFeishuService';
import { FEISHU_MAX_IMAGE_BYTES } from '../schema';
import { FeishuCliDefinition } from './commands';

/** The host invokes prepare inside an async closure; a synchronous throw is a rejection. */
const command = (group: string | undefined, name: string) => {
	const operation = FeishuCliDefinition.commands.find((entry) => entry.group === group && entry.name === name)!;
	return { ...operation, prepare: async (ctx: ServiceCliInputContext) => operation.prepare(ctx) };
};

function context(args: string[] = [], options: ServiceCliInputContext['options'] = {}, ports: Partial<ServiceCliInputContext> = {}) {
	return {
		args, options,
		readText: vi.fn(async (value: string) => value),
		...ports,
	} satisfies ServiceCliInputContext;
}

const writes: Array<[string, string, string[], ServiceCliInputContext['options']]> = [
	['message', 'reply', ['om_1'], { text: '@reply.txt' }],
	['message', 'delete', ['om_1'], {}],
	['message', 'react', ['om_1'], { emoji: 'THUMBSUP' }],
	['message', 'unreact', ['om_1'], { reaction: 'r_1' }],
	['file', 'upload', [], { type: 'pdf', file: 'a.pdf' }],
];

describe('Feishu CLI IM/contact commands', () => {
	it('keeps the original commands first and adds grouped commands', () => {
		expect(FeishuCliDefinition.commands.slice(0, 2).map((entry) => entry.name)).toEqual(['send', 'webhook']);
		expect(FeishuCliDefinition.commands.slice(2).map((entry) => `${entry.group} ${entry.name}`)).toEqual([
			'chat list', 'chat get', 'chat members', 'user get', 'message list', 'message get', 'message reply',
			'message delete', 'message react', 'message unreact', 'file upload', 'file download',
			'api list', 'api describe', 'api call', 'api request',
		]);
	});

	it('marks only writes as mutating so the host checks read-only first', () => {
		const mutating = FeishuCliDefinition.commands.filter((entry) => entry.mutating).map((entry) => `${entry.group ?? ''} ${entry.name}`.trim());
		expect(mutating).toEqual(['send', 'webhook', 'message reply', 'message delete', 'message react', 'message unreact', 'file upload', 'api request']);
	});

	it.each(writes)('%s %s requires --yes before reading any input', async (group, name, args, options) => {
		const readBytes = vi.fn(async () => new Uint8Array([1]));
		const ctx = context(args, options, { readBytes });
		await expect(command(group, name).prepare(ctx)).rejects.toThrow('requires --yes');
		expect(ctx.readText).not.toHaveBeenCalled();
		expect(readBytes).not.toHaveBeenCalled();
	});

	it('prepares read commands without confirmation and maps options to contract input', async () => {
		const client = {
			listChat: vi.fn(async () => ({ items: [], hasMore: false })),
			listMessage: vi.fn(async () => ({ items: [], hasMore: false })),
			listChatMember: vi.fn(async () => ({ items: [], hasMore: false })),
			getUser: vi.fn(async () => ({ open_id: 'ou_1' })),
		} as unknown as IFeishuService;
		const signal = new AbortController().signal;
		await (await command('chat', 'list').prepare(context([], { sort: 'active', 'page-size': '20', 'page-token': 'p2' })))(client, { signal });
		expect(client.listChat).toHaveBeenCalledWith({ sortType: 'ByActiveTimeDesc', pageSize: 20, pageToken: 'p2' }, { signal });
		await (await command('message', 'list').prepare(context([], { chat: 'oc_1', sort: 'desc', 'start-time': '1700000000' })))(client, { signal });
		expect(client.listMessage).toHaveBeenCalledWith({ chatId: 'oc_1', sortType: 'ByCreateTimeDesc', startTime: '1700000000' }, { signal });
		await (await command('chat', 'members').prepare(context(['oc_1'], { 'id-type': 'user_id' })))(client, { signal });
		expect(client.listChatMember).toHaveBeenCalledWith({ chatId: 'oc_1', memberIdType: 'user_id' }, { signal });
		await (await command('user', 'get').prepare(context([], { email: 'a@example.test' })))(client, { signal });
		expect(client.getUser).toHaveBeenCalledWith({ email: 'a@example.test' }, { signal });
	});

	it('validates read command arguments before any client exists', async () => {
		await expect(command('message', 'list').prepare(context())).rejects.toThrow('--chat is required');
		await expect(command('message', 'list').prepare(context([], { chat: 'oc_1', 'page-size': '51' }))).rejects.toThrow('between 1 and 50');
		await expect(command('chat', 'list').prepare(context([], { sort: 'newest' }))).rejects.toThrow('--sort must be one of');
		await expect(command('user', 'get').prepare(context())).rejects.toThrow('Provide a user id or --email');
		await expect(command('user', 'get').prepare(context(['ou_1'], { email: 'a@example.test' }))).rejects.toThrow('Provide a user id or --email');
		await expect(command('chat', 'get').prepare(context())).rejects.toThrow('Chat id is required');
	});

	it('replies with text or raw content and rejects ambiguous payloads', async () => {
		const client = { replyMessage: vi.fn(async () => ({ message_id: 'om_2' })) } as unknown as IFeishuService;
		const text = context(['om_1'], { text: ' ack ', yes: true, 'reply-in-thread': true });
		await (await command('message', 'reply').prepare(text))(client, {});
		expect(client.replyMessage).toHaveBeenCalledWith({ messageId: 'om_1', text: 'ack', replyInThread: true }, {});
		const raw = context(['om_1'], { content: '{"zh_cn":{}}', 'msg-type': 'post', yes: true });
		await (await command('message', 'reply').prepare(raw))(client, {});
		expect(client.replyMessage).toHaveBeenLastCalledWith({ messageId: 'om_1', content: '{"zh_cn":{}}', msgType: 'post' }, {});
		await expect(command('message', 'reply').prepare(context(['om_1'], { text: 'a', content: '{}', yes: true }))).rejects.toThrow('exactly one');
		await expect(command('message', 'reply').prepare(context(['om_1'], { content: '{}', yes: true }))).rejects.toThrow('--msg-type');
		await expect(command('message', 'reply').prepare(context(['om_1'], { content: 'nope', 'msg-type': 'post', yes: true }))).rejects.toThrow('valid JSON');
	});

	describe('file upload', () => {
		it('reads --file through the binary port with the type limit and defaults the name', async () => {
			const readBytes = vi.fn(async () => new Uint8Array([1, 2]));
			const client = { uploadFile: vi.fn(async () => ({ fileKey: 'file_1' })), uploadImage: vi.fn(async () => ({ imageKey: 'img_1' })) } as unknown as IFeishuService;
			const run = await command('file', 'upload').prepare(context([], { type: 'pdf', file: 'docs/report.pdf', yes: true }, { readBytes }));
			expect(readBytes).toHaveBeenCalledWith('@docs/report.pdf', { label: 'Feishu upload', maxBytes: 30 * 1024 * 1024 });
			await expect(run(client, {})).resolves.toEqual({ fileKey: 'file_1' });
			expect(client.uploadFile).toHaveBeenCalledWith({ file: new Uint8Array([1, 2]), fileType: 'pdf', fileName: 'report.pdf' }, {});
			const image = await command('file', 'upload').prepare(context([], { type: 'image', file: '@a.png', yes: true }, { readBytes }));
			expect(readBytes).toHaveBeenLastCalledWith('@a.png', { label: 'Feishu upload', maxBytes: FEISHU_MAX_IMAGE_BYTES });
			await image(client, {});
			expect(client.uploadImage).toHaveBeenCalledWith({ image: new Uint8Array([1, 2]), filename: 'a.png' }, {});
		});

		it('decodes --base64 strictly and enforces the size bound', async () => {
			const client = { uploadFile: vi.fn(async () => ({ fileKey: 'file_1' })) } as unknown as IFeishuService;
			const run = await command('file', 'upload').prepare(context([], { type: 'stream', base64: 'AQ\nID', name: 'a.bin', yes: true }));
			await run(client, {});
			expect(client.uploadFile).toHaveBeenCalledWith({ file: new Uint8Array([1, 2, 3]), fileType: 'stream', fileName: 'a.bin' }, {});
			await expect(command('file', 'upload').prepare(context([], { type: 'stream', base64: 'AB==', name: 'a', yes: true }))).rejects.toThrow('valid Base64');
			await expect(command('file', 'upload').prepare(context([], { type: 'stream', base64: '***', name: 'a', yes: true }))).rejects.toThrow('valid Base64');
			const oversized = 'A'.repeat(Math.ceil((FEISHU_MAX_IMAGE_BYTES + 3) / 3) * 4);
			await expect(command('file', 'upload').prepare(context([], { type: 'image', base64: oversized, yes: true }))).rejects.toThrow('exceeds 10 MiB');
		});

		it('budgets raw --base64 text for line wrapping near the size limit; decoded bytes enforce the limit', async () => {
			const ctx = context([], { type: 'image', base64: 'AQID\r\nBAUG', yes: true });
			const client = { uploadImage: vi.fn(async () => ({ imageKey: 'img_1' })) } as unknown as IFeishuService;
			const run = await command('file', 'upload').prepare(ctx);
			await run(client, {});
			expect((client.uploadImage as ReturnType<typeof vi.fn>).mock.calls[0]![0]).toMatchObject({ image: new Uint8Array([1, 2, 3, 4, 5, 6]) });
			// A full-size payload wrapped at 76 columns with CRLF must fit the raw text budget.
			const encoded = Math.floor(FEISHU_MAX_IMAGE_BYTES / 3) * 4;
			const wrappedLength = encoded + 2 * Math.ceil(encoded / 76);
			const maxBytes = ((ctx.readText as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as unknown as [string, { maxBytes: number }])[1].maxBytes;
			expect(maxBytes).toBeGreaterThan(wrappedLength);
		});

		it('validates type, source, name and host support before reading input', async () => {
			const ctx = (options: Record<string, unknown>) => context([], { yes: true, ...options });
			for (const [options, message] of [
				[{ type: 'exe', base64: 'AQID', name: 'a' }, '--type must be one of'],
				[{ type: 'pdf' }, 'exactly one of --file or --base64'],
				[{ type: 'pdf', base64: 'AQID' }, '--name is required'],
				[{ type: 'pdf', base64: 'AQID', name: 'a', duration: '10' }, '--duration applies'],
				[{ type: 'pdf', file: 'a.pdf' }, 'does not support binary file input'],
			] as const) {
				const c = ctx(options);
				await expect(command('file', 'upload').prepare(c)).rejects.toThrow(message);
				expect(c.readText).not.toHaveBeenCalled();
			}
		});
	});

	describe('file download', () => {
		const resource = { data: new Uint8Array([1, 2, 3]), contentType: 'application/pdf', filename: 'r.pdf' };

		it('writes raw bytes through the host port with --out and returns metadata', async () => {
			const writeBytes = vi.fn(async () => undefined);
			const client = { downloadMessageResource: vi.fn(async () => resource) } as unknown as IFeishuService;
			const signal = new AbortController().signal;
			const run = await command('file', 'download').prepare(context(['om_1', 'file_1'], { type: 'file', out: 'r.pdf', 'max-bytes': '1024' }, { writeBytes }));
			await expect(run(client, { signal })).resolves.toEqual({
				messageId: 'om_1', fileKey: 'file_1', byteLength: 3, contentType: 'application/pdf', filename: 'r.pdf', path: 'r.pdf',
			});
			expect(client.downloadMessageResource).toHaveBeenCalledWith({ messageId: 'om_1', fileKey: 'file_1', type: 'file', maxBytes: 1024 }, { signal });
			expect(writeBytes).toHaveBeenCalledWith('r.pdf', resource.data, { signal });
		});

		it('returns Base64 only for structured output', async () => {
			const client = { downloadMessageResource: vi.fn(async () => resource) } as unknown as IFeishuService;
			const run = await command('file', 'download').prepare(context(['om_1', 'file_1'], { type: 'file', json: true }));
			await expect(run(client, {})).resolves.toMatchObject({ byteLength: 3, contentBase64: 'AQID' });
			await expect(command('file', 'download').prepare(context(['om_1', 'file_1'], { type: 'file' }))).rejects.toThrow('Provide --out');
		});

		it('rejects missing host output support, bad types and oversize limits before any client', async () => {
			await expect(command('file', 'download').prepare(context(['om_1', 'f'], { type: 'file', out: 'x' }))).rejects.toThrow('binary file output');
			await expect(command('file', 'download').prepare(context(['om_1', 'f'], { type: 'video', json: true }))).rejects.toThrow('Invalid type');
			await expect(command('file', 'download').prepare(context(['om_1', 'f'], { type: 'file', json: true, 'max-bytes': String(31 * 1024 * 1024) }))).rejects.toThrow('--max-bytes');
			await expect(command('file', 'download').prepare(context(['om_1'], { type: 'file', json: true }))).rejects.toThrow('File key is required');
		});
	});
});
