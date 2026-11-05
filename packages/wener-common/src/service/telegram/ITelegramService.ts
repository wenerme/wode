import type { TelegramRequestOptions, TelegramSendMessageInput } from '@wener/client/telegram';
import { defineServiceCapability } from '../registry/ServiceCapability';

/**
 * Bot API methods that only read state. Anything not in this list is treated as a write and
 * requires an explicit confirmation (CLI `--yes`) plus a writable (non read-only) service.
 * This is a best-effort allowlist based on the Telegram Bot API documentation's query-style
 * methods; it is not exhaustive of every possible future method.
 */
export const TelegramReadOnlyMethods: ReadonlySet<string> = new Set([
	'getMe',
	'getChat',
	'getChatAdministrators',
	'getChatMember',
	'getChatMemberCount',
	'getChatMenuButton',
	'getUpdates',
	'getFile',
	'getUserProfilePhotos',
	'getMyCommands',
	'getMyDescription',
	'getMyShortDescription',
	'getMyName',
	'getMyDefaultAdministratorRights',
	'getWebhookInfo',
	'getForumTopicIconStickers',
	'getStickerSet',
	'getCustomEmojiStickers',
	'getGameHighScores',
	'getBusinessConnection',
	'getAvailableGifts',
]);

export function isTelegramWriteMethod(method: string): boolean {
	return !TelegramReadOnlyMethods.has(method);
}

export interface ITelegramService extends AsyncDisposable {
	readonly type: 'telegram';
	readonly readOnly: boolean;
	getMe(options?: TelegramRequestOptions): Promise<unknown>;
	sendMessage(input: TelegramSendMessageInput, options?: TelegramRequestOptions): Promise<unknown>;
	request(method: string, params?: Record<string, unknown>, options?: TelegramRequestOptions): Promise<unknown>;
	close(): Promise<void>;
}
export type TelegramService = ITelegramService;

/** Capability key for `ITelegramService`; `registry.load(TelegramServiceCapability)` resolves to `ITelegramService`. */
export const TelegramServiceCapability = defineServiceCapability<ITelegramService>('telegram');
