import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { FileManagerFileSystem } from './file-manager-types';
import type { FileManagerWindowActions } from './file-manager-window';
import { FILE_MANAGER_WINDOW_KIND, renderFileManagerWindow, showFileManager } from './file-manager-window';

const fileSystem = {
	copy: vi.fn(),
	exists: vi.fn(),
	mkdir: vi.fn(),
	readFile: vi.fn(),
	readdir: vi.fn(),
	rename: vi.fn(),
	rm: vi.fn(),
	stat: vi.fn(),
	writeFile: vi.fn(),
} as unknown as FileManagerFileSystem;

describe('FileManager window integration', () => {
	it('opens a non-persistent reusable FileManager window with bounded defaults', () => {
		const open = vi.fn((_options: Parameters<FileManagerWindowActions['open']>[0]) => 'files-window');
		const id = showFileManager({
			fileManager: { fileSystem },
			windowManager: { open },
			window: { key: 'tenant-files', title: '租户文件', bounds: { width: 1080 } },
		});
		expect(id).toBe('files-window');
		expect(open).toHaveBeenCalledWith(
			expect.objectContaining({
				key: 'tenant-files',
				kind: FILE_MANAGER_WINDOW_KIND,
				persistence: 'none',
				title: '租户文件',
				bounds: { width: 1080, height: 640 },
				size: { minWidth: 560, minHeight: 420 },
			}),
		);
	});

	it('renders only branded FileManager window data without a duplicate header', () => {
		const open = vi.fn((_options: Parameters<FileManagerWindowActions['open']>[0]) => 'files-window');
		showFileManager({ fileManager: { fileSystem }, windowManager: { open } });
		const descriptor = open.mock.calls[0]?.[0];
		expect(descriptor).toBeDefined();
		if (!descriptor) throw new Error('expected FileManager window descriptor');
		const markup = renderToStaticMarkup(renderFileManagerWindow(descriptor));
		expect(markup).toContain('data-file-manager=""');
		expect(markup).not.toContain('<h2');
		expect(renderFileManagerWindow({ kind: 'other', data: descriptor?.data })).toBeNull();
		expect(renderFileManagerWindow({ kind: FILE_MANAGER_WINDOW_KIND, data: null })).toBeNull();
		expect(
			renderFileManagerWindow({
				kind: FILE_MANAGER_WINDOW_KIND,
				data: { type: FILE_MANAGER_WINDOW_KIND, fileManager: null },
			}),
		).toBeNull();
		expect(
			renderFileManagerWindow({
				kind: FILE_MANAGER_WINDOW_KIND,
				data: {
					type: FILE_MANAGER_WINDOW_KIND,
					fileManager: { fileSystem: { stat: vi.fn(), readdir: vi.fn(), readFile: vi.fn() } },
				},
			}),
		).toBeNull();
	});

	it('uses a string FileManager title when the window title is omitted', () => {
		const open = vi.fn((_options: Parameters<FileManagerWindowActions['open']>[0]) => 'files-window');
		showFileManager({ fileManager: { fileSystem, title: '项目文件' }, windowManager: { open } });
		expect(open).toHaveBeenCalledWith(expect.objectContaining({ title: '项目文件' }));
	});
});
