import { describe, expect, it, vi } from 'vitest';
import type { ServiceCliInputContext } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { IFeishuService } from '../IFeishuService';
import { FeishuCliDefinition } from './commands';

const operation = (name: string) => FeishuCliDefinition.commands.find((entry) => entry.name === name)!;
const context = (args: string[] = [], options: ServiceCliInputContext['options'] = {}) => ({
	args,
	options,
	readText: vi.fn(async (value: string) => value),
});

describe('Feishu CLI preparation', () => {
	it('exposes the feishu name without a lark alias', () => {
		expect(FeishuCliDefinition.name).toBe('feishu');
		expect(FeishuCliDefinition.aliases ?? []).not.toContain('lark');
	});

	it('requires --to and --text for send', async () => {
		await expect(operation('send').prepare(context([], { text: 'hi', yes: true }))).rejects.toThrow('--to is required');
		await expect(operation('send').prepare(context([], { to: 'ou_1', yes: true }))).rejects.toThrow('--text is required');
	});

	it('rejects send without --yes', async () => {
		await expect(operation('send').prepare(context([], { to: 'ou_1', text: 'hi' }))).rejects.toThrow('requires --yes');
	});

	it('sends a message', async () => {
		const client = { sendMessage: vi.fn(async () => ({ message_id: 'om_1' })) } as unknown as IFeishuService;
		const run = await operation('send').prepare(context([], { to: 'ou_1', text: 'hello', yes: true }));
		const callOptions = { signal: new AbortController().signal };
		await run(client, callOptions);
		expect(client.sendMessage).toHaveBeenCalledWith({ to: 'ou_1', text: 'hello' }, callOptions);
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
		const client = { sendWebhook: vi.fn(async () => ({ code: 0 })) } as unknown as IFeishuService;
		const run = await operation('webhook').prepare(context([], { text: 'hi', yes: true }));
		await run(client, {});
		expect(client.sendWebhook).toHaveBeenCalledWith({ text: 'hi', markdown: undefined }, {});
	});

	const request = () => FeishuCliDefinition.commands.find((entry) => entry.group === 'api' && entry.name === 'request')!;

	it('requires a method and path for api request', async () => {
		await expect(request().prepare(context([]))).rejects.toThrow('Method must be');
		await expect(request().prepare(context(['GET']))).rejects.toThrow('path is required');
	});

	it('rejects api request without --yes', async () => {
		await expect(request().prepare(context(['GET', 'im/v1/messages']))).rejects.toThrow('requires --yes');
	});

	it('calls request with a parsed JSON body and query', async () => {
		const client = { request: vi.fn(async () => ({ code: 0 })) } as unknown as IFeishuService;
		const run = await request().prepare(
			context(['post', 'im/v1/messages'], { data: '{"receive_id":"ou_1"}', query: ['receive_id_type=open_id'], yes: true }),
		);
		await run(client, {});
		expect(client.request).toHaveBeenCalledWith({
			path: 'im/v1/messages', method: 'POST', params: { receive_id_type: 'open_id' }, body: { receive_id: 'ou_1' },
		}, {});
	});

	it('rejects an invalid JSON body', async () => {
		await expect(request().prepare(context(['POST', 'im/v1/messages'], { data: 'not json', yes: true }))).rejects.toThrow('valid JSON');
	});

	it('rejects an invalid method', async () => {
		await expect(request().prepare(context(['FOO', 'im/v1/messages'], { yes: true }))).rejects.toThrow(ServiceCliInputError);
	});
});
