import { TelegramClient, TelegramClientError, isValidTelegramBotToken, type TelegramClientOptions, type TelegramRequestOptions } from '@wener/client/telegram';
import { z } from 'zod';
import type { ServiceProviderDefinition } from '../registry';
import type { ServiceProviderContext } from '../runtime/types';
import type { ITelegramService } from './ITelegramService';
import { isTelegramWriteMethod } from './ITelegramService';
import { TelegramOperations } from './operations';
import { TelegramServiceCapability } from './ITelegramService';
import { TelegramServiceContract, type TelegramServiceCallOptions, type TelegramServiceInputs } from './TelegramServiceContract';

const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);
/**
 * Only an environment variable reference is accepted for the bot token. A bot token is a
 * complete account-control credential (unlike Grafana's accessToken, there is no scoped or
 * revocable-without-reissue variant), so inline plaintext configuration is intentionally not
 * supported.
 */
export const TelegramServiceOptionsSchema = Object.assign(z.strictObject({
	botTokenEnv: envName,
	timeoutMs: z.number().int().min(1).max(3_600_000).optional(),
	maxResponseBytes: z.number().int().min(1).max(64 * 1024 * 1024).optional(),
}), {
	jsonSchema: {
		type: 'object',
		properties: {
			botTokenEnv: { type: 'string' },
			timeoutMs: { type: 'integer', minimum: 1 },
			maxResponseBytes: { type: 'integer', minimum: 1 },
		},
		required: ['botTokenEnv'],
		additionalProperties: false,
	},
});
const configOptions = TelegramServiceOptionsSchema;

function requestOptions(options?: TelegramServiceCallOptions): TelegramRequestOptions | undefined {
	return options === undefined ? undefined : { signal: options.signal, timeoutMs: options.context?.timeoutMs };
}

function successEnvelope(result: unknown): { ok: true; result: unknown } {
	return { ok: true, result };
}

function clientOptions({ config, getEnv }: ServiceProviderContext): TelegramClientOptions {
	const parsed = configOptions.safeParse(config.options ?? {});
	if (!parsed.success) throw new Error('Invalid Telegram service configuration');
	const value = parsed.data;
	const botToken = getEnv?.(value.botTokenEnv);
	if (botToken === undefined || !botToken.length) throw new Error('Telegram bot token environment variable is unavailable');
	if (!isValidTelegramBotToken(botToken)) throw new Error('Telegram bot token environment variable has an invalid format');
	return {
		botToken,
		timeoutMs: value.timeoutMs,
		maxResponseBytes: value.maxResponseBytes,
	};
}

