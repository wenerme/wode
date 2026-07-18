import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { FileViewerFileSystem } from './file-system-file-viewer';
import {
	createAuthoritativeFileDescriptor,
	FileSystemFileViewer,
	isFileViewerRequestCurrent,
	loadFileSystemFileViewer,
	readFileViewerBytes,
} from './file-system-file-viewer';

describe('file system file viewer boundaries', () => {
	it('requests maxBytes + 1 and rejects a malicious oversized adapter result', async () => {
		const readFile = vi.fn(async () => new Uint8Array(6));
		const fileSystem: FileViewerFileSystem = { readFile };
		await expect(readFileViewerBytes(fileSystem, '/safe/report.txt', 4)).rejects.toEqual(
			expect.objectContaining({ actualBytes: 6, maxBytes: 4 }),
		);
		expect(readFile).toHaveBeenCalledWith('/safe/report.txt', {
			encoding: 'binary',
			maxBytes: 5,
			signal: undefined,
		});
	});

	it('keeps the requested path authoritative over adapter stat.path', async () => {
		const readFile = vi.fn(async () => new TextEncoder().encode('authoritative'));
		const stat = vi.fn(async () => ({
			kind: 'file' as const,
			mimeType: 'text/plain',
			name: 'redirected.txt',
			path: '/outside/redirected.txt',
			size: 1,
		}));
		const loaded = await loadFileSystemFileViewer({
			fileSystem: { readFile, stat },
			maxBytes: 128,
			path: '/workspace/actual.txt',
		});
		expect(stat).toHaveBeenCalledWith('/workspace/actual.txt', { signal: undefined });
		expect(readFile).toHaveBeenCalledWith('/workspace/actual.txt', expect.any(Object));
		expect(loaded.file.path).toBe('/workspace/actual.txt');
		expect(loaded.file.name).toBe('actual.txt');
		expect(loaded.file.size).toBe(13);
		expect(loaded.text).toBe('authoritative');
	});

	it('reads legal filesystem names containing URL delimiter characters', async () => {
		const readFile = vi.fn(async () => new TextEncoder().encode('raw path'));
		const loaded = await loadFileSystemFileViewer({
			fileSystem: { readFile, stat: vi.fn(async () => ({ kind: 'file' as const, size: 8 })) },
			maxBytes: 64,
			path: '/workspace/report?.txt',
		});
		expect(loaded.file.name).toBe('report?.txt');
		expect(loaded.kind).toBe('text');
		expect(loaded.text).toBe('raw path');
		expect(readFile).toHaveBeenCalledWith('/workspace/report?.txt', expect.any(Object));
	});

	it('rejects a supported file from stat size before allocating its bytes', async () => {
		const readFile = vi.fn(async () => new Uint8Array(4));
		await expect(
			loadFileSystemFileViewer({
				fileSystem: {
					readFile,
					stat: vi.fn(async () => ({ kind: 'file' as const, mimeType: 'video/mp4', size: 10 })),
				},
				maxBytes: 4,
				path: '/workspace/clip.mp4',
			}),
		).rejects.toMatchObject({ actualBytes: 10, maxBytes: 4 });
		expect(readFile).not.toHaveBeenCalled();
	});

	it('does not read bytes for unsupported files', async () => {
		const readFile = vi.fn(async () => new Uint8Array([1, 2, 3]));
		const loaded = await loadFileSystemFileViewer({
			fileSystem: {
				readFile,
				stat: vi.fn(async () => ({
					kind: 'file' as const,
					path: '/malicious/image.png',
					mimeType: 'application/x-private-archive',
					size: 42,
				})),
			},
			path: '/workspace/archive.bin',
		});
		expect(loaded.kind).toBe('unsupported');
		expect(loaded.bytes).toBeUndefined();
		expect(readFile).not.toHaveBeenCalled();
	});

	it('guards aborted and stale requests at pure boundaries', async () => {
		const controller = new AbortController();
		controller.abort();
		const stat = vi.fn(async () => ({ kind: 'file' as const }));
		await expect(
			loadFileSystemFileViewer({ fileSystem: { stat }, path: '/workspace/file.txt', signal: controller.signal }),
		).rejects.toMatchObject({ name: 'AbortError' });
		expect(stat).not.toHaveBeenCalled();
		expect(isFileViewerRequestCurrent(3, 3, { aborted: false })).toBe(true);
		expect(isFileViewerRequestCurrent(2, 3, { aborted: false })).toBe(false);
		expect(isFileViewerRequestCurrent(3, 3, { aborted: true })).toBe(false);
	});

	it('does not invoke browser or filesystem work during SSR', () => {
		const stat = vi.fn(async () => ({ kind: 'file' as const }));
		const readFile = vi.fn(async () => new Uint8Array());
		const markup = renderToStaticMarkup(
			<FileSystemFileViewer fileSystem={{ readFile, stat }} path='/workspace/readme.txt' />,
		);
		expect(markup).toContain('data-slot="addressable-frame"');
		expect(markup).toContain('正在读取文件');
		expect(stat).not.toHaveBeenCalled();
		expect(readFile).not.toHaveBeenCalled();
	});

	it('extracts metadata without accepting an alternate stat path', () => {
		const file = createAuthoritativeFileDescriptor('/tenant/report.pdf', {
			meta: Object.assign(Object.create(null) as Record<string, unknown>, { contentType: 'application/pdf' }),
			mtime: 10,
			path: '/other/file.txt',
			size: 20,
		});
		expect(file).toEqual({
			lastModified: 10,
			meta: expect.any(Object),
			mimeType: 'application/pdf',
			name: 'report.pdf',
			path: '/tenant/report.pdf',
			size: 20,
		});
	});
});
