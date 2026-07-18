import { FileSystemError } from './FileSystemError';

export function validateReaddirMaxEntries(maxEntries: number | undefined): number | undefined {
	if (maxEntries === undefined) return undefined;
	if (!Number.isSafeInteger(maxEntries) || maxEntries < 0) {
		throw new FileSystemError('maxEntries must be a non-negative safe integer', 'EINVAL');
	}
	return maxEntries;
}

export function assertReaddirEntryLimit(count: number, maxEntries: number | undefined, path: string): void {
	if (maxEntries !== undefined && count > maxEntries) {
		throw new FileSystemError(`Directory has more than ${maxEntries} entries: ${path}`, 'EOVERFLOW');
	}
}
