import { TelegramClientError } from './errors';

/** Local transport bounds; Telegram's document API may accept larger upstream files. */
export const TELEGRAM_MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const TELEGRAM_MAX_FILE_BYTES = 20 * 1024 * 1024;

/**
 * Telegram bot tokens look like `<bot_id>:<secret>`. Telegram does not publish a fixed
 * secret length, so the minimum is intentionally permissive while the alphabet and bot id
 * remain strict enough to reject malformed or injectable values.
 */
const BOT_TOKEN_PATTERN = /^\d+:[A-Za-z0-9_-]{30,}$/u;

export function isValidTelegramBotToken(token: unknown): token is string {
	return typeof token === 'string' && BOT_TOKEN_PATTERN.test(token);
}

export interface TelegramRequestOptions {
	signal?: AbortSignal;
	timeoutMs?: number;
}

export interface TelegramSendMessageInput {
	chatId: string | number;
	text: string;
	parseMode?: string;
	disableNotification?: boolean;
	replyToMessageId?: number;
}

export interface TelegramChatInput { chatId: string | number }
export interface TelegramChatMemberInput extends TelegramChatInput { userId: number }
export interface TelegramGetUpdatesInput {
	offset?: number;
	limit?: number;
	timeout?: number;
	allowedUpdates?: string[];
}
export interface TelegramSetWebhookInput {
	url: string;
	secretToken?: string;
	dropPendingUpdates?: boolean;
	allowedUpdates?: string[];
	maxConnections?: number;
}
export interface TelegramDeleteWebhookInput { dropPendingUpdates?: boolean }
export interface TelegramEditMessageTextInput extends TelegramChatInput {
	messageId: number;
	text: string;
	parseMode?: string;
	replyMarkup?: Record<string, unknown>;
}
export interface TelegramForwardMessageInput extends TelegramChatInput {
	fromChatId: string | number;
	messageId: number;
	disableNotification?: boolean;
}
export type TelegramCopyMessageInput = TelegramForwardMessageInput;
export interface TelegramPinChatMessageInput extends TelegramChatInput {
	messageId: number;
	disableNotification?: boolean;
}
export interface TelegramUnpinChatMessageInput extends TelegramChatInput { messageId?: number }
export interface TelegramAnswerCallbackQueryInput {
	callbackQueryId: string;
	text?: string;
	showAlert?: boolean;
	url?: string;
	cacheTime?: number;
}
export interface TelegramGetMyCommandsInput { languageCode?: string }
export interface TelegramSetMyCommandsInput {
	commands: Array<{ command: string; description: string }>;
	languageCode?: string;
}
export interface TelegramDeleteMyCommandsInput { languageCode?: string }
export interface TelegramGetFileInput { fileId: string }

export interface TelegramMediaUpload {
	bytes: Uint8Array;
	filename: string;
	contentType?: string;
}
export type TelegramMedia = string | TelegramMediaUpload;
export interface TelegramSendPhotoInput {
	chatId: string | number;
	photo: TelegramMedia;
	caption?: string;
	parseMode?: string;
	disableNotification?: boolean;
	replyToMessageId?: number;
}
export interface TelegramSendDocumentInput {
	chatId: string | number;
	document: TelegramMedia;
	caption?: string;
	parseMode?: string;
	disableNotification?: boolean;
	replyToMessageId?: number;
}
export interface TelegramDownloadFileInput { filePath: string }
export interface TelegramDownloadFileOutput {
	bytes: Uint8Array;
	byteLength: number;
	filePath: string;
	contentType?: string;
}

/** Telegram method names are path segments; reject anything that could change the request target. */
const METHOD_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/u;

/** Query methods safe for requestRead; getUpdates is intentionally excluded because it consumes queue state. */
export const TELEGRAM_READ_ONLY_METHODS: ReadonlySet<string> = new Set([
	'getMe', 'getChat', 'getChatAdministrators', 'getChatMember', 'getChatMemberCount', 'getChatMenuButton',
	'getFile', 'getUserProfilePhotos', 'getMyCommands', 'getMyDescription', 'getMyShortDescription', 'getMyName',
	'getMyDefaultAdministratorRights', 'getWebhookInfo', 'getForumTopicIconStickers', 'getStickerSet',
	'getCustomEmojiStickers', 'getGameHighScores', 'getBusinessConnection', 'getAvailableGifts',
]);

export function isTelegramReadOnlyMethod(method: string): boolean {
	return TELEGRAM_READ_ONLY_METHODS.has(method);
}

export function validateTelegramMethod(method: string): string {
	if (typeof method !== 'string' || !METHOD_PATTERN.test(method))
		throw new TelegramClientError('INVALID_REQUEST', 'Invalid Telegram API method');
	return method;
}

function invalid(label: string): never {
	throw new TelegramClientError('INVALID_REQUEST', `Invalid Telegram ${label}`);
}

