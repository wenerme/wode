import { type ServiceCliDefinition, type ServiceCliOperation, serviceCliString } from '../../cli/ServiceCliDefinition';
import type { ITelegramService } from '../ITelegramService';
import { isTelegramWriteMethod } from '../ITelegramService';
import { TelegramServiceContract as contract } from '../TelegramServiceContract';
import { allowedUpdates, apiParams, argument, chatId, integer, jsonInput, parseInput, requiredInteger, requireYes, textInput } from './input';
import { telegramFileCommands } from './media';
import { TelegramAdHocConnection } from './adHoc';

type Command = ServiceCliOperation<ITelegramService>;
export const telegramYesOption = { name: 'yes', description: 'Confirm the write operation', type: 'boolean' } as const;
const chatOption = { name: 'chat', aliases: ['chat-id'], description: 'Chat id or @channel username' } as const;
const messageOption = { name: 'message', aliases: ['message-id'], description: 'Message id' } as const;
const silentOption = { name: 'silent', description: 'Send without a notification sound', type: 'boolean' } as const;
const parseModeOption = { name: 'parse-mode', description: 'Telegram parse mode: MarkdownV2, HTML or Markdown' } as const;
const allowedOption = { name: 'allowed-update', description: 'Update type; repeat to select multiple types', repeatable: true } as const;
const languageOption = { name: 'language', description: 'Two-letter ISO 639-1 language code; omitted for all languages' } as const;

function messageCommands(): Command[] {
	return [
		{
			name: 'send', mutating: true, description: 'Send a text message; requires --yes and a writable service',
			examples: [{ command: 'woctl tg send --chat 123456789 --text "hello" --yes' }],
			options: [chatOption, { name: 'text', description: 'Message text, @file or - for stdin' }, parseModeOption, silentOption,
				{ name: 'reply-to', description: 'Message id to reply to' }, telegramYesOption],
			async prepare(context) {
				requireYes(context.options);
				const fields = { chatId: chatId(context.options), parseMode: serviceCliString(context.options, 'parse-mode'),
					disableNotification: context.options.silent === true || undefined, replyToMessageId: integer(context.options, 'reply-to') };
				const input = parseInput(contract.sendMessage['~orpc'].inputSchema!, { ...fields, text: await textInput(context) });
				return async (client, options) => client.sendMessage(input, options);
			},
		},
		{
			group: 'message', name: 'edit', mutating: true, description: 'Edit a text message',
			options: [chatOption, messageOption, { name: 'text', description: 'New text, @file or - for stdin' }, parseModeOption, telegramYesOption],
			async prepare(context) {
				requireYes(context.options);
				const fields = { chatId: chatId(context.options), messageId: requiredInteger(context.options, 'message'), parseMode: serviceCliString(context.options, 'parse-mode') };
				const input = parseInput(contract.editMessageText['~orpc'].inputSchema!, { ...fields, text: await textInput(context) });
				return async (client, options) => client.editMessageText(input, options);
			},
		},
		{
			group: 'message', name: 'delete', mutating: true, description: 'Delete a message',
			options: [chatOption, messageOption, telegramYesOption],
			prepare({ options }) {
				requireYes(options);
				const input = parseInput(contract.deleteMessage['~orpc'].inputSchema!, { chatId: chatId(options), messageId: requiredInteger(options, 'message') });
				return async (client, callOptions) => client.deleteMessage(input, callOptions);
			},
		},
		...(['forward', 'copy'] as const).map((name): Command => ({
			group: 'message', name, mutating: true, description: `${name === 'forward' ? 'Forward' : 'Copy'} a message to another chat`,
			options: [chatOption, { name: 'from-chat', description: 'Source chat id or @channel username' }, messageOption, silentOption, telegramYesOption],
			prepare({ options }) {
				requireYes(options);
				const input = parseInput(contract.forwardMessage['~orpc'].inputSchema!, { chatId: chatId(options), fromChatId: chatId(options, 'from-chat'),
					messageId: requiredInteger(options, 'message'), disableNotification: options.silent === true || undefined });
				return async (client, callOptions) => name === 'forward' ? client.forwardMessage(input, callOptions) : client.copyMessage(input, callOptions);
			},
		})),
		{
			group: 'message', name: 'pin', mutating: true, description: 'Pin a message in a chat',
			options: [chatOption, messageOption, silentOption, telegramYesOption],
			prepare({ options }) {
				requireYes(options);
				const input = parseInput(contract.pinChatMessage['~orpc'].inputSchema!, { chatId: chatId(options), messageId: requiredInteger(options, 'message'), disableNotification: options.silent === true || undefined });
				return async (client, callOptions) => client.pinChatMessage(input, callOptions);
			},
		},
		{
			group: 'message', name: 'unpin', mutating: true, description: 'Unpin a message, or the most recent pin when --message is omitted',
			options: [chatOption, messageOption, telegramYesOption],
			prepare({ options }) {
				requireYes(options);
				const input = parseInput(contract.unpinChatMessage['~orpc'].inputSchema!, { chatId: chatId(options), messageId: integer(options, 'message') });
				return async (client, callOptions) => client.unpinChatMessage(input, callOptions);
			},
		},
	];
}

