/** Fixed, value-free error for Google Analytics client failures. */
export type GoogleAnalyticsClientErrorCode =
	| 'INVALID_CONFIG'
	| 'INVALID_REQUEST'
	| 'AUTH_FAILED'
	| 'REQUEST_FAILED'
	| 'INVALID_RESPONSE'
	| 'RESPONSE_TOO_LARGE'
	| 'TIMEOUT'
	| 'ABORTED'
	| 'CLOSED';

export class GoogleAnalyticsClientError extends Error {
	override readonly name = 'GoogleAnalyticsClientError';
	constructor(
		readonly code: GoogleAnalyticsClientErrorCode,
		message: string,
		readonly status?: number,
	) {
		super(message);
	}
}
