import { describe, expect, it, vi } from 'vitest';
import type { WebDAVClient } from 'webdav';
import { createWebDavFileSystem } from './createWebDavFileSystem';

describe('createWebDavFileSystem', () => {
	it('writes ArrayBufferView and Web ReadableStream data without Node Buffer APIs', async () => {
		const putFileContents = vi.fn(async (_path: string, _data: unknown) => undefined);
		const fs = createWebDavFileSystem({ client: { putFileContents } as unknown as WebDAVClient });

		await fs.writeFile('/bytes.bin', new Uint8Array([0, 128, 255]));
		await fs.writeFile(
			'/stream.bin',
			new ReadableStream({
				start(controller) {
					controller.enqueue(new Uint8Array([1, 2]));
					controller.enqueue(new Uint8Array([3]));
					controller.close();
				},
			}),
		);

		expect([...((putFileContents.mock.calls[0]?.[1] as Uint8Array) ?? [])]).toEqual([0, 128, 255]);
		expect([...((putFileContents.mock.calls[1]?.[1] as Uint8Array) ?? [])]).toEqual([1, 2, 3]);
	});

	it('filters directory entries with the browser-safe POSIX glob matcher', async () => {
		const getDirectoryContents = vi.fn(async () => [
			{ filename: '/notes.txt', basename: 'notes.txt', type: 'file', lastmod: '2026-01-01', size: 1 },
			{ filename: '/notes.md', basename: 'notes.md', type: 'file', lastmod: '2026-01-01', size: 1 },
		]);
		const fs = createWebDavFileSystem({ client: { getDirectoryContents } as unknown as WebDAVClient });

		expect((await fs.readdir('/', { glob: '/notes*.txt' })).map((entry) => entry.name)).toEqual(['notes.txt']);
	});
});
