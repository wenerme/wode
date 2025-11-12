
export const FileSystemErrorCode = {
	ENOENT: 'ENOENT',
	ENOTDIR: 'ENOTDIR',
	EEXIST: 'EEXIST',
	EISDIR: 'EISDIR',
	ENOTEMPTY: 'ENOTEMPTY',
	EACCES: 'EACCES',
	EPERM: 'EPERM',
	EINVAL: 'EINVAL',
} as const;

export type FileSystemErrorCode = typeof FileSystemErrorCode[keyof typeof FileSystemErrorCode];

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
