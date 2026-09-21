import { describe, expect, it, vi } from 'vitest';
import { readFileManagerPreviewData } from './file-manager-preview';
import {
	executeFileManagerOperation,
	FileManagerBatchOperationError,
	FileManagerOperationCancelledError,
	sanitizeFileManagerEntries,
} from './file-manager-runtime';
import type { FileManagerFileStat, FileManagerFileSystem } from './file-manager-types';
import { fileManagerOperationHardItemLimit } from './file-manager-types';

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
		const unreadable = {} as FileManagerFileStat;
		Object.defineProperty(unreadable, 'name', {
			get: () => {
				throw new Error('entry should not be read');
			},
		});
		expect(() => sanitizeFileManagerEntries([unreadable, unreadable], '/workspace', '/workspace', 1)).toThrow(
			'目录项目数量超过列表上限 1',
		);
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

	it('rejects oversized direct executor batches before filesystem work', async () => {
		const stat = vi.fn(async () => createStat('/same.txt'));
		await expect(
			executeFileManagerOperation({
				fileSystem: createFileSystem({ stat }),
				maxUploadBytes: 1024,
				operation: {
					type: 'delete',
					paths: Array<string>(fileManagerOperationHardItemLimit + 1).fill('/same.txt'),
				},
				rootPath: '/',
				signal: new AbortController().signal,
			}),
		).rejects.toThrow(`单次操作最多处理 ${fileManagerOperationHardItemLimit} 个项目`);
		expect(stat).not.toHaveBeenCalled();
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
		let uploadError: unknown;
		try {
			await executeFileManagerOperation({
				fileSystem,
				maxUploadBytes: 3,
				operation: { type: 'upload', directory: '/', files: [new File(['large'], 'large.txt')] },
				rootPath: '/',
				signal: new AbortController().signal,
			});
		} catch (error) {
			uploadError = error;
		}
		expect(uploadError).toBeInstanceOf(FileManagerBatchOperationError);
		expect((uploadError as FileManagerBatchOperationError).result.failed[0]?.error).toEqual(
			expect.objectContaining({ message: expect.stringContaining('超过单文件上传上限') }),
		);
		expect(writeFile).not.toHaveBeenCalled();
	});

	it('uploads independent files and preserves per-item collision and write failures', async () => {
		const writeFile = vi.fn(async (path: string) => {
			if (path === '/retry.txt') throw new Error('temporary write failure');
		});
		const fileSystem = createFileSystem({
			stat: vi.fn(async (path: string) => {
				if (path === '/') return createStat('/', '', 'directory');
				if (path === '/existing.txt') return createStat(path);
				throw notFound();
			}),
			writeFile,
		});
		let caught: unknown;
		try {
			await executeFileManagerOperation({
				fileSystem,
				maxUploadBytes: 1024,
				operation: {
					type: 'upload',
					directory: '/',
					files: [new File(['existing'], 'existing.txt'), new File(['ok'], 'ok.txt'), new File(['retry'], 'retry.txt')],
				},
				rootPath: '/',
				signal: new AbortController().signal,
			});
		} catch (error) {
			caught = error;
		}
		expect(caught).toBeInstanceOf(FileManagerBatchOperationError);
		expect((caught as FileManagerBatchOperationError).result).toMatchObject({
			completed: ['/ok.txt'],
			failed: [{ path: '/existing.txt' }, { path: '/retry.txt' }],
		});
		expect(writeFile).toHaveBeenCalledTimes(2);
	});

	it('bounds upload count and total bytes while reporting rejected directories', async () => {
		let caught: unknown;
		try {
			await executeFileManagerOperation({
				fileSystem: createFileSystem({
					stat: async (path) => (path === '/' ? createStat('/', '', 'directory') : Promise.reject(notFound())),
				}),
				maxUploadBytes: 10,
				maxUploadFiles: 2,
				maxUploadTotalBytes: 3,
				operation: {
					type: 'upload',
					directory: '/',
					files: [new File(['aa'], 'a.txt'), new File(['bb'], 'b.txt'), new File(['c'], 'c.txt')],
					rejected: [{ name: 'photos', reason: 'directory' }],
				},
				rootPath: '/',
				signal: new AbortController().signal,
			});
		} catch (error) {
			caught = error;
		}
		expect(caught).toBeInstanceOf(FileManagerBatchOperationError);
		expect((caught as FileManagerBatchOperationError).result).toMatchObject({
			completed: ['/a.txt'],
			failed: [{ path: '/b.txt' }, { path: '其余 1 个文件' }, { path: '其余 1 个项目' }],
		});
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
			maxDownloadBytes: 3,
			maxDownloadTotalBytes: 3,
			maxUploadBytes: 1024,
			onDownload,
			operation: { type: 'download', paths: ['/workspace/report.txt'] },
			rootPath: '/workspace',
			signal: new AbortController().signal,
		});
		expect(readFile).toHaveBeenCalledWith(
			'/workspace/report.txt',
			expect.objectContaining({ encoding: 'binary', maxBytes: 4 }),
		);
		expect(onDownload).toHaveBeenCalledWith(
			expect.objectContaining({
				directory: '/workspace',
				name: 'report.txt',
				path: '/workspace/report.txt',
			}),
			new Uint8Array([1, 2, 3]),
		);
	});

	it('bounds actual download bytes and retains partial batch results', async () => {
		const readFile = vi.fn(async (path: string) =>
			path === '/a.txt' ? new Uint8Array([1, 2]) : new Uint8Array([1, 2, 3, 4]),
		);
		const onDownload = vi.fn(async () => undefined);
		const fileSystem = createFileSystem({
			readFile: readFile as unknown as FileManagerFileSystem['readFile'],
			stat: vi.fn(async (path: string) => ({ ...createStat(path), size: path === '/a.txt' ? 2 : 0 })),
		});
		let caught: unknown;
		try {
			await executeFileManagerOperation({
				fileSystem,
				maxDownloadBytes: 3,
				maxDownloadTotalBytes: 3,
				maxUploadBytes: 1024,
				onDownload,
				operation: { type: 'download', paths: ['/a.txt', '/b.txt'] },
				rootPath: '/',
				signal: new AbortController().signal,
			});
		} catch (error) {
			caught = error;
		}
		expect(caught).toBeInstanceOf(FileManagerBatchOperationError);
		expect((caught as FileManagerBatchOperationError).result).toMatchObject({
			completed: ['/a.txt'],
			failed: [{ path: '/b.txt' }],
		});
		expect(readFile).toHaveBeenNthCalledWith(1, '/a.txt', expect.objectContaining({ maxBytes: 4 }));
		expect(readFile).toHaveBeenNthCalledWith(2, '/b.txt', expect.objectContaining({ maxBytes: 2 }));
		expect(onDownload).toHaveBeenCalledTimes(1);
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
				fileSystem: createFileSystem({
					stat: async (path) => (path === '/' ? createStat('/', '', 'directory') : Promise.reject(notFound())),
					writeFile,
				}),
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
			if (path === '/') return createStat('/', '', 'directory');
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
