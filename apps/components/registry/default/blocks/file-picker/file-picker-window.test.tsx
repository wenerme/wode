import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { FileManagerFileStat, FileManagerFileSystem } from '../file-manager';
import { createWindowManagerStore } from '../window-manager';
import {
	FILE_PICKER_WINDOW_KIND,
	renderFilePickerWindow,
	showDirectoryPicker,
	showFilePicker,
	showSaveFilePicker,
} from './file-picker-window';

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
const file = stat('/report.txt', 'file');

describe('file picker window integration', () => {
	it('opens independent non-persistent windows and settles each matching result once', async () => {
		const store = createWindowManagerStore({ workspace: { width: 1200, height: 800 } });
		const first = showFilePicker({ fileSystem, windowManager: store });
		const second = showFilePicker({ fileSystem, multiple: true, windowManager: store });
		const [firstId, secondId] = store.getState().order;
		expect(firstId).not.toBe(secondId);
		for (const id of [firstId, secondId]) {
			const win = store.getState().windows[id];
			expect(win.kind).toBe(FILE_PICKER_WINDOW_KIND);
			expect(win.persistence).toBe('none');
			expect(win.key).toBe(id);
		}
		store.getState().actions.close(firstId, file);
		store.getState().actions.close(secondId, [file]);
		await expect(first).resolves.toEqual(file);
		await expect(second).resolves.toEqual([file]);
	});

	it('maps chrome close and invalid results to cancellation', async () => {
		const store = createWindowManagerStore();
		const promise = showDirectoryPicker({
			fileSystem,
			window: { capabilities: { minimize: false } },
			windowManager: store,
		});
		const id = store.getState().order[0];
		expect(store.getState().windows[id].capabilities.close).toBe(true);
		store.getState().actions.close(id, { unexpected: true });
		await expect(promise).resolves.toBeUndefined();
	});

	it('settles cancellation when hydration removes the runtime-only window', async () => {
		const store = createWindowManagerStore();
		const promise = showFilePicker({ fileSystem, windowManager: store });
		store.getState().actions.hydrateLayout({
			dock: store.getState().workspace.dock,
			order: [],
			savedAt: Date.now(),
			version: 1,
			windows: [],
		});
		await expect(promise).resolves.toBeUndefined();
	});

	it('returns typed directory and save results', async () => {
		const store = createWindowManagerStore();
		const directoryPromise = showDirectoryPicker({ fileSystem, windowManager: store });
		const directoryId = store.getState().order[0];
		store.getState().actions.close(directoryId, { kind: 'directory', path: '/docs' });
		await expect(directoryPromise).resolves.toEqual({ kind: 'directory', path: '/docs' });

		const savePromise = showSaveFilePicker({ fileSystem, suggestedName: 'report.txt', windowManager: store });
		const saveId = store.getState().order[0];
		const result = { directory: '/', kind: 'file' as const, name: 'report.txt', path: '/report.txt' };
		store.getState().actions.close(saveId, result);
		await expect(savePromise).resolves.toEqual(result);
	});

	it('renders only branded picker data with valid filesystem methods', () => {
		const store = createWindowManagerStore();
		void showFilePicker({ fileSystem, windowManager: store });
		const win = store.getState().windows[store.getState().order[0]];
		const markup = renderToStaticMarkup(renderFilePickerWindow(win));
		expect(markup).toContain('data-file-manager=""');
		expect(markup).not.toContain('<h2');
		expect(renderFilePickerWindow({ kind: FILE_PICKER_WINDOW_KIND, data: null })).toBeNull();
		expect(
			renderFilePickerWindow({
				kind: FILE_PICKER_WINDOW_KIND,
				data: {
					...(win.data as object),
					picker: { ...(win.data as { picker: object }).picker, multiple: 'yes' },
				},
			}),
		).toBeNull();
	});
});

function stat(path: string, kind: FileManagerFileStat['kind']): FileManagerFileStat {
	return { directory: '/', kind, meta: {}, mtime: 1, name: path.slice(1), path, size: 10 };
}
