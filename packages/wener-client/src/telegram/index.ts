import type { FetchLike } from '@wener/utils';
import { TelegramClientError } from './errors';
import {
	TELEGRAM_MAX_FILE_BYTES, TELEGRAM_MAX_PHOTO_BYTES, isValidTelegramBotToken, validateAnswerCallbackQueryInput,
	validateDeleteWebhookInput, validateDownloadFileInput, validateEditMessageTextInput, validateForwardMessageInput,
	validateGetFileInput, validateGetUpdatesInput, validateLanguageInput, validatePinChatMessageInput,
	validateSendDocumentInput, validateSendMessageInput, validateSendPhotoInput, validateSetMyCommandsInput,
	validateSetWebhookInput, validateTelegramChatInput, validateTelegramChatMemberInput, validateTelegramFilePath,
	validateTelegramMethod, validateUnpinChatMessageInput, isTelegramReadOnlyMethod, type TelegramAnswerCallbackQueryInput, type TelegramChatInput,
	type TelegramChatMemberInput, type TelegramCopyMessageInput, type TelegramDeleteMyCommandsInput, type TelegramDeleteWebhookInput,
	type TelegramDownloadFileInput, type TelegramDownloadFileOutput, type TelegramEditMessageTextInput, type TelegramForwardMessageInput,
	type TelegramGetFileInput, type TelegramGetMyCommandsInput, type TelegramGetUpdatesInput, type TelegramMedia, type TelegramPinChatMessageInput, type TelegramRequestOptions, type TelegramSendDocumentInput,
	type TelegramSendMessageInput, type TelegramSendPhotoInput, type TelegramSetMyCommandsInput, type TelegramSetWebhookInput,
	type TelegramUnpinChatMessageInput,
} from './operations';

export { TelegramClientError } from './errors';
export {
	TELEGRAM_MAX_FILE_BYTES, TELEGRAM_MAX_PHOTO_BYTES, TELEGRAM_READ_ONLY_METHODS, isTelegramReadOnlyMethod, isValidTelegramBotToken, validateTelegramFilePath,
} from './operations';
export type {
	TelegramAnswerCallbackQueryInput, TelegramChatInput, TelegramChatMemberInput, TelegramCopyMessageInput,
	TelegramDeleteMyCommandsInput, TelegramDeleteWebhookInput, TelegramDownloadFileInput, TelegramDownloadFileOutput,
	TelegramEditMessageTextInput, TelegramForwardMessageInput, TelegramGetFileInput, TelegramGetMyCommandsInput,
	TelegramGetUpdatesInput, TelegramMedia, TelegramMediaUpload, TelegramPinChatMessageInput, TelegramRequestOptions, TelegramSendDocumentInput,
	TelegramSendMessageInput, TelegramSendPhotoInput, TelegramSetMyCommandsInput, TelegramSetWebhookInput,
	TelegramUnpinChatMessageInput,
} from './operations';

export interface TelegramClientOptions {
	botToken: string;
	fetch?: FetchLike;
	timeoutMs?: number;
	maxResponseBytes?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RESPONSE_BYTES = 8 * 1024 * 1024;

/** A host fetch may settle after its request was aborted; release that otherwise-unowned body. */
function discardResponse(response: Response): void {
	try {
		const pending = response.body?.cancel();
		if (pending) void pending.catch(() => undefined);
	} catch { /* cleanup must preserve the original cancellation and remain bounded */ }
}

function validInteger(value: unknown, fallback: number, name: string, max: number): number {
	const result = value === undefined ? fallback : value;
	if (typeof result !== 'number' || !Number.isSafeInteger(result) || result < 1 || result > max)
		throw new TelegramClientError('INVALID_REQUEST', `Invalid Telegram ${name}`);
	return result;
}

/**
 * Telegram Bot API HTTP client with typed common operations and a generic method passthrough.
 * The bot token is a full account-control credential carried in the URL path (not a header);
 * it is never included in any error message, log line, or thrown value produced by this client.
 */
export class TelegramClient {
	readonly type = 'telegram' as const;
	readonly #baseUrl: string;
	readonly #fileBaseUrl: string;
	readonly #fetch: FetchLike;
	readonly #timeoutMs: number;
	readonly #maxResponseBytes: number;
	readonly #active = new Set<{ abort(): void; done: Promise<void> }>();
	#closed = false;
	#closePromise?: Promise<void>;

