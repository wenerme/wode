import { afterEach, describe, expect, test, vi } from 'vite-plus/test';
import { createOpfsFileSystem, isOpfsFileSystemSupported } from './createOpfsFileSystem';
import { FileSystemError } from './FileSystemError';
import { isDirectoryPickerFileSystemSupported, pickDirectoryFileSystem } from './pickDirectoryFileSystem';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('createOpfsFileSystem', () => {
	test('is SSR-safe and normalizes unsupported environments', async () => {
		vi.stubGlobal('navigator', undefined);
		expect(isOpfsFileSystemSupported()).toBe(false);
		await expect(createOpfsFileSystem()).rejects.toMatchObject({ code: 'ENOTSUP' });
	});

	test('creates and scopes an OPFS root through validated path segments', async () => {
		const leaf = createDirectoryHandle('tenant');
		const app = createDirectoryHandle('app', leaf.handle);
		const root = createDirectoryHandle('root', app.handle);
		const getDirectory = vi.fn(async () => root.handle);
		vi.stubGlobal('navigator', { storage: { getDirectory } });

		const fileSystem = await createOpfsFileSystem({ path: ['app', 'tenant'] });

		expect(isOpfsFileSystemSupported()).toBe(true);
		expect(getDirectory).toHaveBeenCalledOnce();
		expect(root.getDirectoryHandle).toHaveBeenCalledWith('app', { create: true });
		expect(app.getDirectoryHandle).toHaveBeenCalledWith('tenant', { create: true });
		expect(await fileSystem.stat('/')).toMatchObject({ kind: 'directory' });
	});

	test.each([
		'',
		'/tenant',
		'tenant/',
		'tenant//data',
		'.',
		'..',
		'tenant\\data',
	])('rejects invalid namespace path %j', async (path) => {
		const root = createDirectoryHandle('root');
		const getDirectory = vi.fn(async () => root.handle);
		vi.stubGlobal('navigator', { storage: { getDirectory } });
		await expect(createOpfsFileSystem({ path })).rejects.toBeInstanceOf(FileSystemError);
		expect(getDirectory).not.toHaveBeenCalled();
	});
});

describe('pickDirectoryFileSystem', () => {
	test('is SSR-safe and normalizes unsupported environments', async () => {
		vi.stubGlobal('showDirectoryPicker', undefined);
		expect(isDirectoryPickerFileSystemSupported()).toBe(false);
		await expect(pickDirectoryFileSystem()).rejects.toMatchObject({ code: 'ENOTSUP' });
	});

	test('returns the selected handle and file system without permission probes', async () => {
		const root = createDirectoryHandle('picked');
		const picker = vi.fn(async () => root.handle);
		vi.stubGlobal('showDirectoryPicker', picker);

		const result = await pickDirectoryFileSystem({ mode: 'readwrite' });

		expect(isDirectoryPickerFileSystemSupported()).toBe(true);
		expect(picker).toHaveBeenCalledWith({ mode: 'readwrite' });
		expect(result.handle).toBe(root.handle);
		expect(await result.fileSystem.stat('/')).toMatchObject({ kind: 'directory' });
	});

	test.each(['AbortError', 'NotAllowedError'])('preserves %s from the picker', async (name) => {
		const error = new DOMException('Picker rejected', name);
		vi.stubGlobal(
			'showDirectoryPicker',
			vi.fn(async () => Promise.reject(error)),
		);
		await expect(pickDirectoryFileSystem()).rejects.toBe(error);
	});
});

function createDirectoryHandle(name: string, child?: FileSystemDirectoryHandle) {
	const getDirectoryHandle = vi.fn(async (segment: string) => {
		if (child && segment === child.name) return child;
		throw new DOMException('Not found', 'NotFoundError');
	});
	const handle = {
		kind: 'directory',
		name,
		getDirectoryHandle,
		getFileHandle: vi.fn(async () => Promise.reject(new DOMException('Not found', 'NotFoundError'))),
		values: async function* () {},
	} as unknown as FileSystemDirectoryHandle;
	return { handle, getDirectoryHandle };
}
