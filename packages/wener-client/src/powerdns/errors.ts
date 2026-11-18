export type PowerDnsClientErrorCode =
	| 'INVALID_CONFIG'
	| 'INVALID_REQUEST'
	| 'INVALID_RESPONSE'
	| 'AUTH_FAILED'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'REQUEST_FAILED'
	| 'TIMEOUT'
	| 'ABORTED'
	| 'CLOSED'
	| 'RESPONSE_TOO_LARGE';

/** Errors never contain the API key, request headers or text copied from a PowerDNS response. */
export class PowerDnsClientError extends Error {
	readonly code: PowerDnsClientErrorCode;
	readonly status?: number;

	constructor(code: PowerDnsClientErrorCode, message: string, status?: number) {
		super(message);
		this.name = 'PowerDnsClientError';
		this.code = code;
		this.status = status;
	}
}