function chatId(value: unknown): value is string | number {
	return (typeof value === 'string' && value.length > 0 && !/[\s\r\n]/u.test(value)) ||
		(typeof value === 'number' && Number.isSafeInteger(value));
}
function positiveInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
}
function optionalString(value: unknown): value is string | undefined {
	return value === undefined || (typeof value === 'string' && value.length > 0 && !/[\r\n]/u.test(value));
}
function record(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function updates(value: unknown): value is string[] | undefined {
	return value === undefined || (Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0));
}

export function validateSendMessageInput(input: TelegramSendMessageInput): TelegramSendMessageInput {
	if (input === null || typeof input !== 'object' || !chatId(input.chatId) || typeof input.text !== 'string' || !input.text.length || input.text.length > 4096)
		invalid('sendMessage request');
	if (!optionalString(input.parseMode) || (input.disableNotification !== undefined && typeof input.disableNotification !== 'boolean') ||
		(input.replyToMessageId !== undefined && !positiveInteger(input.replyToMessageId))) invalid('sendMessage request');
	return input;
}

export function validateTelegramChatInput(input: TelegramChatInput): TelegramChatInput {
	if (input === null || typeof input !== 'object' || !chatId(input.chatId)) invalid('chat request');
	return input;
}
export function validateTelegramChatMemberInput(input: TelegramChatMemberInput): TelegramChatMemberInput {
	validateTelegramChatInput(input);
	if (!positiveInteger(input.userId)) invalid('chat member request');
	return input;
}
export function validateGetUpdatesInput(input: TelegramGetUpdatesInput): TelegramGetUpdatesInput {
	if (input === null || typeof input !== 'object' ||
		(input.offset !== undefined && !Number.isSafeInteger(input.offset)) ||
		(input.limit !== undefined && (!Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 100)) ||
		(input.timeout !== undefined && (!Number.isSafeInteger(input.timeout) || input.timeout < 0 || input.timeout > 50)) ||
		!updates(input.allowedUpdates)) invalid('getUpdates request');
	return input;
}
export function validateSetWebhookInput(input: TelegramSetWebhookInput): TelegramSetWebhookInput {
	if (input === null || typeof input !== 'object' || typeof input.url !== 'string' || !/^https:\/\//u.test(input.url) ||
		(input.secretToken !== undefined && (typeof input.secretToken !== 'string' || !/^[A-Za-z0-9_-]{1,256}$/u.test(input.secretToken))) || (input.dropPendingUpdates !== undefined && typeof input.dropPendingUpdates !== 'boolean') ||
		!updates(input.allowedUpdates) || (input.maxConnections !== undefined && (!Number.isSafeInteger(input.maxConnections) || input.maxConnections < 1 || input.maxConnections > 100)))
		invalid('setWebhook request');
	return input;
}
export function validateDeleteWebhookInput(input: TelegramDeleteWebhookInput): TelegramDeleteWebhookInput {
	if (input === null || typeof input !== 'object' || (input.dropPendingUpdates !== undefined && typeof input.dropPendingUpdates !== 'boolean')) invalid('deleteWebhook request');
	return input;
}
export function validateEditMessageTextInput(input: TelegramEditMessageTextInput): TelegramEditMessageTextInput {
	validateTelegramChatInput(input);
	if (!positiveInteger(input.messageId) || typeof input.text !== 'string' || !input.text.length || input.text.length > 4096 || !optionalString(input.parseMode) ||
		(input.replyMarkup !== undefined && !record(input.replyMarkup))) invalid('editMessageText request');
	return input;
}
export function validateForwardMessageInput(input: TelegramForwardMessageInput): TelegramForwardMessageInput {
	validateTelegramChatInput(input);
	if (!chatId(input.fromChatId) || !positiveInteger(input.messageId) ||
		(input.disableNotification !== undefined && typeof input.disableNotification !== 'boolean')) invalid('message forwarding request');
	return input;
}
export function validatePinChatMessageInput(input: TelegramPinChatMessageInput): TelegramPinChatMessageInput {
	validateTelegramChatInput(input);
	if (!positiveInteger(input.messageId) || (input.disableNotification !== undefined && typeof input.disableNotification !== 'boolean')) invalid('pinChatMessage request');
	return input;
}
export function validateUnpinChatMessageInput(input: TelegramUnpinChatMessageInput): TelegramUnpinChatMessageInput {
	validateTelegramChatInput(input);
	if (input.messageId !== undefined && !positiveInteger(input.messageId)) invalid('unpinChatMessage request');
	return input;
}
export function validateAnswerCallbackQueryInput(input: TelegramAnswerCallbackQueryInput): TelegramAnswerCallbackQueryInput {
	if (input === null || typeof input !== 'object' || typeof input.callbackQueryId !== 'string' || !input.callbackQueryId.length ||
		(input.text !== undefined && (typeof input.text !== 'string' || input.text.length > 200)) || (input.showAlert !== undefined && typeof input.showAlert !== 'boolean') ||
		(input.url !== undefined && typeof input.url !== 'string') || (input.cacheTime !== undefined && (!Number.isSafeInteger(input.cacheTime) || input.cacheTime < 0))) invalid('answerCallbackQuery request');
	return input;
}
export function validateSetMyCommandsInput(input: TelegramSetMyCommandsInput): TelegramSetMyCommandsInput {
	if (input === null || typeof input !== 'object' || !Array.isArray(input.commands) || input.commands.length > 100 ||
		!input.commands.every((command) => record(command) && typeof command.command === 'string' && /^[a-z0-9_]{1,32}$/u.test(command.command) && typeof command.description === 'string' && command.description.length >= 1 && command.description.length <= 256) ||
		!optionalString(input.languageCode)) invalid('setMyCommands request');
	return input;
}
export function validateLanguageInput(input: TelegramGetMyCommandsInput | TelegramDeleteMyCommandsInput): TelegramGetMyCommandsInput | TelegramDeleteMyCommandsInput {
	if (input === null || typeof input !== 'object' || !optionalString(input.languageCode)) invalid('bot command request');
	return input;
}
export function validateGetFileInput(input: TelegramGetFileInput): TelegramGetFileInput {
	if (input === null || typeof input !== 'object' || typeof input.fileId !== 'string' || !input.fileId.length) invalid('getFile request');
	return input;
}

