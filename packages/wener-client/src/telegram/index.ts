import type { FetchLike } from '@wener/utils';
import { TelegramClientError } from './errors';
import { isValidTelegramBotToken, validateSendMessageInput, validateTelegramMethod, type TelegramRequestOptions, type TelegramSendMessageInput } from './operations';

export { TelegramClientError } from './errors';
export { isValidTelegramBotToken } from './operations';
export type { TelegramRequestOptions, TelegramSendMessageInput } from './operations';

export interface TelegramClientOptions {
	botToken: string;
	fetch?: FetchLike;
	timeoutMs?: number;
	maxResponseBytes?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RESPONSE_BYTES = 8 * 1024 * 1024;

function validInteger(value: unknown, fallback: number, name: string, max: number): number {
	const result = value === undefined ? fallback : value;
	if (typeof result !== 'number' || !Number.isSafeInteger(result) || result < 1 || result > max)
		throw new TelegramClientError('INVALID_REQUEST', `Invalid Telegram ${name}`);
	return result;
}

/**
 * Minimal Telegram Bot API HTTP client: getMe, sendMessage and a generic method passthrough.
 * The bot token is a full account-control credential carried in the URL path (not a header);
 * it is never included in any error message, log line, or thrown value produced by this client.
 */
export class TelegramClient {
	readonly type = 'telegram' as const;
	readonly #baseUrl: string;
	readonly #fetch: FetchLike;
	readonly #timeoutMs: number;
	readonly #maxResponseBytes: number;
	readonly #active = new Set<{ abort(): void; done: Promise<void> }>();
	#closed = false;
	#closePromise?: Promise<void>;

	constructor(options: TelegramClientOptions) {
		if (!isValidTelegramBotToken(options.botToken)) throw new TelegramClientError('INVALID_CONFIG', 'Invalid Telegram bot token');
		this.#baseUrl = `https://api.telegram.org/bot${options.botToken}`;
		this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
		if (typeof this.#fetch !== 'function') throw new TelegramClientError('INVALID_CONFIG', 'Invalid Telegram fetch implementation');
		this.#timeoutMs = validInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS, 'timeout', 3_600_000);
		this.#maxResponseBytes = validInteger(options.maxResponseBytes, DEFAULT_MAX_RESPONSE_BYTES, 'response size', 64 * 1024 * 1024);
	}

	async #request(operation: string, method: string, body: unknown, options: TelegramRequestOptions | undefined): Promise<unknown> {
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
		let payload: string | undefined;
		if (body !== undefined) {
			try {
				payload = JSON.stringify(body);
			} catch {
				throw new TelegramClientError('INVALID_REQUEST', 'Telegram request body is not JSON serializable');
			}
			if (new TextEncoder().encode(payload).byteLength > this.#maxResponseBytes)
				throw new TelegramClientError('INVALID_REQUEST', 'Telegram request body is too large');
		}
		try {
			const headers = new Headers({ accept: 'application/json' });
			if (payload !== undefined) headers.set('content-type', 'application/json');
			// Telegram allows a method without a body (e.g. getMe); send an empty JSON object
			// so the server always receives a well-formed POST with JSON content.
			response = await Promise.race([
				this.#fetch(`${this.#baseUrl}/${method}`, { method: 'POST', headers, body: payload ?? '{}', signal: controller.signal }),
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
				throw new TelegramClientError(response.status === 401 || response.status === 403 ? 'AUTH_FAILED' : 'REQUEST_FAILED', `Telegram ${operation} request failed`, response.status);
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

	async sendMessage(input: TelegramSendMessageInput, options?: TelegramRequestOptions): Promise<unknown> {
		const value = validateSendMessageInput(input);
		const body = {
			chat_id: value.chatId,
			text: value.text,
			...(value.parseMode === undefined ? {} : { parse_mode: value.parseMode }),
			...(value.disableNotification === undefined ? {} : { disable_notification: value.disableNotification }),
			...(value.replyToMessageId === undefined ? {} : { reply_to_message_id: value.replyToMessageId }),
		};
		return this.#request('sendMessage', 'sendMessage', body, options);
	}

	async request(method: string, params?: Record<string, unknown>, options?: TelegramRequestOptions): Promise<unknown> {
		const safeMethod = validateTelegramMethod(method);
		return this.#request('api', safeMethod, params, options);
	}

	async close(): Promise<void> {
		if (this.#closePromise) return this.#closePromise;
		this.#closed = true;
		this.#closePromise = Promise.allSettled([...this.#active].map((entry) => { entry.abort(); return entry.done; })).then(() => undefined);
		return this.#closePromise;
	}
}
