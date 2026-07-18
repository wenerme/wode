import { createWebFileSystem } from './createWebFileSystem';
import { FileSystemError } from './FileSystemError';
import type { IFileSystem } from './IFileSystem';

export type PickDirectoryFileSystemOptions = {
	id?: string;
	mode?: 'read' | 'readwrite';
	startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
};

export type PickDirectoryFileSystemResult = {
	fileSystem: IFileSystem;
	handle: FileSystemDirectoryHandle;
};

type GlobalWithDirectoryPicker = typeof globalThis & {
	showDirectoryPicker?: (options?: PickDirectoryFileSystemOptions) => Promise<FileSystemDirectoryHandle>;
};

export function isDirectoryPickerFileSystemSupported(): boolean {
	return typeof (globalThis as GlobalWithDirectoryPicker).showDirectoryPicker === 'function';
}

export async function pickDirectoryFileSystem(
	options?: PickDirectoryFileSystemOptions,
): Promise<PickDirectoryFileSystemResult> {
	const picker = (globalThis as GlobalWithDirectoryPicker).showDirectoryPicker;
	if (typeof picker !== 'function') {
		throw new FileSystemError('Directory picker file system is not supported', 'ENOTSUP');
	}

	const handle = await picker.call(globalThis, options);
	return { fileSystem: createWebFileSystem({ root: handle }), handle };
}
