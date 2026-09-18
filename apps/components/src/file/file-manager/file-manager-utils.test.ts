import { describe, expect, it } from 'vite-plus/test';
import {
	getFileManagerMediaKind,
	getFileManagerParentPath,
	isFileManagerDescendantPath,
	isFileManagerPathWithinRoot,
	joinFileManagerPath,
	normalizeFileManagerPath,
	sortFileManagerEntries,
	validateFileManagerName,
} from './file-manager-utils';

describe('file manager path utilities', () => {
	it('normalizes paths and clamps parent traversal at the virtual root', () => {
		expect(normalizeFileManagerPath('/docs/../images//logo.png')).toBe('/images/logo.png');
		expect(normalizeFileManagerPath('../../secret')).toBe('/secret');
		expect(joinFileManagerPath('/docs/', '/notes.txt')).toBe('/docs/notes.txt');
		expect(getFileManagerParentPath('/docs/notes.txt')).toBe('/docs');
		expect(getFileManagerParentPath('/')).toBe('/');
	});

	it('enforces scoped roots and descendant move guards', () => {
		expect(isFileManagerPathWithinRoot('/tenant/files/a.txt', '/tenant/files')).toBe(true);
		expect(isFileManagerPathWithinRoot('/tenant/other', '/tenant/files')).toBe(false);
		expect(isFileManagerDescendantPath('/docs', '/docs/archive')).toBe(true);
		expect(isFileManagerDescendantPath('/docs', '/documents')).toBe(false);
	});

	it('rejects unsafe names', () => {
		expect(validateFileManagerName('')).toBeDefined();
		expect(validateFileManagerName('../secret')).toBeDefined();
		expect(validateFileManagerName('nested/name')).toBeDefined();
		expect(validateFileManagerName('report.pdf')).toBeUndefined();
	});

	it('sorts directories first and applies numeric file ordering', () => {
		const entries = [
			{ name: 'file10.txt', path: '/file10.txt', directory: '/', kind: 'file' as const, size: 10, mtime: 1, meta: {} },
			{ name: 'Folder', path: '/Folder', directory: '/', kind: 'directory' as const, size: 0, mtime: 1, meta: {} },
			{ name: 'file2.txt', path: '/file2.txt', directory: '/', kind: 'file' as const, size: 2, mtime: 2, meta: {} },
		];
		expect(sortFileManagerEntries(entries, { by: 'name', direction: 'asc' }).map((entry) => entry.name)).toEqual([
			'Folder',
			'file2.txt',
			'file10.txt',
		]);
	});

	it('classifies the basic standalone viewer families used by entry icons', () => {
		expect(getFileManagerMediaKind('photo.avif')).toBe('image');
		expect(getFileManagerMediaKind('voice.mp3')).toBe('audio');
		expect(getFileManagerMediaKind('demo.webm')).toBe('video');
		expect(getFileManagerMediaKind('manual.pdf')).toBe('pdf');
		expect(getFileManagerMediaKind('README.md')).toBe('text');
		expect(getFileManagerMediaKind('archive.bin')).toBe('binary');
	});
});
