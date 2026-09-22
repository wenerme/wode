export const FileSystemErrorCode = {
	ABORT_ERR: 'ABORT_ERR',
	EBUSY: 'EBUSY',
	ENOENT: 'ENOENT',
	ENOTDIR: 'ENOTDIR',
	EEXIST: 'EEXIST',
	EISDIR: 'EISDIR',
	EIO: 'EIO',
	ELOOP: 'ELOOP',
	ENOTEMPTY: 'ENOTEMPTY',
	ENOSPC: 'ENOSPC',
	EACCES: 'EACCES',
	EPERM: 'EPERM',
	EINVAL: 'EINVAL',
	ENOTSUP: 'ENOTSUP',
	EOVERFLOW: 'EOVERFLOW',
} as const;

export type FileSystemErrorCode = (typeof FileSystemErrorCode)[keyof typeof FileSystemErrorCode];

export type FileSystemErrorDiagnostic = {
	provider: 's3';
	status?: number;
	code?: string;
};

const SAFE_S3_DIAGNOSTIC_CODES = new Set([
	'ABORT_ERR',
	'AccessDenied',
	'EAI_AGAIN',
	'ECONNREFUSED',
	'ENOTFOUND',
	'ETIMEDOUT',
	'InternalError',
	'InvalidAccessKeyId',
	'InvalidRange',
	'NoSuchBucket',
	'NoSuchKey',
	'NotFound',
	'RequestTimeout',
	'ServiceUnavailable',
	'SlowDown',
]);

/** Keep only a small, known-safe diagnostic projection at RPC and HTTP boundaries. */
export function safeFileSystemErrorDiagnostic(value: unknown): FileSystemErrorDiagnostic | undefined {
	if (!value || typeof value !== 'object' || !('provider' in value) || value.provider !== 's3') return undefined;
	const status =
		'status' in value &&
		typeof value.status === 'number' &&
		Number.isInteger(value.status) &&
		value.status >= 100 &&
		value.status <= 599
			? value.status
			: undefined;
	const code =
		'code' in value && typeof value.code === 'string' && SAFE_S3_DIAGNOSTIC_CODES.has(value.code)
			? value.code
			: undefined;
	return Object.freeze({
		provider: 's3',
		...(status === undefined ? {} : { status }),
		...(code === undefined ? {} : { code }),
	});
}

/** Unknown error codes are normalized before crossing a process boundary. */
export function safeFileSystemErrorCode(value: unknown): FileSystemErrorCode {
	return typeof value === 'string' && Object.hasOwn(FileSystemErrorCode, value)
		? (value as FileSystemErrorCode)
		: FileSystemErrorCode.EIO;
}

export class FileSystemError extends Error {
	constructor(
		message: string,
		public readonly code: FileSystemErrorCode | string,
	) {
		super(message);
		this.name = 'FileSystemError';
		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, FileSystemError);
		}
	}
}