export const TelegramServiceProvider: ServiceProviderDefinition<ITelegramService> = {
	name: 'telegram',
	title: 'Telegram Bot',
	description: 'Use Telegram Bot API messages, chats, updates, webhooks, bot commands and files.',
	examples: [
		{ command: 'woctl telegram whoami', description: 'Check the configured bot identity.' },
		{ command: 'woctl telegram send --chat 123456789 --text "hello" --yes', description: 'Send a message.' },
	],
	aliases: ['tg'],
	provides: [TelegramServiceCapability],
	optionsSchema: TelegramServiceOptionsSchema,
	operations: TelegramOperations,
	create(context) {
		const readOnly = context.config.readOnly !== false;
		let client: TelegramClient | undefined;
		let closed = false;
		let closePromise: Promise<void> | undefined;
		const getClient = () => {
			if (closed) throw new TelegramClientError('CLOSED', 'Telegram client is closed');
			return client ??= new TelegramClient({ ...clientOptions(context), fetch: context.fetch });
		};
		const writable = () => {
			if (!readOnly) return;
			throw new Error('Selected service is read-only');
		};
		const parse = <K extends keyof TelegramServiceInputs>(name: K, input: unknown): NonNullable<TelegramServiceInputs[K]> => {
			const parsed = TelegramServiceContract[name]['~orpc'].inputSchema!.safeParse(input);
			if (!parsed.success) throw new TypeError('Invalid Telegram service input');
			return parsed.data as NonNullable<TelegramServiceInputs[K]>;
		};
		const call = async (method: string, params: Record<string, unknown>, options?: TelegramServiceCallOptions) =>
			successEnvelope(await getClient().request(method, params, requestOptions(options)));
		const service: ITelegramService = {
			type: 'telegram', readOnly,
			getMe: async (input, options) => { parse('getMe', input); return successEnvelope(await getClient().getMe(requestOptions(options))); },
			whoami: async (input, options) => { parse('whoami', input); return successEnvelope(await getClient().whoami(requestOptions(options))); },
			async sendMessage(input, options) {
				const value = parse('sendMessage', input);
				writable();
				return successEnvelope(await getClient().sendMessage(value, requestOptions(options)));
			},
			getChat: async (input, options) => { const value = parse('getChat', input); return call('getChat', { chat_id: value.chatId }, options); },
			getChatMember: async (input, options) => { const value = parse('getChatMember', input); return call('getChatMember', { chat_id: value.chatId, user_id: value.userId }, options); },
			getChatAdministrators: async (input, options) => { const value = parse('getChatAdministrators', input); return call('getChatAdministrators', { chat_id: value.chatId }, options); },
			getChatMemberCount: async (input, options) => { const value = parse('getChatMemberCount', input); return call('getChatMemberCount', { chat_id: value.chatId }, options); },
			getUpdates: async (input, options) => {
				const value = parse('getUpdates', input); writable();
				return call('getUpdates', { ...(value.offset === undefined ? {} : { offset: value.offset }), ...(value.limit === undefined ? {} : { limit: value.limit }), ...(value.timeout === undefined ? {} : { timeout: value.timeout }), ...(value.allowedUpdates === undefined ? {} : { allowed_updates: value.allowedUpdates }) }, options);
			},
			getWebhookInfo: async (input, options) => { parse('getWebhookInfo', input); return call('getWebhookInfo', {}, options); },
			setWebhook: async (input, options) => { const value = parse('setWebhook', input); writable(); return call('setWebhook', { url: value.url, ...(value.secretToken === undefined ? {} : { secret_token: value.secretToken }), ...(value.dropPendingUpdates === undefined ? {} : { drop_pending_updates: value.dropPendingUpdates }), ...(value.allowedUpdates === undefined ? {} : { allowed_updates: value.allowedUpdates }), ...(value.maxConnections === undefined ? {} : { max_connections: value.maxConnections }) }, options); },
			deleteWebhook: async (input, options) => { const value = parse('deleteWebhook', input); writable(); return call('deleteWebhook', value.dropPendingUpdates === undefined ? {} : { drop_pending_updates: value.dropPendingUpdates }, options); },
			editMessageText: async (input, options) => { const value = parse('editMessageText', input); writable(); return call('editMessageText', { chat_id: value.chatId, message_id: value.messageId, text: value.text, ...(value.parseMode === undefined ? {} : { parse_mode: value.parseMode }), ...(value.replyMarkup === undefined ? {} : { reply_markup: value.replyMarkup }) }, options); },
			deleteMessage: async (input, options) => { const value = parse('deleteMessage', input); writable(); return call('deleteMessage', { chat_id: value.chatId, message_id: value.messageId }, options); },
			forwardMessage: async (input, options) => { const value = parse('forwardMessage', input); writable(); return call('forwardMessage', { chat_id: value.chatId, from_chat_id: value.fromChatId, message_id: value.messageId, ...(value.disableNotification === undefined ? {} : { disable_notification: value.disableNotification }) }, options); },
			copyMessage: async (input, options) => { const value = parse('copyMessage', input); writable(); return call('copyMessage', { chat_id: value.chatId, from_chat_id: value.fromChatId, message_id: value.messageId, ...(value.disableNotification === undefined ? {} : { disable_notification: value.disableNotification }) }, options); },
			pinChatMessage: async (input, options) => { const value = parse('pinChatMessage', input); writable(); return call('pinChatMessage', { chat_id: value.chatId, message_id: value.messageId, ...(value.disableNotification === undefined ? {} : { disable_notification: value.disableNotification }) }, options); },
			unpinChatMessage: async (input, options) => { const value = parse('unpinChatMessage', input); writable(); return call('unpinChatMessage', { chat_id: value.chatId, ...(value.messageId === undefined ? {} : { message_id: value.messageId }) }, options); },
			answerCallbackQuery: async (input, options) => { const value = parse('answerCallbackQuery', input); writable(); return call('answerCallbackQuery', { callback_query_id: value.callbackQueryId, ...(value.text === undefined ? {} : { text: value.text }), ...(value.showAlert === undefined ? {} : { show_alert: value.showAlert }), ...(value.url === undefined ? {} : { url: value.url }), ...(value.cacheTime === undefined ? {} : { cache_time: value.cacheTime }) }, options); },
			getMyCommands: async (input, options) => { const value = parse('getMyCommands', input); return call('getMyCommands', value.languageCode === undefined ? {} : { language_code: value.languageCode }, options); },
			setMyCommands: async (input, options) => { const value = parse('setMyCommands', input); writable(); return call('setMyCommands', { commands: value.commands, ...(value.languageCode === undefined ? {} : { language_code: value.languageCode }) }, options); },
			deleteMyCommands: async (input, options) => { const value = parse('deleteMyCommands', input); writable(); return call('deleteMyCommands', value.languageCode === undefined ? {} : { language_code: value.languageCode }, options); },
			getFile: async (input, options) => { const value = parse('getFile', input); return call('getFile', { file_id: value.fileId }, options); },
			sendPhoto: async (input, options) => { const value = parse('sendPhoto', input); writable(); return successEnvelope(await getClient().sendPhoto(value, requestOptions(options))); },
			sendDocument: async (input, options) => { const value = parse('sendDocument', input); writable(); return successEnvelope(await getClient().sendDocument(value, requestOptions(options))); },
			downloadFile: async (input, options) => { const value = parse('downloadFile', input); return getClient().downloadFile(value, requestOptions(options)); },
			async request(input, options) {
				const value = parse('request', input);
				if (isTelegramWriteMethod(value.method)) writable();
				return call(value.method, value.params ?? {}, options);
			},
			async requestRead(input, options) {
				const value = parse('requestRead', input);
				if (isTelegramWriteMethod(value.method)) throw new Error('Telegram method is not read-only');
				return call(value.method, value.params ?? {}, options);
			},
			close: async () => {
				if (closePromise) return closePromise;
				closed = true;
				closePromise = client?.close() ?? Promise.resolve();
				return closePromise;
			},
			[Symbol.asyncDispose]() {
				return this.close();
			},
		};
		return { telegram: service };
	},
};