function validateFilename(filename: unknown): filename is string {
	return typeof filename === 'string' && filename.length > 0 && filename.length <= 255 && !/[\\/\u0000-\u001f\u007f]/u.test(filename);
}
function validateMedia(value: unknown, maxBytes: number): value is TelegramMedia {
	if (typeof value === 'string') return value.length > 0 && !/[\s\r\n]/u.test(value) && (!value.includes('://') || /^https:\/\//u.test(value));
	return record(value) && value.bytes instanceof Uint8Array && value.bytes.byteLength > 0 && value.bytes.byteLength <= maxBytes &&
		validateFilename(value.filename) && (value.contentType === undefined || (typeof value.contentType === 'string' && value.contentType.length <= 255 && !/[\r\n]/u.test(value.contentType)));
}
export function validateSendPhotoInput(input: TelegramSendPhotoInput): TelegramSendPhotoInput {
	if (input === null || typeof input !== 'object' || !chatId(input.chatId) || !validateMedia(input.photo, TELEGRAM_MAX_PHOTO_BYTES) ||
		(input.caption !== undefined && (typeof input.caption !== 'string' || input.caption.length > 1024)) || !optionalString(input.parseMode) || (input.disableNotification !== undefined && typeof input.disableNotification !== 'boolean') ||
		(input.replyToMessageId !== undefined && !positiveInteger(input.replyToMessageId))) invalid('sendPhoto request');
	return input;
}
export function validateSendDocumentInput(input: TelegramSendDocumentInput): TelegramSendDocumentInput {
	if (input === null || typeof input !== 'object' || !chatId(input.chatId) || !validateMedia(input.document, TELEGRAM_MAX_FILE_BYTES) ||
		(input.caption !== undefined && (typeof input.caption !== 'string' || input.caption.length > 1024)) || !optionalString(input.parseMode) || (input.disableNotification !== undefined && typeof input.disableNotification !== 'boolean') ||
		(input.replyToMessageId !== undefined && !positiveInteger(input.replyToMessageId))) invalid('sendDocument request');
	return input;
}

/** Validate and normalize a Telegram file path without ever placing the token in an error. */
export function validateTelegramFilePath(filePath: string): string {
	if (typeof filePath !== 'string' || !filePath || filePath.startsWith('/') || filePath.startsWith('//') || /[\\?#]/u.test(filePath) || /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(filePath)) invalid('file path');
	const result: string[] = [];
	for (const raw of filePath.split('/')) {
		if (!raw) invalid('file path');
		let segment = raw;
		for (let depth = 0; depth < 16; depth++) {
			let decoded: string;
			try { decoded = decodeURIComponent(segment); } catch { invalid('file path'); }
			if (decoded === segment) break;
			segment = decoded;
			if (depth === 15) invalid('file path');
		}
		if (segment === '.' || segment === '..' || segment.includes('/') || segment.includes('\\') || !segment) invalid('file path');
		result.push(encodeURIComponent(segment));
	}
	return result.join('/');
}

export function validateDownloadFileInput(input: TelegramDownloadFileInput): TelegramDownloadFileInput {
	if (input === null || typeof input !== 'object') invalid('downloadFile request');
	validateTelegramFilePath(input.filePath);
	return input;
}
