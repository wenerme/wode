import { createWebFileSystem } from './createWebFileSystem';
import { FileSystemError } from './FileSystemError';
import type { IFileSystem } from './IFileSystem';

export type CreateOpfsFileSystemOptions = {
	path?: string | readonly string[];
};

type NavigatorWithOpfs = Navigator & {
	storage?: StorageManager & {
		getDirectory?: () => Promise<FileSystemDirectoryHandle>;
	};
};

type GlobalWithOpfs = typeof globalThis & { navigator?: NavigatorWithOpfs };

export function isOpfsFileSystemSupported(): boolean {
	return typeof (globalThis as GlobalWithOpfs).navigator?.storage?.getDirectory === 'function';
}

export async function createOpfsFileSystem(options: CreateOpfsFileSystemOptions = {}): Promise<IFileSystem> {
	const storage = (globalThis as GlobalWithOpfs).navigator?.storage;
	const getDirectory = storage?.getDirectory;
	if (typeof getDirectory !== 'function') {
		throw new FileSystemError('Origin private file system is not supported', 'ENOTSUP');
	}

	const segments = parseNamespacePath(options.path);
	let root = await getDirectory.call(storage);
	for (const segment of segments) {
		root = await root.getDirectoryHandle(segment, { create: true });
	}
	return createWebFileSystem({ root });
}

function parseNamespacePath(path: string | readonly string[] | undefined): string[] {
	if (path === undefined) return [];
	const segments = typeof path === 'string' ? path.split('/') : [...path];
	if (segments.length === 0) return [];

	for (const segment of segments) {
		if (
			typeof segment !== 'string' ||
			segment.length === 0 ||
			segment.trim().length === 0 ||
			segment === '.' ||
			segment === '..' ||
			segment.includes('/') ||
			segment.includes('\\') ||
			segment.includes('\0')
		) {
			throw new FileSystemError(`Invalid OPFS path segment: ${String(segment)}`, 'EINVAL');
		}
	}
	return segments;
}
