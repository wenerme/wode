import { describe, expect, it, vi } from 'vitest';
import type { ServiceCliInputContext } from '../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../cli/ServiceCliInputError';
import { TelegramCliDefinition } from './cli';
import type { ITelegramService } from './index';

const operation = (name: string, group?: string) => TelegramCliDefinition.commands.find((entry) => entry.group === group && (entry.name === name || entry.aliases?.includes(name)))!;
const context = (args: string[] = [], options: ServiceCliInputContext['options'] = {}) => ({
	args, options, readText: vi.fn(async (value: string) => value),
});

describe('Telegram CLI preparation', () => {
	it('exposes the telegram name and tg alias', () => {
		expect(TelegramCliDefinition.name).toBe('telegram');
		expect(TelegramCliDefinition.aliases).toContain('tg');
	});

	it('prepares status without requiring arguments or confirmation', async () => {
		const client = { whoami: vi.fn(async () => ({ id: 1, username: 'fixture_bot' })) } as unknown as ITelegramService;
		const run = await operation('status').prepare(context());
		await run(client, {});
		expect(client.whoami).toHaveBeenCalledWith({}, {});
	});

	it('requires --chat and --text for send', async () => {
		await expect(operation('send').prepare(context([], { text: 'hi', yes: true }))).rejects.toThrow('--chat is required');
		await expect(operation('send').prepare(context([], { chat: '1', yes: true }))).rejects.toThrow('--text is required');
	});

	it('rejects send without --yes', async () => {
		await expect(operation('send').prepare(context([], { chat: '1', text: 'hi' }))).rejects.toThrow('requires --yes');
	});

	it('sends a message with a numeric chat id', async () => {
		const client = { sendMessage: vi.fn(async () => ({ message_id: 1 })) } as unknown as ITelegramService;
		const run = await operation('send').prepare(context([], { chat: '123456789', text: 'hello', yes: true }));
		await run(client, {});
		expect(client.sendMessage).toHaveBeenCalledWith({ chatId: 123456789, text: 'hello' }, {});
	});

	it.each([undefined, true])('preserves the original message result when redact=%s', async (redact) => {
		const text = 'Bearer fixture-token Basic Zml4dHVyZTpwYXNz https://user:pass@example.test bot123456:fixture_token ';
		const result = { ok: true as const, result: { message_id: 1, text: text.repeat(30), password: 'business-password', token: 'business-token' } };
		const client: ITelegramService = {
			type: 'telegram', readOnly: false,
			close: vi.fn<ITelegramService['close']>(),
			[Symbol.asyncDispose]: vi.fn<ITelegramService[typeof Symbol.asyncDispose]>(),
			whoami: vi.fn<ITelegramService['whoami']>(),
			getMe: vi.fn<ITelegramService['getMe']>(),
			sendMessage: vi.fn<ITelegramService['sendMessage']>().mockResolvedValue(result),
			editMessageText: vi.fn<ITelegramService['editMessageText']>(),
			deleteMessage: vi.fn<ITelegramService['deleteMessage']>(),
			forwardMessage: vi.fn<ITelegramService['forwardMessage']>(),
			copyMessage: vi.fn<ITelegramService['copyMessage']>(),
			pinChatMessage: vi.fn<ITelegramService['pinChatMessage']>(),
			unpinChatMessage: vi.fn<ITelegramService['unpinChatMessage']>(),
			getChat: vi.fn<ITelegramService['getChat']>(),
			getChatMember: vi.fn<ITelegramService['getChatMember']>(),
			getChatAdministrators: vi.fn<ITelegramService['getChatAdministrators']>(),
			getChatMemberCount: vi.fn<ITelegramService['getChatMemberCount']>(),
			getUpdates: vi.fn<ITelegramService['getUpdates']>(),
			getWebhookInfo: vi.fn<ITelegramService['getWebhookInfo']>(),
			setWebhook: vi.fn<ITelegramService['setWebhook']>(),
			deleteWebhook: vi.fn<ITelegramService['deleteWebhook']>(),
			answerCallbackQuery: vi.fn<ITelegramService['answerCallbackQuery']>(),
			getMyCommands: vi.fn<ITelegramService['getMyCommands']>(),
			setMyCommands: vi.fn<ITelegramService['setMyCommands']>(),
			deleteMyCommands: vi.fn<ITelegramService['deleteMyCommands']>(),
			getFile: vi.fn<ITelegramService['getFile']>(),
			sendPhoto: vi.fn<ITelegramService['sendPhoto']>(),
			sendDocument: vi.fn<ITelegramService['sendDocument']>(),
			downloadFile: vi.fn<ITelegramService['downloadFile']>(),
			request: vi.fn<ITelegramService['request']>(),
			requestRead: vi.fn<ITelegramService['requestRead']>(),
		};
		const run = await operation('send').prepare(context([], { chat: '123456789', text, yes: true, redact }));
		const callOptions = { signal: new AbortController().signal };
		expect(await run(client, callOptions)).toBe(result);
		expect(result.result.text).toBe(text.repeat(30));
		expect(client.sendMessage).toHaveBeenCalledExactlyOnceWith({ chatId: 123456789, text }, callOptions);
	});

	it('sends a message with a string chat id and optional fields', async () => {
		const client = { sendMessage: vi.fn(async () => ({ message_id: 1 })) } as unknown as ITelegramService;
		const run = await operation('send').prepare(context([], { chat: '@channel', text: 'hello', 'parse-mode': 'HTML', silent: true, 'reply-to': '5', yes: true }));
		await run(client, {});
		expect(client.sendMessage).toHaveBeenCalledWith({ chatId: '@channel', text: 'hello', parseMode: 'HTML', disableNotification: true, replyToMessageId: 5 }, {});
	});

	it('rejects an invalid --reply-to value', async () => {
		await expect(operation('send').prepare(context([], { chat: '1', text: 'hi', 'reply-to': 'abc', yes: true }))).rejects.toThrow(ServiceCliInputError);
	});

	it('allows a read-only api method without --yes', async () => {
		const client = { requestRead: vi.fn(async () => ({ id: 1 })) } as unknown as ITelegramService;
		const run = await operation('api').prepare(context(['getMe']));
		await run(client, {});
		expect(client.requestRead).toHaveBeenCalledWith({ method: 'getMe', params: {} }, {});
	});

	it('rejects a write method without --yes', async () => {
		await expect(operation('api').prepare(context(['sendMessage']))).rejects.toThrow('requires --yes');
	});

	it('accepts a write method with --yes and parses params', async () => {
		const client = { request: vi.fn(async () => ({ message_id: 1 })) } as unknown as ITelegramService;
		const run = await operation('api').prepare(context(['sendMessage'], { params: ['chat_id=1', 'text=hi'], yes: true }));
		await run(client, {});
		expect(client.request).toHaveBeenCalledWith({ method: 'sendMessage', params: { chat_id: '1', text: 'hi' } }, {});
	});

	it('requires a method argument', async () => {
		await expect(operation('api').prepare(context([]))).rejects.toThrow('method is required');
	});

	it('rejects a malformed --params entry', async () => {
		await expect(operation('api').prepare(context(['getMe'], { params: ['bad'] }))).rejects.toThrow('expects key=value');
	});
});
