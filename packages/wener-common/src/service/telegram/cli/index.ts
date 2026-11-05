import { type ServiceCliDefinition, serviceCliString, serviceCliStrings } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import { isTelegramWriteMethod, type ITelegramService } from '../index';
import { sanitizeTelegramOutput } from '../sanitize';

export const TelegramCliDefinition: ServiceCliDefinition<ITelegramService> = {
	name: 'telegram',
	aliases: ['tg'],
	description: 'Check the configured Telegram bot and call the Telegram Bot API',
	options: [],
	commands: [
		{
			name: 'status', description: 'Read the configured Telegram bot identity (getMe)',
			prepare: () => async (service, callOptions) => sanitizeTelegramOutput(await service.getMe(callOptions)),
		},
		{
			name: 'send', description: 'Send a Telegram message; requires --yes and a writable service',
			options: [
				{ name: 'chat', description: 'Target chat id', aliases: ['chat-id'] },
				{ name: 'text', description: 'Message text, @file or - for stdin' },
				{ name: 'parse-mode', description: 'Telegram parse mode (e.g. MarkdownV2, HTML)' },
				{ name: 'silent', description: 'Send without a notification sound', type: 'boolean' },
				{ name: 'reply-to', description: 'Message id to reply to' },
				{ name: 'yes', description: 'Confirm sending the message', type: 'boolean' },
			],
			async prepare(context) {
				const chat = serviceCliString(context.options, 'chat');
				if (!chat) throw new ServiceCliInputError('--chat is required');
				const textArgument = serviceCliString(context.options, 'text');
				if (!textArgument) throw new ServiceCliInputError('--text is required');
				if (context.options.yes !== true) throw new ServiceCliInputError('Telegram send requires --yes');
				const text = (await context.readText(textArgument, { label: 'Telegram message text', maxBytes: 64 * 1024 })).trim();
				if (!text) throw new ServiceCliInputError('Telegram message text is required');
				const replyToRaw = serviceCliString(context.options, 'reply-to');
				let replyToMessageId: number | undefined;
				if (replyToRaw !== undefined) {
					replyToMessageId = Number(replyToRaw);
					if (!Number.isSafeInteger(replyToMessageId) || replyToMessageId < 1) throw new ServiceCliInputError('--reply-to must be a positive integer');
				}
				const chatId: string | number = /^-?\d+$/u.test(chat) ? Number(chat) : chat;
				const input = {
					chatId,
					text,
					...(serviceCliString(context.options, 'parse-mode') !== undefined ? { parseMode: serviceCliString(context.options, 'parse-mode') } : {}),
					...(context.options.silent === true ? { disableNotification: true } : {}),
					...(replyToMessageId !== undefined ? { replyToMessageId } : {}),
				};
				return async (service, callOptions) => sanitizeTelegramOutput(await service.sendMessage(input, callOptions));
			},
		},
		{
			name: 'api', argument: 'method', description: 'Call a Telegram Bot API method; non-read methods require --yes and a writable service',
			options: [
				{ name: 'params', description: 'Request parameter key=value; repeatable', repeatable: true },
				{ name: 'yes', description: 'Confirm a write request', type: 'boolean' },
			],
			async prepare(context) {
				const method = context.args[0];
				if (!method) throw new ServiceCliInputError('Telegram API method is required');
				if (isTelegramWriteMethod(method) && context.options.yes !== true)
					throw new ServiceCliInputError('Telegram API write requires --yes');
				const params: Record<string, unknown> = Object.create(null);
				for (const value of serviceCliStrings(context.options, 'params') ?? []) {
					const at = value.indexOf('=');
					if (at < 1) throw new ServiceCliInputError('--params expects key=value');
					params[value.slice(0, at)] = value.slice(at + 1);
				}
				return async (service, callOptions) => sanitizeTelegramOutput(await service.request(method, params, callOptions));
			},
		},
	],
};
