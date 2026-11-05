export const LinearServiceErrorCodes = Object.freeze({
	InvalidConfig: 'LINEAR_INVALID_CONFIG',
	InvalidRequest: 'LINEAR_INVALID_REQUEST',
	ReadOnly: 'LINEAR_READ_ONLY',
	Closed: 'LINEAR_CLOSED',
	RateLimited: 'LINEAR_RATE_LIMITED',
	OperationFailed: 'LINEAR_OPERATION_FAILED',
} as const);

export type LinearServiceErrorCode = (typeof LinearServiceErrorCodes)[keyof typeof LinearServiceErrorCodes];

export class LinearServiceError extends Error {
	readonly code: LinearServiceErrorCode;
	constructor(code: LinearServiceErrorCode, message: string) {
		super(message);
		this.name = 'LinearServiceError';
		this.code = code;
	}
}
