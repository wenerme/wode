export type TelegramClientErrorCode =
	| 'INVALID_CONFIG'
	| 'INVALID_REQUEST'
	| 'INVALID_RESPONSE'
	| 'AUTH_FAILED'
	| 'REQUEST_FAILED'
	| 'TIMEOUT'
	| 'ABORTED'
	| 'CLOSED'
	| 'RESPONSE_TOO_LARGE';

/**
 * Errors deliberately contain no text copied from a Telegram response, and never embed the
 * bot token: the token lives in the request URL path, so any error text built from the URL
 * must be avoided entirely rather than sanitized after the fact.
 */
export class TelegramClientError extends Error {
	readonly code: TelegramClientErrorCode;
	readonly status?: number;
	/** Numeric Telegram error details are safe to retain; response descriptions are deliberately omitted. */
	readonly apiCode?: number;
	readonly retryAfter?: number;

	constructor(code: TelegramClientErrorCode, message: string, status?: number, apiCode?: number, retryAfter?: number) {
		super(message);
		this.name = 'TelegramClientError';
		this.code = code;
		this.status = status;
		this.apiCode = apiCode;
		this.retryAfter = retryAfter;
	}
}
