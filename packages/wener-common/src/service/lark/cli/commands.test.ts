import { describe, expect, it, vi } from 'vitest';
import type { ServiceCliInputContext } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { ILarkService } from '../ILarkService';
import { LarkCliDefinition } from './commands';

const operation = (name: string) => LarkCliDefinition.commands.find((entry) => entry.name === name)!;
const context = (args: string[] = [], options: ServiceCliInputContext['options'] = {}) => ({
	args,
	options,
	readText: vi.fn(async (value: string) => value),
});

describe('Lark CLI preparation', () => {
	it('exposes the lark name and feishu alias', () => {
		expect(LarkCliDefinition.name).toBe('lark');
		expect(LarkCliDefinition.aliases).toContain('feishu');
	});

	it('requires --to and --text for send', async () => {
		await expect(operation('send').prepare(context([], { text: 'hi', yes: true }))).rejects.toThrow('--to is required');
		await expect(operation('send').prepare(context([], { to: 'ou_1', yes: true }))).rejects.toThrow('--text is required');
	});

	it('rejects send without --yes', async () => {
		await expect(operation('send').prepare(context([], { to: 'ou_1', text: 'hi' }))).rejects.toThrow('requires --yes');
	});

	it('sends a message', async () => {
		const client = { sendMessage: vi.fn(async () => ({ message_id: 'om_1' })) } as unknown as ILarkService;
		const run = await operation('send').prepare(context([], { to: 'ou_1', text: 'hello', yes: true }));
		await run(client, {});
		expect(client.sendMessage).toHaveBeenCalledWith({ to: 'ou_1', text: 'hello' });
	});

	it('does not expose --url or --secret options on webhook', () => {
		const names = (operation('webhook').options ?? []).map((option) => option.name);
		expect(names).not.toContain('url');
		expect(names).not.toContain('secret');
	});

	it('requires --text or --markdown for webhook', async () => {
		await expect(operation('webhook').prepare(context([], { yes: true }))).rejects.toThrow('--text or --markdown is required');
	});

	it('rejects combining --text and --markdown', async () => {
		await expect(
			operation('webhook').prepare(context([], { text: 'a', markdown: 'b', yes: true })),
		).rejects.toThrow('cannot be combined');
	});

	it('rejects webhook without --yes', async () => {
		await expect(operation('webhook').prepare(context([], { text: 'hi' }))).rejects.toThrow('requires --yes');
	});

	it('sends a webhook text message', async () => {
		const client = { sendWebhook: vi.fn(async () => ({ code: 0 })) } as unknown as ILarkService;
		const run = await operation('webhook').prepare(context([], { text: 'hi', yes: true }));
		await run(client, {});
		expect(client.sendWebhook).toHaveBeenCalledWith({ text: 'hi', markdown: undefined });
	});

	it('requires a path argument for api', async () => {
		await expect(operation('api').prepare(context([]))).rejects.toThrow('path is required');
	});

	it('rejects api without --yes', async () => {
		await expect(operation('api').prepare(context(['im/v1/messages']))).rejects.toThrow('requires --yes');
	});

	it('calls request with a parsed JSON body', async () => {
		const client = { request: vi.fn(async () => ({ code: 0 })) } as unknown as ILarkService;
		const run = await operation('api').prepare(
			context(['im/v1/messages'], { method: 'POST', body: '{"receive_id":"ou_1"}', yes: true }),
		);
		await run(client, {});
		expect(client.request).toHaveBeenCalledWith({ path: 'im/v1/messages', method: 'POST', body: { receive_id: 'ou_1' } });
	});

	it('rejects an invalid JSON body', async () => {
		await expect(
			operation('api').prepare(context(['im/v1/messages'], { method: 'POST', body: 'not json', yes: true })),
		).rejects.toThrow('valid JSON');
	});

	it('rejects an invalid --method', async () => {
		await expect(
			operation('api').prepare(context(['im/v1/messages'], { method: 'FOO', yes: true })),
		).rejects.toThrow(ServiceCliInputError);
	});
});
