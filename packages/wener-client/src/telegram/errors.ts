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

	constructor(code: TelegramClientErrorCode, message: string, status?: number) {
		super(message);
		this.name = 'TelegramClientError';
		this.code = code;
		this.status = status;
	}
}
