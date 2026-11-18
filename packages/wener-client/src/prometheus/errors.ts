export type PrometheusClientErrorCode =
	| 'INVALID_CONFIG'
	| 'INVALID_REQUEST'
	| 'INVALID_RESPONSE'
	| 'AUTH_FAILED'
	| 'REQUEST_FAILED'
	| 'TIMEOUT'
	| 'ABORTED'
	| 'CLOSED'
	| 'RESPONSE_TOO_LARGE';

/** Errors deliberately contain no text copied from a Prometheus response. */
export class PrometheusClientError extends Error {
	readonly code: PrometheusClientErrorCode;
	readonly status?: number;

	constructor(code: PrometheusClientErrorCode, message: string, status?: number) {
		super(message);
		this.name = 'PrometheusClientError';
		this.code = code;
		this.status = status;
	}
}
