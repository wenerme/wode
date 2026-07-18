import { FileSystemError } from './FileSystemError';

export function validateReadFileMaxBytes(maxBytes: number | undefined): number | undefined {
	if (maxBytes === undefined) return undefined;
	if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
		throw new FileSystemError('maxBytes must be a non-negative safe integer', 'EINVAL');
	}
	return maxBytes;
}

export function rejectUnsupportedFileSystemLimit(
	operation: 'readFile' | 'readdir',
	limit: 'maxBytes' | 'maxEntries',
	value: number | undefined,
): void {
	if (value !== undefined) {
		throw new FileSystemError(`${operation} does not support bounded ${limit}`, 'ENOTSUP');
	}
}

export function throwIfFileSystemAborted(signal?: AbortSignal): void {
	if (signal?.aborted) throw new FileSystemError('Operation aborted', 'ABORT_ERR');
}
