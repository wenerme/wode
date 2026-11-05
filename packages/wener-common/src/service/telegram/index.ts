import { TelegramClient, TelegramClientError, isValidTelegramBotToken, type TelegramClientOptions, type TelegramRequestOptions } from '@wener/client/telegram';
import { z } from 'zod';
import type { ServiceProviderDefinition } from '../registry';
import type { ServiceProviderContext } from '../runtime/types';
import type { ITelegramService } from './ITelegramService';
import { isTelegramWriteMethod } from './ITelegramService';
import { TelegramOperations } from './operations';
import { TelegramServiceCapability } from './ITelegramService';

export { sanitizeTelegramOutput } from './sanitize';
export { TelegramClientError, isValidTelegramBotToken } from '@wener/client/telegram';
export type { TelegramClientOptions, TelegramRequestOptions, TelegramSendMessageInput } from '@wener/client/telegram';
export { TelegramReadOnlyMethods, isTelegramWriteMethod, type ITelegramService, type TelegramService } from './ITelegramService';
export { TelegramServiceCapability } from './ITelegramService';

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
	title: 'Telegram',
	description: 'Check the configured Telegram bot identity, send messages and call the Telegram Bot API.',
	examples: [
		{ command: 'woctl telegram status', description: 'Check the configured bot identity.' },
		{ command: 'woctl telegram send --chat 123456789 --text "hello"', description: 'Send a message.' },
	],
	aliases: ['tg'],
	provides: [TelegramServiceCapability],
	optionsSchema: TelegramServiceOptionsSchema,
	operations: TelegramOperations,
	create(context) {
		const client = new TelegramClient({ ...clientOptions(context), fetch: context.fetch });
		const readOnly = context.config.readOnly !== false;
		const writable = () => {
			if (!readOnly) return;
			throw new Error('Selected service is read-only');
		};
		const service: ITelegramService = {
			type: 'telegram', readOnly,
			getMe: (options) => client.getMe(options),
			async sendMessage(input, options) {
				writable();
				return client.sendMessage(input, options);
			},
			async request(method, params, options) {
				if (isTelegramWriteMethod(method)) writable();
				return client.request(method, params, options);
			},
			close: () => client.close(),
			[Symbol.asyncDispose]() {
				return this.close();
			},
		};
		return { telegram: service };
	},
};