function chatCommands(): Command[] {
	return [
		{
			group: 'chat', name: 'get', argument: 'chat-id', description: 'Get chat information',
			prepare({ args }) {
				const input = parseInput(contract.getChat['~orpc'].inputSchema!, { chatId: argument(args, 0, 'Chat id') });
				return async (client, options) => client.getChat(input, options);
			},
		},
		{
			group: 'chat', name: 'member', argument: 'chat-id', description: 'Get a chat member by user id',
			options: [{ name: 'user', description: 'Telegram user id' }],
			prepare({ args, options }) {
				const input = parseInput(contract.getChatMember['~orpc'].inputSchema!, { chatId: argument(args, 0, 'Chat id'), userId: requiredInteger(options, 'user') });
				return async (client, callOptions) => client.getChatMember(input, callOptions);
			},
		},
		{
			group: 'chat', name: 'admins', argument: 'chat-id', description: 'List chat administrators',
			prepare({ args }) {
				const input = parseInput(contract.getChatAdministrators['~orpc'].inputSchema!, { chatId: argument(args, 0, 'Chat id') });
				return async (client, options) => client.getChatAdministrators(input, options);
			},
		},
		{
			group: 'chat', name: 'count', argument: 'chat-id', description: 'Get the number of chat members',
			prepare({ args }) {
				const input = parseInput(contract.getChatMemberCount['~orpc'].inputSchema!, { chatId: argument(args, 0, 'Chat id') });
				return async (client, options) => client.getChatMemberCount(input, options);
			},
		},
	];
}

