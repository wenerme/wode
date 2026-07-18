import { describe, expect, it, vi } from 'vite-plus/test';
import { readFileManagerPreviewData } from './file-manager-preview';
import {
	executeFileManagerOperation,
	FileManagerBatchOperationError,
	FileManagerOperationCancelledError,
	sanitizeFileManagerEntries,
} from './file-manager-runtime';
import type { FileManagerFileStat, FileManagerFileSystem } from './file-manager-types';

describe('file manager runtime boundaries', () => {
	it('rebuilds direct-child paths and rejects unsafe or duplicate adapter entries', () => {
		const safe = createStat('/outside.txt', 'report.txt');
		expect(sanitizeFileManagerEntries([safe], '/workspace', '/workspace')).toMatchObject([
			{ directory: '/workspace', name: 'report.txt', path: '/workspace/report.txt' },
		]);
		expect(() =>
			sanitizeFileManagerEntries([createStat('/outside', '../outside')], '/workspace', '/workspace'),
		).toThrow('非法项目名称');
		expect(() => sanitizeFileManagerEntries([safe, { ...safe }], '/workspace', '/workspace')).toThrow('重复项目');
	});

	it('preflights targets and reports every completed and failed batch item', async () => {
		const copy = vi.fn(async (source: string) => {
			if (source === '/b.txt') throw new Error('copy failed');
		});
		const fileSystem = createFileSystem({ copy });
		let caught: unknown;
		try {
			await executeFileManagerOperation({
				fileSystem,
				maxUploadBytes: 1024,
				operation: { type: 'copy', paths: ['/a.txt', '/b.txt', '/c.txt'], destination: '/target' },
				rootPath: '/',
				signal: new AbortController().signal,
			});
		} catch (error) {
			caught = error;
		}
		expect(caught).toBeInstanceOf(FileManagerBatchOperationError);
		expect((caught as FileManagerBatchOperationError).result).toMatchObject({
			completed: ['/a.txt', '/c.txt'],
			failed: [{ path: '/b.txt' }],
		});
		expect(copy).toHaveBeenCalledTimes(3);
	});

	it('rejects existing create targets and oversized uploads before writing', async () => {
		const writeFile = vi.fn(async () => undefined);
		const existing = createFileSystem({
			stat: vi.fn(async (path: string) => (path === '/existing.txt' ? createStat(path) : Promise.reject(notFound()))),
			writeFile,
		});
		await expect(
			executeFileManagerOperation({
				fileSystem: existing,
				maxUploadBytes: 10,
				operation: { type: 'create-file', directory: '/', name: 'existing.txt' },
				rootPath: '/',
				signal: new AbortController().signal,
			}),
		).rejects.toThrow('目标已存在');

		const fileSystem = createFileSystem({ writeFile });
		await expect(
			executeFileManagerOperation({
				fileSystem,
				maxUploadBytes: 3,
				operation: { type: 'upload', directory: '/', files: [new File(['large'], 'large.txt')] },
				rootPath: '/',
				signal: new AbortController().signal,
			}),
		).rejects.toThrow('超过上传上限');
		expect(writeFile).not.toHaveBeenCalled();
	});

	it('never follows an adapter-provided stat path for download callbacks', async () => {
		const readFile = vi.fn(async () => new Uint8Array([1, 2, 3]));
		const onDownload = vi.fn(async () => undefined);
		const fileSystem = createFileSystem({
			readFile: readFile as unknown as FileManagerFileSystem['readFile'],
			stat: vi.fn(async () => ({ ...createStat('/outside/secret.txt'), path: '/outside/secret.txt' })),
		});
		await executeFileManagerOperation({
			fileSystem,
			maxUploadBytes: 1024,
			onDownload,
			operation: { type: 'download', paths: ['/workspace/report.txt'] },
			rootPath: '/workspace',
			signal: new AbortController().signal,
		});
		expect(readFile).toHaveBeenCalledWith('/workspace/report.txt', expect.objectContaining({ encoding: 'binary' }));
		expect(onDownload).toHaveBeenCalledWith(
			expect.objectContaining({
				directory: '/workspace',
				name: 'report.txt',
				path: '/workspace/report.txt',
			}),
			new Uint8Array([1, 2, 3]),
		);
	});

	it('keeps completed batch items in cancellation results', async () => {
		const controller = new AbortController();
		const writeFile = vi.fn(async (path: string) => {
			if (path.endsWith('/b.txt')) {
				controller.abort();
				throw new DOMException('aborted', 'AbortError');
			}
		});
		let caught: unknown;
		try {
			await executeFileManagerOperation({
				fileSystem: createFileSystem({ stat: async () => Promise.reject(notFound()), writeFile }),
				maxUploadBytes: 1024,
				operation: {
					type: 'upload',
					directory: '/',
					files: [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')],
				},
				rootPath: '/',
				signal: controller.signal,
			});
		} catch (error) {
			caught = error;
		}
		expect(caught).toBeInstanceOf(FileManagerOperationCancelledError);
		expect((caught as FileManagerOperationCancelledError).result).toEqual({ completed: ['/a.txt'], failed: [] });
	});

	it('enforces preview limits against the bytes returned by an untrusted adapter', async () => {
		const readFile = vi.fn(async () => new Uint8Array([1, 2, 3, 4]));
		const fileSystem = createFileSystem({
			readFile: readFile as unknown as FileManagerFileSystem['readFile'],
		});
		await expect(readFileManagerPreviewData(fileSystem, '/large.bin', 3)).rejects.toThrow('文件超过预览上限');
		expect(readFile).toHaveBeenCalledWith('/large.bin', expect.objectContaining({ maxBytes: 4 }));
	});
});

function createFileSystem(overrides: Partial<FileManagerFileSystem> = {}): FileManagerFileSystem {
	return {
		copy: async () => undefined,
		exists: async () => false,
		mkdir: async () => undefined,
		readFile: vi.fn(async () => new Uint8Array()),
		readdir: async () => [],
		rename: async () => undefined,
		rm: async () => undefined,
		stat: async (path) => {
			if (path === '/target') return createStat(path, 'target', 'directory');
			if (['/a.txt', '/b.txt', '/c.txt'].includes(path)) return createStat(path);
			throw notFound();
		},
		writeFile: async () => undefined,
		...overrides,
	} as FileManagerFileSystem;
}

function createStat(path: string, name = path.slice(path.lastIndexOf('/') + 1), kind: 'directory' | 'file' = 'file') {
	return {
		directory: path.slice(0, path.lastIndexOf('/')) || '/',
		kind,
		meta: {},
		mtime: 1,
		name,
		path,
		size: kind === 'file' ? 1 : 0,
	} satisfies FileManagerFileStat;
}

function notFound() {
	return Object.assign(new Error('not found'), { code: 'ENOENT' });
}
