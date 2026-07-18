import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import { createMemoryFileSystem } from './createMemoryFileSystem';
import { runFileSystemTest } from './tests/runFileSystemTest';

describe('MemoryFileSystem', () => {
	let fs: ReturnType<typeof createMemoryFileSystem>;

	beforeEach(() => {
		fs = createMemoryFileSystem({
			root: {
				path: '/',
				directory: '',
				name: '',
				kind: 'directory',
				meta: {},
				mtime: Date.now(),
				size: 0,
				children: [
					{
						path: '/README.txt',
						directory: '/',
						name: 'README.txt',
						kind: 'file',
						content: 'Hello',
						size: 5,
						meta: {},
						mtime: Date.now(),
					},
				],
			},
		});
	});

	test('common tests', async () => {
		await runFileSystemTest(fs);
	});

	test('stores binary data without view widening and supports Web streams', async () => {
		const source = new Uint8Array([99, 0, 255, 1, 98]);
		await fs.writeFile('/binary.dat', source.subarray(1, 4));
		expect([...(await fs.readFile('/binary.dat'))]).toEqual([0, 255, 1]);

		await fs.writeFile('/array-buffer.dat', new Uint8Array([0, 127, 255]).buffer);
		expect([...(await fs.readFile('/array-buffer.dat'))]).toEqual([0, 127, 255]);

		await fs.writeFile('/data-view.dat', new DataView(source.buffer, 2, 2));
		expect([...(await fs.readFile('/data-view.dat'))]).toEqual([255, 1]);

		await fs.writeFile(
			'/readable.dat',
			new ReadableStream({
				start(controller) {
					controller.enqueue(new Uint8Array([0, 128]));
					controller.enqueue(new Uint8Array([255]));
					controller.close();
				},
			}),
		);
		expect([...(await fs.readFile('/readable.dat'))]).toEqual([0, 128, 255]);

		const readable = fs.createReadableStream?.('/readable.dat', { range: { start: 1, end: 2 } });
		expect(readable).toBeDefined();
		const ranged = await readable!.getReader().read();
		expect([...ranged.value!]).toEqual([128, 255]);

		const writer = fs.createWritableStream?.('/writable.dat')?.getWriter();
		expect(writer).toBeDefined();
		await writer!.write(new Uint8Array([0, 1]));
		await writer!.write(new Uint8Array([254, 255]));
		await writer!.write('text');
		await writer!.close();
		expect([...(await fs.readFile('/writable.dat'))]).toEqual([0, 1, 254, 255, 116, 101, 120, 116]);
	});

	test('applies maxBytes before returning file content', async () => {
		const fs = createMemoryFileSystem();
		await fs.writeFile('/bounded.txt', 'abcdef');
		expect(await fs.readFile('/bounded.txt', { encoding: 'text', maxBytes: 3 })).toBe('abc');
		expect([...(await fs.readFile('/bounded.txt', { maxBytes: 4 }))]).toEqual([97, 98, 99, 100]);
	});

	test('returns sanitized stats', async () => {
		const file = await fs.stat('/README.txt');
		const directory = await fs.stat('/');
		const [entry] = await fs.readdir('/');

		expect(file).not.toHaveProperty('content');
		expect(directory).not.toHaveProperty('children');
		expect(entry).not.toHaveProperty('content');
	});

	test('rejects maxEntries overflow before mapping directory stats', async () => {
		await fs.writeFile('/second.txt', 'second');

		await expect(fs.readdir('/', { maxEntries: 1 })).rejects.toMatchObject({ code: 'EOVERFLOW' });
		expect(await fs.readdir('/', { maxEntries: 2 })).toHaveLength(2);
		await expect(fs.readdir('/', { maxEntries: -1 })).rejects.toMatchObject({ code: 'EINVAL' });
	});

	test('requires the immediate parent for non-recursive mkdir', async () => {
		await fs.mkdir('/parent');
		await fs.mkdir('/parent/child');
		await expect(fs.mkdir('/parent/missing/grandchild')).rejects.toMatchObject({ code: 'ENOENT' });
		expect(await fs.exists('/parent/missing')).toBe(false);
	});

	test('rebases every nested path during directory copy and rename', async () => {
		await fs.mkdir('/source/nested', { recursive: true });
		await fs.writeFile('/source/nested/data.bin', new Uint8Array([0, 255, 7]));

		await fs.copy('/source', '/copied');
		expect(await fs.stat('/copied/nested/data.bin')).toMatchObject({
			path: '/copied/nested/data.bin',
			directory: '/copied/nested',
		});
		expect([...(await fs.readFile('/copied/nested/data.bin'))]).toEqual([0, 255, 7]);

		await fs.rename('/copied', '/moved/deep');
		expect(await fs.stat('/moved/deep/nested/data.bin')).toMatchObject({
			path: '/moved/deep/nested/data.bin',
			directory: '/moved/deep/nested',
		});
		expect(await fs.exists('/copied')).toBe(false);
	});

	test('preserves the source when rename validation fails', async () => {
		await fs.writeFile('/source.txt', 'source');
		await fs.writeFile('/destination.txt', 'destination');

		await expect(fs.rename('/source.txt', '/destination.txt')).rejects.toMatchObject({ code: 'EEXIST' });
		expect(await fs.readFile('/source.txt', { encoding: 'text' })).toBe('source');
		expect(await fs.readFile('/destination.txt', { encoding: 'text' })).toBe('destination');
	});

	test('rejects root and overlapping copy or move operations', async () => {
		await fs.mkdir('/tree/child', { recursive: true });

		await expect(fs.rm('/', { recursive: true })).rejects.toMatchObject({ code: 'EBUSY' });
		await expect(fs.rename('/', '/root-copy')).rejects.toMatchObject({ code: 'EBUSY' });
		await expect(fs.copy('/', '/root-copy')).rejects.toMatchObject({ code: 'EINVAL' });
		await expect(fs.copy('/tree', '/tree/copy')).rejects.toMatchObject({ code: 'EINVAL' });
		await expect(fs.rename('/tree', '/tree/child/moved')).rejects.toMatchObject({ code: 'EINVAL' });
		await expect(fs.copy('/tree/child', '/tree', { overwrite: true })).rejects.toMatchObject({ code: 'EINVAL' });
		expect(await fs.exists('/tree/child')).toBe(true);
	});

	test('revokes cached object URLs on overwrite and removal', async () => {
		const createObjectURL = vi
			.spyOn(URL, 'createObjectURL')
			.mockReturnValueOnce('blob:first')
			.mockReturnValueOnce('blob:second');
		const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
		try {
			await fs.writeFile('/url.txt', 'first');
			expect(fs.getUrl?.('/url.txt')).toBe('blob:first');

			await fs.writeFile('/url.txt', 'second');
			expect(revokeObjectURL).toHaveBeenCalledWith('blob:first');
			expect(fs.getUrl?.('/url.txt')).toBe('blob:second');

			await fs.rm('/url.txt');
			expect(revokeObjectURL).toHaveBeenCalledWith('blob:second');
			expect(createObjectURL).toHaveBeenCalledTimes(2);
		} finally {
			createObjectURL.mockRestore();
			revokeObjectURL.mockRestore();
		}
	});
});