	constructor(options: TelegramClientOptions) {
		if (!isValidTelegramBotToken(options.botToken)) throw new TelegramClientError('INVALID_CONFIG', 'Invalid Telegram bot token');
		this.#baseUrl = `https://api.telegram.org/bot${options.botToken}`;
		this.#fileBaseUrl = `https://api.telegram.org/file/bot${options.botToken}`;
		this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
		if (typeof this.#fetch !== 'function') throw new TelegramClientError('INVALID_CONFIG', 'Invalid Telegram fetch implementation');
		this.#timeoutMs = validInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS, 'timeout', 3_600_000);
		this.#maxResponseBytes = validInteger(options.maxResponseBytes, DEFAULT_MAX_RESPONSE_BYTES, 'response size', 64 * 1024 * 1024);
	}

	async #download(path: string, options: TelegramRequestOptions | undefined): Promise<TelegramDownloadFileOutput> {
		if (this.#closed) throw new TelegramClientError('CLOSED', 'Telegram client is closed');
		if (options?.signal?.aborted) throw new TelegramClientError('ABORTED', 'Telegram request was aborted');
		const timeoutMs = Math.min(this.#timeoutMs, validInteger(options?.timeoutMs, this.#timeoutMs, 'timeout', 3_600_000));
		const controller = new AbortController();
		let response: Response | undefined;
		let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
		let cancellationStarted = false;
		let rejectAbort!: (reason: TelegramClientError) => void;
		const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
		void aborted.catch(() => undefined);
		let finished = false;
		const stop = (code: 'ABORTED' | 'TIMEOUT' | 'CLOSED') => {
			if (finished || controller.signal.aborted) return;
			const error = new TelegramClientError(code, code === 'TIMEOUT' ? 'Telegram download timed out' : code === 'CLOSED' ? 'Telegram client is closed' : 'Telegram download was aborted');
			controller.abort(error);
			if (!cancellationStarted) {
				cancellationStarted = true;
				try {
					const pending = reader ? reader.cancel() : response?.body?.cancel();
					if (pending) void pending.catch(() => undefined);
				} catch { /* fixed cancellation error wins */ }
			}
			rejectAbort(error);
		};
		const active = { abort: () => stop('CLOSED'), done: Promise.resolve() };
		let finish!: () => void;
		active.done = new Promise<void>((resolve) => { finish = resolve; });
		this.#active.add(active);
		const callerAbort = () => stop('ABORTED');
		options?.signal?.addEventListener('abort', callerAbort, { once: true });
		const timer = setTimeout(() => stop('TIMEOUT'), timeoutMs);
		try {
			const request = Promise.resolve(this.#fetch(`${this.#fileBaseUrl}/${path}`, { method: 'GET', redirect: 'error', signal: controller.signal }))
				.then((value) => {
					response = value;
					if (finished || controller.signal.aborted) discardResponse(value);
					return value;
				});
			response = await Promise.race([
				request,
				aborted,
			]);
			const contentLength = response.headers.get('content-length');
			if (contentLength !== null && /^\d+$/u.test(contentLength) && Number(contentLength) > TELEGRAM_MAX_FILE_BYTES)
				throw new TelegramClientError('RESPONSE_TOO_LARGE', 'Telegram file is too large');
			reader = response.body?.getReader();
			const chunks: Uint8Array[] = [];
			let size = 0;
			if (reader) {
				let complete = false;
				try {
					while (true) {
						const chunk = await Promise.race([reader.read(), aborted]);
						if (chunk.done) break;
						size += chunk.value.byteLength;
						if (size > TELEGRAM_MAX_FILE_BYTES) throw new TelegramClientError('RESPONSE_TOO_LARGE', 'Telegram file is too large');
						chunks.push(chunk.value);
					}
					complete = true;
				} finally {
					if (!complete && !cancellationStarted) {
						cancellationStarted = true;
						try {
							const pending = reader.cancel();
							if (pending) void pending.catch(() => undefined);
						} catch { /* fixed cancellation error wins */ }
					}
					reader.releaseLock();
				}
			} else {
				const bytes = new Uint8Array(await Promise.race([response.arrayBuffer(), aborted]));
				size = bytes.byteLength;
				if (size > TELEGRAM_MAX_FILE_BYTES) throw new TelegramClientError('RESPONSE_TOO_LARGE', 'Telegram file is too large');
				chunks.push(bytes);
			}
			if (!response.ok) throw new TelegramClientError(response.status === 401 || response.status === 403 ? 'AUTH_FAILED' : 'REQUEST_FAILED', 'Telegram file download failed', response.status);
			const bytes = new Uint8Array(size);
			let offset = 0;
			for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
			const contentType = response.headers.get('content-type') ?? undefined;
			return { bytes, byteLength: bytes.byteLength, filePath: decodeURIComponent(path), ...(contentType ? { contentType } : {}) };
		} catch (error) {
			if (!cancellationStarted) {
				cancellationStarted = true;
				try {
					const pending = reader ? reader.cancel() : response?.body?.cancel();
					if (pending) void pending.catch(() => undefined);
				} catch { /* fixed cancellation error wins */ }
			}
			if (controller.signal.aborted && controller.signal.reason instanceof TelegramClientError) throw controller.signal.reason;
			if (error instanceof TelegramClientError) throw error;
			throw new TelegramClientError('REQUEST_FAILED', 'Telegram file download failed');
		} finally {
			finished = true;
			clearTimeout(timer);
			options?.signal?.removeEventListener('abort', callerAbort);
			this.#active.delete(active);
			finish();
		}
	}

	async #request(operation: string, method: string, body: unknown, options: TelegramRequestOptions | undefined): Promise<unknown> {
		if (this.#closed) throw new TelegramClientError('CLOSED', 'Telegram client is closed');
		if (options?.signal?.aborted) throw new TelegramClientError('ABORTED', 'Telegram request was aborted');
		const timeoutMs = Math.min(this.#timeoutMs, validInteger(options?.timeoutMs, this.#timeoutMs, 'timeout', 3_600_000));
		let payload: string | FormData | undefined;
		if (body !== undefined) {
			try {
				payload = typeof FormData !== 'undefined' && body instanceof FormData ? body : JSON.stringify(body);
			} catch {
				throw new TelegramClientError('INVALID_REQUEST', 'Telegram request body is not JSON serializable');
			}
			if (typeof payload === 'string' && new TextEncoder().encode(payload).byteLength > this.#maxResponseBytes)
				throw new TelegramClientError('INVALID_REQUEST', 'Telegram request body is too large');
		}
		const controller = new AbortController();
		let response: Response | undefined;
		let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
		let cancellationStarted = false;
		let rejectAbort!: (reason: TelegramClientError) => void;
		const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
		void aborted.catch(() => undefined);
		let finished = false;
		const stop = (code: 'ABORTED' | 'TIMEOUT' | 'CLOSED') => {
			if (finished || controller.signal.aborted) return;
			const error = new TelegramClientError(code, code === 'TIMEOUT' ? 'Telegram request timed out' : code === 'CLOSED' ? 'Telegram client is closed' : 'Telegram request was aborted');
			controller.abort(error);
			if (!cancellationStarted) {
				cancellationStarted = true;
				try {
					const pending = reader ? reader.cancel() : response?.body?.cancel();
					if (pending) void pending.catch(() => undefined);
				} catch { /* transport cleanup must not replace the fixed request error */ }
			}
			rejectAbort(error);
		};
		const active = { abort: () => stop('CLOSED'), done: Promise.resolve() };
		let finish!: () => void;
		active.done = new Promise<void>((resolve) => { finish = resolve; });
		this.#active.add(active);
		const callerAbort = () => stop('ABORTED');
		options?.signal?.addEventListener('abort', callerAbort, { once: true });
		const timer = setTimeout(() => stop('TIMEOUT'), timeoutMs);
		try {
			const headers = new Headers({ accept: 'application/json' });
			if (typeof payload === 'string') headers.set('content-type', 'application/json');
			// Telegram allows a method without a body (e.g. getMe); send an empty JSON object
			// so the server always receives a well-formed POST with JSON content.
			const request = Promise.resolve(this.#fetch(`${this.#baseUrl}/${method}`, { method: 'POST', headers, body: (payload ?? '{}') as BodyInit, redirect: 'error', signal: controller.signal }))
				.then((value) => {
					response = value;
					if (finished || controller.signal.aborted) discardResponse(value);
					return value;
				});
			response = await Promise.race([
				request,
				aborted,
			]);
			const contentLength = response.headers.get('content-length');
			if (contentLength !== null && /^\d+$/u.test(contentLength) && Number(contentLength) > this.#maxResponseBytes)
				throw new TelegramClientError('RESPONSE_TOO_LARGE', 'Telegram response is too large');
			reader = response.body?.getReader();
			const chunks: Uint8Array[] = [];
			let size = 0;
			if (reader) {
				let complete = false;
				try {
					while (true) {
						const chunk = await Promise.race([reader.read(), aborted]);
						if (chunk.done) break;
						size += chunk.value.byteLength;
						if (size > this.#maxResponseBytes) throw new TelegramClientError('RESPONSE_TOO_LARGE', 'Telegram response is too large');
						chunks.push(chunk.value);
					}
					complete = true;
				} finally {
					if (!complete && !cancellationStarted) {
						cancellationStarted = true;
						try {
							const pending = reader.cancel();
							if (pending) void pending.catch(() => undefined);
						} catch { /* transport cleanup must not replace the fixed request error */ }
					}
					reader.releaseLock();
				}
			} else {
				const text = await Promise.race([response.text(), aborted]);
				size = new TextEncoder().encode(text).byteLength;
				if (size > this.#maxResponseBytes) throw new TelegramClientError('RESPONSE_TOO_LARGE', 'Telegram response is too large');
				chunks.push(new TextEncoder().encode(text));
			}
			const bytes = new Uint8Array(size);
			let offset = 0;
			for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
			const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
			const contentType = response.headers.get('content-type') ?? '';
			let data: unknown = text;
			if (text && contentType.includes('json')) {
				try {
					data = JSON.parse(text);
				} catch {
					throw new TelegramClientError('INVALID_RESPONSE', 'Telegram returned invalid JSON');
				}
			} else if (!text) {
				data = undefined;
			}
			if (!response.ok || (data !== null && typeof data === 'object' && (data as { ok?: boolean }).ok === false)) {
				const details = data !== null && typeof data === 'object' ? data as { error_code?: unknown; parameters?: { retry_after?: unknown } } : {};
				const apiCode = typeof details.error_code === 'number' ? details.error_code : undefined;
				const retryAfter = typeof details.parameters?.retry_after === 'number' ? details.parameters.retry_after : undefined;
				throw new TelegramClientError(response.status === 401 || response.status === 403 ? 'AUTH_FAILED' : 'REQUEST_FAILED', `Telegram ${operation} request failed`, response.status, apiCode, retryAfter);
			}
			return (data !== null && typeof data === 'object' && 'result' in (data as Record<string, unknown>)) ? (data as { result: unknown }).result : data;
		} catch (error) {
			if (!cancellationStarted) {
				cancellationStarted = true;
				try {
					const pending = reader ? reader.cancel() : response?.body?.cancel();
					if (pending) void pending.catch(() => undefined);
				} catch { /* transport cleanup must not replace the fixed request error */ }
			}
			if (controller.signal.aborted && controller.signal.reason instanceof TelegramClientError) throw controller.signal.reason;
			if (error instanceof TelegramClientError) throw error;
			throw new TelegramClientError('REQUEST_FAILED', `Telegram ${operation} request failed`);
		} finally {
			finished = true;
			clearTimeout(timer);
			options?.signal?.removeEventListener('abort', callerAbort);
			this.#active.delete(active);
			finish();
		}
	}

	async getMe(options?: TelegramRequestOptions): Promise<unknown> {
		return this.#request('getMe', 'getMe', undefined, options);
	}
	async whoami(options?: TelegramRequestOptions): Promise<unknown> { return this.getMe(options); }

	async sendMessage(input: TelegramSendMessageInput, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateSendMessageInput(input);
		return this.#request('sendMessage', 'sendMessage', {
			chat_id: value.chatId, text: value.text,
			...(value.parseMode === undefined ? {} : { parse_mode: value.parseMode }),
			...(value.disableNotification === undefined ? {} : { disable_notification: value.disableNotification }),
			...(value.replyToMessageId === undefined ? {} : { reply_to_message_id: value.replyToMessageId }),
		}, options);
	}

	async getChat(input: TelegramChatInput, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateTelegramChatInput(input);
		return this.#request('getChat', 'getChat', { chat_id: value.chatId }, options);
	}
	async getChatMember(input: TelegramChatMemberInput, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateTelegramChatMemberInput(input);
		return this.#request('getChatMember', 'getChatMember', { chat_id: value.chatId, user_id: value.userId }, options);
	}
	async getChatAdministrators(input: TelegramChatInput, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateTelegramChatInput(input);
		return this.#request('getChatAdministrators', 'getChatAdministrators', { chat_id: value.chatId }, options);
	}
	async getChatMemberCount(input: TelegramChatInput, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateTelegramChatInput(input);
		return this.#request('getChatMemberCount', 'getChatMemberCount', { chat_id: value.chatId }, options);
	}
	async getUpdates(input: TelegramGetUpdatesInput = {}, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateGetUpdatesInput(input);
		return this.#request('getUpdates', 'getUpdates', {
			...(value.offset === undefined ? {} : { offset: value.offset }),
			...(value.limit === undefined ? {} : { limit: value.limit }),
			...(value.timeout === undefined ? {} : { timeout: value.timeout }),
			...(value.allowedUpdates === undefined ? {} : { allowed_updates: value.allowedUpdates }),
		}, options);
	}
	async getWebhookInfo(options?: TelegramRequestOptions): Promise<unknown> {
		return this.#request('getWebhookInfo', 'getWebhookInfo', {}, options);
	}
	async setWebhook(input: TelegramSetWebhookInput, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateSetWebhookInput(input);
		return this.#request('setWebhook', 'setWebhook', {
			url: value.url,
			...(value.secretToken === undefined ? {} : { secret_token: value.secretToken }),
			...(value.dropPendingUpdates === undefined ? {} : { drop_pending_updates: value.dropPendingUpdates }),
			...(value.allowedUpdates === undefined ? {} : { allowed_updates: value.allowedUpdates }),
			...(value.maxConnections === undefined ? {} : { max_connections: value.maxConnections }),
		}, options);
	}
	async deleteWebhook(input: TelegramDeleteWebhookInput = {}, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateDeleteWebhookInput(input);
		return this.#request('deleteWebhook', 'deleteWebhook', value.dropPendingUpdates === undefined ? {} : { drop_pending_updates: value.dropPendingUpdates }, options);
	}
	async editMessageText(input: TelegramEditMessageTextInput, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateEditMessageTextInput(input);
		return this.#request('editMessageText', 'editMessageText', {
			chat_id: value.chatId, message_id: value.messageId, text: value.text,
			...(value.parseMode === undefined ? {} : { parse_mode: value.parseMode }),
			...(value.replyMarkup === undefined ? {} : { reply_markup: value.replyMarkup }),
		}, options);
	}
	async deleteMessage(input: TelegramChatInput & { messageId: number }, options?: TelegramRequestOptions): Promise<unknown> {
		validateTelegramChatInput(input);
		if (!Number.isSafeInteger(input.messageId) || input.messageId < 1) throw new TelegramClientError('INVALID_REQUEST', 'Invalid Telegram message id');
		return this.#request('deleteMessage', 'deleteMessage', { chat_id: input.chatId, message_id: input.messageId }, options);
	}
	async forwardMessage(input: TelegramForwardMessageInput, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateForwardMessageInput(input);
		return this.#request('forwardMessage', 'forwardMessage', { chat_id: value.chatId, from_chat_id: value.fromChatId, message_id: value.messageId, ...(value.disableNotification === undefined ? {} : { disable_notification: value.disableNotification }) }, options);
	}
	async copyMessage(input: TelegramCopyMessageInput, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateForwardMessageInput(input);
		return this.#request('copyMessage', 'copyMessage', { chat_id: value.chatId, from_chat_id: value.fromChatId, message_id: value.messageId, ...(value.disableNotification === undefined ? {} : { disable_notification: value.disableNotification }) }, options);
	}
	async pinChatMessage(input: TelegramPinChatMessageInput, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validatePinChatMessageInput(input);
		return this.#request('pinChatMessage', 'pinChatMessage', { chat_id: value.chatId, message_id: value.messageId, ...(value.disableNotification === undefined ? {} : { disable_notification: value.disableNotification }) }, options);
	}
	async unpinChatMessage(input: TelegramUnpinChatMessageInput, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateUnpinChatMessageInput(input);
		return this.#request('unpinChatMessage', 'unpinChatMessage', { chat_id: value.chatId, ...(value.messageId === undefined ? {} : { message_id: value.messageId }) }, options);
	}
	async answerCallbackQuery(input: TelegramAnswerCallbackQueryInput, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateAnswerCallbackQueryInput(input);
		return this.#request('answerCallbackQuery', 'answerCallbackQuery', { callback_query_id: value.callbackQueryId, ...(value.text === undefined ? {} : { text: value.text }), ...(value.showAlert === undefined ? {} : { show_alert: value.showAlert }), ...(value.url === undefined ? {} : { url: value.url }), ...(value.cacheTime === undefined ? {} : { cache_time: value.cacheTime }) }, options);
	}
	async getMyCommands(input: TelegramGetMyCommandsInput = {}, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateLanguageInput(input);
		return this.#request('getMyCommands', 'getMyCommands', value.languageCode === undefined ? {} : { language_code: value.languageCode }, options);
	}
	async setMyCommands(input: TelegramSetMyCommandsInput, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateSetMyCommandsInput(input);
		return this.#request('setMyCommands', 'setMyCommands', { commands: value.commands, ...(value.languageCode === undefined ? {} : { language_code: value.languageCode }) }, options);
	}
	async deleteMyCommands(input: TelegramDeleteMyCommandsInput = {}, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateLanguageInput(input);
		return this.#request('deleteMyCommands', 'deleteMyCommands', value.languageCode === undefined ? {} : { language_code: value.languageCode }, options);
	}
	async getFile(input: TelegramGetFileInput, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateGetFileInput(input);
		return this.#request('getFile', 'getFile', { file_id: value.fileId }, options);
	}

	async #sendMedia(operation: string, method: string, field: 'photo' | 'document', input: TelegramSendPhotoInput | TelegramSendDocumentInput, options?: TelegramRequestOptions): Promise<unknown> {
		const value = field === 'photo' ? validateSendPhotoInput(input as TelegramSendPhotoInput) : validateSendDocumentInput(input as TelegramSendDocumentInput);
		const media = field === 'photo' ? (value as TelegramSendPhotoInput).photo : (value as TelegramSendDocumentInput).document;
		if (typeof media === 'string') {
			return this.#request(operation, method, {
				chat_id: value.chatId, [field]: media,
				...(value.caption === undefined ? {} : { caption: value.caption }),
				...(value.parseMode === undefined ? {} : { parse_mode: value.parseMode }),
				...(value.disableNotification === undefined ? {} : { disable_notification: value.disableNotification }),
				...(value.replyToMessageId === undefined ? {} : { reply_to_message_id: value.replyToMessageId }),
			}, options);
		}
		const form = new FormData();
		form.append('chat_id', String(value.chatId));
		form.append(field, new Blob([media.bytes.buffer.slice(media.bytes.byteOffset, media.bytes.byteOffset + media.bytes.byteLength) as ArrayBuffer], { type: media.contentType ?? 'application/octet-stream' }), media.filename);
		if (value.caption !== undefined) form.append('caption', value.caption);
		if (value.parseMode !== undefined) form.append('parse_mode', value.parseMode);
		if (value.disableNotification !== undefined) form.append('disable_notification', String(value.disableNotification));
		if (value.replyToMessageId !== undefined) form.append('reply_to_message_id', String(value.replyToMessageId));
		return this.#request(operation, method, form, options);
	}
	async sendPhoto(input: TelegramSendPhotoInput, options?: TelegramRequestOptions): Promise<unknown> { return this.#sendMedia('sendPhoto', 'sendPhoto', 'photo', input, options); }
	async sendDocument(input: TelegramSendDocumentInput, options?: TelegramRequestOptions): Promise<unknown> { return this.#sendMedia('sendDocument', 'sendDocument', 'document', input, options); }

	async request(method: string, params?: Record<string, unknown>, options?: TelegramRequestOptions): Promise<unknown> {
		const safeMethod = validateTelegramMethod(method);
		return this.#request('api', safeMethod, params, options);
	}
	async requestRead(method: string, params?: Record<string, unknown>, options?: TelegramRequestOptions): Promise<unknown> {
		const safeMethod = validateTelegramMethod(method);
		if (!isTelegramReadOnlyMethod(safeMethod)) throw new TelegramClientError('INVALID_REQUEST', 'Telegram method is not read-only');
		return this.#request('api', safeMethod, params, options);
	}
	async downloadFile(input: TelegramDownloadFileInput, options?: TelegramRequestOptions): Promise<TelegramDownloadFileOutput> {
		const value = validateDownloadFileInput(input);
		const path = validateTelegramFilePath(value.filePath);
		const result = await this.#download(path, options);
		return { ...result, filePath: value.filePath };
	}

	async close(): Promise<void> {
		if (this.#closePromise) return this.#closePromise;
		this.#closed = true;
		this.#closePromise = Promise.allSettled([...this.#active].map((entry) => { entry.abort(); return entry.done; })).then(() => undefined);
		return this.#closePromise;
	}
}