function botCommands(): Command[] {
	return [
		{
			name: 'updates', mutating: true, description: 'Fetch one batch of updates; may acknowledge the queue, requires --yes',
			options: [{ name: 'offset', description: 'Update offset; confirms earlier updates (negative offsets discard older updates)' },
				{ name: 'limit', description: 'Number of updates, 1..100' }, { name: 'timeout', description: 'Long-poll wait in seconds, 0..50; service timeout must exceed this' }, allowedOption, telegramYesOption],
			prepare({ options }) {
				requireYes(options);
				const input = parseInput(contract.getUpdates['~orpc'].inputSchema!, { offset: integer(options, 'offset', -Number.MAX_SAFE_INTEGER),
					limit: integer(options, 'limit', 1, 100), timeout: integer(options, 'timeout', 0, 50), allowedUpdates: allowedUpdates(options) });
				return async (client, callOptions) => client.getUpdates(input, callOptions);
			},
		},
		{
			group: 'webhook', name: 'info', description: 'Read webhook status and pending update count',
			prepare: () => async (client, options) => client.getWebhookInfo({}, options),
		},
		{
			group: 'webhook', name: 'set', argument: 'url', mutating: true, description: 'Set an HTTPS webhook',
			options: [{ name: 'secret-token', description: 'Webhook verification secret, @file or - for stdin' },
				{ name: 'drop-pending', description: 'Discard pending updates', type: 'boolean' },
				{ name: 'max-connections', description: 'Maximum webhook connections, 1..100' }, allowedOption, telegramYesOption],
			async prepare(context) {
				const { args, options } = context;
				requireYes(options);
				const fields = { url: argument(args, 0, 'Webhook URL'), dropPendingUpdates: options['drop-pending'] === true || undefined,
					maxConnections: integer(options, 'max-connections', 1, 100), allowedUpdates: allowedUpdates(options) };
				parseInput(contract.setWebhook['~orpc'].inputSchema!, fields);
				const secret = serviceCliString(options, 'secret-token');
				const secretToken = secret === undefined ? undefined : (await context.readText(secret, { label: 'Telegram webhook secret', maxBytes: 1024 })).trim();
				const input = parseInput(contract.setWebhook['~orpc'].inputSchema!, { ...fields, secretToken });
				return async (client, callOptions) => client.setWebhook(input, callOptions);
			},
		},
		{
			group: 'webhook', name: 'delete', mutating: true, description: 'Remove the webhook to enable getUpdates polling',
			options: [{ name: 'drop-pending', description: 'Discard pending updates', type: 'boolean' }, telegramYesOption],
			prepare({ options }) {
				requireYes(options);
				const input = parseInput(contract.deleteWebhook['~orpc'].inputSchema!, { dropPendingUpdates: options['drop-pending'] === true || undefined });
				return async (client, callOptions) => client.deleteWebhook(input, callOptions);
			},
		},
		{
			group: 'callback', name: 'answer', argument: 'query-id', mutating: true, description: 'Answer a callback query from an inline keyboard',
			options: [{ name: 'text', description: 'Notification text (up to 200 characters)' }, { name: 'alert', description: 'Show an alert', type: 'boolean' },
				{ name: 'url', description: 'URL to open' }, { name: 'cache-time', description: 'Client cache time in seconds' }, telegramYesOption],
			prepare({ args, options }) {
				requireYes(options);
				const input = parseInput(contract.answerCallbackQuery['~orpc'].inputSchema!, { callbackQueryId: argument(args, 0, 'Callback query id'),
					text: serviceCliString(options, 'text'), showAlert: options.alert === true || undefined, url: serviceCliString(options, 'url'), cacheTime: integer(options, 'cache-time', 0) });
				return async (client, callOptions) => client.answerCallbackQuery(input, callOptions);
			},
		},
		{
			group: 'commands', name: 'get', description: 'List the bot command menu', options: [languageOption],
			prepare({ options }) {
				const input = parseInput(contract.getMyCommands['~orpc'].inputSchema!, { languageCode: serviceCliString(options, 'language') });
				return async (client, callOptions) => client.getMyCommands(input, callOptions);
			},
		},
		{
			group: 'commands', name: 'set', mutating: true, description: 'Replace the bot command menu',
			options: [{ name: 'data', description: 'JSON array of {command,description}, @file or - for stdin' }, languageOption, telegramYesOption],
			async prepare(context) {
				requireYes(context.options);
				const input = parseInput(contract.setMyCommands['~orpc'].inputSchema!, { commands: await jsonInput(context, 'data'), languageCode: serviceCliString(context.options, 'language') });
				return async (client, options) => client.setMyCommands(input, options);
			},
		},
		{
			group: 'commands', name: 'delete', mutating: true, description: 'Delete the bot command menu', options: [languageOption, telegramYesOption],
			prepare({ options }) {
				requireYes(options);
				const input = parseInput(contract.deleteMyCommands['~orpc'].inputSchema!, { languageCode: serviceCliString(options, 'language') });
				return async (client, callOptions) => client.deleteMyCommands(input, callOptions);
			},
		},
	];
}

export const TelegramCliDefinition: ServiceCliDefinition<ITelegramService> = {
	name: 'telegram', aliases: ['tg'],
	description: 'Use the Telegram Bot API: messages, chats, updates, webhooks and files',
	options: [
		{ name: 'token', description: 'Bot token for an ad hoc connection; defaults to service name telegram and is not saved' },
		{ name: 'read-only', description: 'Restrict the ad hoc connection to read-only operations', type: 'boolean' },
	],
	adHoc: TelegramAdHocConnection,
	helpText: 'Bot API only. Writes require --yes and readOnly: false. Updates are fetched once per invocation.',
	commands: [
		{
			name: 'whoami', aliases: ['status'], description: 'Read the configured Telegram bot identity',
			prepare: () => async (service, options) => service.whoami({}, options),
		},
		...messageCommands(), ...chatCommands(), ...botCommands(), ...telegramFileCommands(),
		{
			name: 'api', argument: 'method', description: 'Call a Bot API method; write methods require --yes and a writable service',
			options: [{ name: 'params', description: 'Inline key=value parameter; prefix a value with json: for objects, numbers or arrays', repeatable: true }, telegramYesOption],
			async prepare({ args, options }) {
				const method = argument(args, 0, 'Telegram API method');
				if (isTelegramWriteMethod(method)) requireYes(options);
				const input = parseInput(contract.request['~orpc'].inputSchema!, { method, params: apiParams(options) });
				return async (client, callOptions) => isTelegramWriteMethod(method) ? client.request(input, callOptions) : client.requestRead(input, callOptions);
			},
		},
	],
};
