import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import type { WebDAVClient } from 'webdav';
import { createBrowserFileSystem } from './createBrowserFileSystem';
import { createWebDavFileSystem } from './createWebDavFileSystem';
import { createJustBashFileSystemAdapter } from './just-bash';
import { createNodeFileSystem } from './server/createNodeFileSystem';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(
		temporaryDirectories.splice(0).map((directory) => fsp.rm(directory, { force: true, recursive: true })),
	);
});

describe('filesystem resource limits', () => {
	it('bounds Node directory enumeration and file allocation', async () => {
		const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'wener-fs-limits-'));
		temporaryDirectories.push(root);
		await fsp.writeFile(path.join(root, 'a.txt'), 'abcdef');
		await fsp.writeFile(path.join(root, 'b.txt'), 'second');
		const fileSystem = createNodeFileSystem({ root });

		await expect(fileSystem.readdir('/', { maxEntries: 1 })).rejects.toMatchObject({ code: 'EOVERFLOW' });
		expect(await fileSystem.readdir('/', { maxEntries: 2 })).toHaveLength(2);
		expect(await fileSystem.readFile('/a.txt', { encoding: 'text', maxBytes: 3 })).toBe('abc');
		expect([...(await fileSystem.readFile('/a.txt', { maxBytes: 4 }))]).toEqual([97, 98, 99, 100]);
	});

	it('slices browser files before reading and checks abort after allocation', async () => {
		const bytes = new TextEncoder().encode('abcdef');
		const controller = new AbortController();
		let slicedTo: number | undefined;
		const file = {
			size: bytes.byteLength,
			slice(_start: number, end: number) {
				slicedTo = end;
				return {
					async arrayBuffer() {
						return bytes.slice(0, end).buffer;
					},
				};
			},
		} as unknown as File;
		const fileSystem = createBrowserFileSystem(browserRoot(file));
		expect(await fileSystem.readFile('/bounded.txt', { encoding: 'text', maxBytes: 3 })).toBe('abc');
		expect(slicedTo).toBe(3);

		const aborting = createBrowserFileSystem(
			browserRoot({
				...file,
				slice() {
					return {
						async arrayBuffer() {
							controller.abort();
							return bytes.buffer;
						},
					} as Blob;
				},
			} as File),
		);
		await expect(aborting.readFile('/bounded.txt', { maxBytes: 6, signal: controller.signal })).rejects.toMatchObject({
			code: 'ABORT_ERR',
		});
	});

	it('fails closed before unbounded WebDAV operations', async () => {
		const getDirectoryContents = vi.fn();
		const getFileContents = vi.fn();
		const fileSystem = createWebDavFileSystem({
			client: { getDirectoryContents, getFileContents } as unknown as WebDAVClient,
		});
		await expect(fileSystem.readdir('/', { maxEntries: 10 })).rejects.toMatchObject({ code: 'ENOTSUP' });
		await expect(fileSystem.readFile('/large.bin', { maxBytes: 10 })).rejects.toMatchObject({ code: 'ENOTSUP' });
		expect(getDirectoryContents).not.toHaveBeenCalled();
		expect(getFileContents).not.toHaveBeenCalled();
	});

	it('rejects lexical escapes and existing symlinks in a rooted Node filesystem', async () => {
		const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'wener-fs-root-'));
		const outside = await fsp.mkdtemp(path.join(os.tmpdir(), 'wener-fs-outside-'));
		temporaryDirectories.push(root, outside);
		await fsp.writeFile(path.join(outside, 'secret.txt'), 'secret');
		await fsp.symlink(path.join(outside, 'secret.txt'), path.join(root, 'link.txt'));
		const fileSystem = createNodeFileSystem({ root });

		await expect(fileSystem.readFile(`../${path.basename(outside)}/secret.txt`)).rejects.toThrow('Security violation');
		await expect(fileSystem.stat('/link.txt')).rejects.toMatchObject({ code: 'ELOOP' });
		await expect(fileSystem.readFile('/link.txt', { maxBytes: 16 })).rejects.toMatchObject({ code: 'ELOOP' });
		await expect(fileSystem.writeFile('/link.txt', 'blocked')).rejects.toMatchObject({ code: 'ELOOP' });
		await expect(fileSystem.readdir('/', { maxEntries: 10 })).rejects.toMatchObject({ code: 'ELOOP' });

		const adapter = createJustBashFileSystemAdapter({ fs: fileSystem, fsRoot: '/', workspaceRoot: '/workspace' });
		await expect(adapter.readFile('/workspace/link.txt')).rejects.toMatchObject({ code: 'ELOOP' });
		expect(await fsp.readFile(path.join(outside, 'secret.txt'), 'utf8')).toBe('secret');
	});
});

function browserRoot(file: File): FileSystemDirectoryHandle {
	const fileHandle = {
		kind: 'file',
		name: 'bounded.txt',
		getFile: async () => file,
	} as unknown as FileSystemFileHandle;
	return {
		kind: 'directory',
		name: 'root',
		getFileHandle: async (name: string) => {
			if (name === 'bounded.txt') return fileHandle;
			throw new DOMException('Not found', 'NotFoundError');
		},
		getDirectoryHandle: async () => {
			throw new DOMException('Not found', 'NotFoundError');
		},
	} as unknown as FileSystemDirectoryHandle;
}
