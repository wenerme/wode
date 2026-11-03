export const ApolloServiceErrorCodes = Object.freeze({
	InvalidConfig: 'APOLLO_INVALID_CONFIG',
	InvalidRequest: 'APOLLO_INVALID_REQUEST',
	OperationFailed: 'APOLLO_OPERATION_FAILED',
	PartialFailure: 'APOLLO_PARTIAL_FAILURE',
	PermissionDenied: 'APOLLO_PERMISSION_DENIED',
	Unauthorized: 'APOLLO_UNAUTHORIZED',
	Closed: 'APOLLO_CLOSED',
} as const);

export type ApolloServiceErrorCode = (typeof ApolloServiceErrorCodes)[keyof typeof ApolloServiceErrorCodes];

/** Safe HTTP diagnostics: status, request line without query, and the redacted Apollo error summary. */
export interface ApolloHttpErrorInfo {
	readonly status: number;
	readonly method: string;
	readonly path: string;
	readonly exception?: string;
	readonly detail?: string;
}

export class ApolloServiceError extends Error {
	readonly code: ApolloServiceErrorCode;
	readonly state?: string;
	readonly http?: ApolloHttpErrorInfo;

	constructor(code: ApolloServiceErrorCode, message: string, state?: string, http?: ApolloHttpErrorInfo) {
		super(message);
		this.name = 'ApolloServiceError';
		this.code = code;
		this.state = state;
		if (http) this.http = http;
	}
}
