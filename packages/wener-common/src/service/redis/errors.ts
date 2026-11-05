export const RedisServiceErrorCodes = Object.freeze({
	InvalidConfig: 'INVALID_CONFIG', InvalidRequest: 'INVALID_REQUEST', SecretMissing: 'SECRET_MISSING',
	SecretSchemeUnsupported: 'SECRET_SCHEME_UNSUPPORTED', SecretResolutionFailed: 'SECRET_RESOLUTION_FAILED',
	OperationFailed: 'OPERATION_FAILED', Closed: 'CLOSED',
} as const);
export type RedisServiceErrorCode = (typeof RedisServiceErrorCodes)[keyof typeof RedisServiceErrorCodes];
export class RedisServiceError extends Error {
	readonly code: RedisServiceErrorCode;
	constructor(code: RedisServiceErrorCode, message: string) {
		super(message);
		this.name = 'RedisServiceError';
		this.code = code;
	}
}
export function redisOperationError(operation: string): RedisServiceError {
	return new RedisServiceError(RedisServiceErrorCodes.OperationFailed, `Redis service ${operation} failed`);
}
