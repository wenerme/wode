import { TelegramClientError } from './errors';

/**
 * Telegram bot tokens look like `<bot_id>:<secret>`. The secret portion length has varied
 * across Telegram's history (observed values are commonly 35 characters) and is not documented
 * as a fixed contract, so this check is deliberately permissive (minimum 30 chars of the
 * documented `[A-Za-z0-9_-]` alphabet) to avoid rejecting a legitimate but differently-sized
 * token. It still rejects obviously malformed values (missing colon, non-numeric bot id, or a
 * secret containing characters Telegram never issues).
 */
const BOT_TOKEN_PATTERN = /^\d+:[A-Za-z0-9_-]{30,}$/u;

export function isValidTelegramBotToken(token: unknown): token is string {
	return typeof token === 'string' && BOT_TOKEN_PATTERN.test(token);
}

export interface TelegramSendMessageInput {
	chatId: string | number;
	text: string;
	parseMode?: string;
	disableNotification?: boolean;
	replyToMessageId?: number;
}
export interface TelegramRequestOptions {
	signal?: AbortSignal;
	timeoutMs?: number;
}

/** Telegram method names are path segments; reject anything that could change the request target. */
const METHOD_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/u;

export function validateTelegramMethod(method: string): string {
	if (typeof method !== 'string' || !METHOD_PATTERN.test(method))
		throw new TelegramClientError('INVALID_REQUEST', 'Invalid Telegram API method');
	return method;
}

export function validateSendMessageInput(input: TelegramSendMessageInput): { chatId: string | number; text: string; parseMode?: string; disableNotification?: boolean; replyToMessageId?: number } {
	if (input === null || typeof input !== 'object') throw new TelegramClientError('INVALID_REQUEST', 'Invalid Telegram sendMessage request');
	const { chatId, text, parseMode, disableNotification, replyToMessageId } = input;
	if (!(typeof chatId === 'string' && chatId.length > 0) && !(typeof chatId === 'number' && Number.isFinite(chatId)))
		throw new TelegramClientError('INVALID_REQUEST', 'Telegram sendMessage requires a chatId');
	if (typeof text !== 'string' || !text.length) throw new TelegramClientError('INVALID_REQUEST', 'Telegram sendMessage requires text');
	if (parseMode !== undefined && typeof parseMode !== 'string') throw new TelegramClientError('INVALID_REQUEST', 'Invalid Telegram parseMode');
	if (disableNotification !== undefined && typeof disableNotification !== 'boolean') throw new TelegramClientError('INVALID_REQUEST', 'Invalid Telegram disableNotification');
	if (replyToMessageId !== undefined && (!Number.isSafeInteger(replyToMessageId) || replyToMessageId < 1)) throw new TelegramClientError('INVALID_REQUEST', 'Invalid Telegram replyToMessageId');
	return { chatId, text, parseMode, disableNotification, replyToMessageId };
}
