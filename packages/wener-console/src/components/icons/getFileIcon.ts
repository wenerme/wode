import { FileExtIcon } from './FileExtIcon';
import { FileTypeIcon } from './FileTypeIcon';

export function getFileIcon(needle: { kind?: string; name?: string } | string | undefined | null) {
	if (!needle) return FileTypeIcon.file;
	let fn: string | undefined;
	if (typeof needle === 'object' && needle) {
		if (needle.kind === 'directory') {
			return FileTypeIcon.directory;
		}
		fn = needle.name;
	} else if (typeof needle === 'string') {
		fn = needle;
	}

	if (fn) {
		let ext: string | undefined;
		if (fn.includes('.')) {
			ext = extname(fn).slice(1);
		}
		return FileExtIcon[ext || fn] || FileTypeIcon.file;
	}

	return FileTypeIcon.file;
}

function extname(fn: string) {
	return fn.includes('.') ? fn.slice(fn.lastIndexOf('.') + 1) : '';
}
