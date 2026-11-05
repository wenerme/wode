export type GrafanaClientErrorCode =
	| 'INVALID_CONFIG'
	| 'INVALID_REQUEST'
	| 'INVALID_RESPONSE'
	| 'AUTH_FAILED'
	| 'REQUEST_FAILED'
	| 'TIMEOUT'
	| 'ABORTED'
	| 'CLOSED'
	| 'RESPONSE_TOO_LARGE';

/** Errors deliberately contain no text copied from a Grafana response. */
export class GrafanaClientError extends Error {
	readonly code: GrafanaClientErrorCode;
	readonly status?: number;

	constructor(code: GrafanaClientErrorCode, message: string, status?: number) {
		super(message);
		this.name = 'GrafanaClientError';
		this.code = code;
		this.status = status;
	}
}
