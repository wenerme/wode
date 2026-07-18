import { describe, expect, it } from 'vite-plus/test';
import type { FileManagerFileStat } from '../file-manager';
import {
	createSaveFilePickerTarget,
	filterFilePickerEntries,
	getSelectedFilePickerEntries,
	matchesFilePickerAccept,
} from './file-picker-model';

const directory = stat('/docs', 'directory');
const image = stat('/photo.PNG', 'file', { type: 'image/png' });
const text = stat('/notes.txt', 'file', { type: 'text/plain' });

describe('file picker model', () => {
	it('keeps directories visible and matches extensions case-insensitively', () => {
		const accept = [{ description: '图片', accept: { 'image/*': ['.png', '.jpg'] } }];
		expect(matchesFilePickerAccept(directory, accept)).toBe(true);
		expect(matchesFilePickerAccept(image, accept)).toBe(true);
		expect(matchesFilePickerAccept(text, accept)).toBe(false);
		expect(filterFilePickerEntries([directory, image, text], { accept })).toEqual([directory, image]);
	});

	it('supports MIME metadata and directory-only filtering', () => {
		expect(matchesFilePickerAccept(text, [{ accept: { 'text/*': [] } }])).toBe(true);
		expect(matchesFilePickerAccept(stat('/binary.dat', 'file'), [{ accept: { '*/*': [] } }])).toBe(true);
		expect(filterFilePickerEntries([directory, image, text], { directoriesOnly: true })).toEqual([directory]);
	});

	it('returns selected entries in listing order and by kind', () => {
		expect(getSelectedFilePickerEntries([directory, image, text], [text.path, directory.path], 'file')).toEqual([text]);
		expect(getSelectedFilePickerEntries([directory, image, text], [text.path, directory.path], 'directory')).toEqual([
			directory,
		]);
	});

	it('builds save targets without writing and rejects invalid names or directories', () => {
		expect(createSaveFilePickerTarget('/docs', ' report.txt ')).toEqual({
			result: { directory: '/docs', kind: 'file', name: 'report.txt', path: '/docs/report.txt' },
		});
		expect(createSaveFilePickerTarget('/docs', '../report.txt').error).toContain('路径分隔符');
		expect(createSaveFilePickerTarget('/docs', 'docs', directory).error).toContain('同名目录');
		const existing = stat('/docs/report.txt', 'file');
		expect(createSaveFilePickerTarget('/docs', 'report.txt', existing).result?.existing).toBe(existing);
	});
});

function stat(
	path: string,
	kind: FileManagerFileStat['kind'],
	meta: Record<string, unknown> = {},
): FileManagerFileStat {
	const name = path.slice(path.lastIndexOf('/') + 1);
	const directoryPath = path.slice(0, path.lastIndexOf('/')) || '/';
	return { directory: directoryPath, kind, meta, mtime: 1, name, path, size: kind === 'file' ? 10 : 0 };
}
