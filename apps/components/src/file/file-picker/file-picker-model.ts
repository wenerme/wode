import type { FileManagerFileStat } from '../file-manager';
import { joinFileManagerPath, validateFileManagerName } from '../file-manager';
import type { FilePickerAcceptType, SaveFilePickerResult } from './file-picker-types';

export function matchesFilePickerAccept(entry: FileManagerFileStat, accept?: readonly FilePickerAcceptType[]): boolean {
	if (entry.kind === 'directory' || !accept?.length) return true;
	const extension = getExtension(entry.name);
	const mime = getEntryMime(entry);
	return accept.some((group) =>
		Object.entries(group.accept).some(([pattern, extensions]) => {
			if (pattern.trim() === '*/*' || extensions.some((candidate) => candidate.trim() === '*')) return true;
			if (extensions.some((candidate) => normalizeExtension(candidate) === extension)) return true;
			return mime ? matchesMime(mime, pattern) : false;
		}),
	);
}

export function filterFilePickerEntries(
	entries: readonly FileManagerFileStat[],
	options: { accept?: readonly FilePickerAcceptType[]; directoriesOnly?: boolean },
): FileManagerFileStat[] {
	return entries.filter((entry) =>
		options.directoriesOnly
			? entry.kind === 'directory'
			: entry.kind === 'directory' || matchesFilePickerAccept(entry, options.accept),
	);
}

export function getSelectedFilePickerEntries(
	entries: readonly FileManagerFileStat[],
	selectedPaths: readonly string[],
	kind: 'directory' | 'file',
): FileManagerFileStat[] {
	const selected = new Set(selectedPaths);
	return entries.filter((entry) => entry.kind === kind && selected.has(entry.path));
}

export function createSaveFilePickerTarget(
	directory: string,
	name: string,
	existing?: FileManagerFileStat,
): { error?: string; result?: SaveFilePickerResult } {
	const error = validateFileManagerName(name);
	if (error) return { error };
	const normalizedName = name.trim();
	if (existing?.kind === 'directory') return { error: '不能覆盖同名目录' };
	return {
		result: {
			directory,
			existing,
			kind: 'file',
			name: normalizedName,
			path: joinFileManagerPath(directory, normalizedName),
		},
	};
}

function getExtension(name: string): string {
	const dot = name.lastIndexOf('.');
	return dot > 0 ? name.slice(dot).toLowerCase() : '';
}

function normalizeExtension(value: string): string {
	const normalized = value.trim().toLowerCase();
	if (!normalized || normalized === '*') return normalized;
	return normalized.startsWith('.') ? normalized : `.${normalized}`;
}

function getEntryMime(entry: FileManagerFileStat): string | undefined {
	for (const key of ['type', 'mimeType', 'mime']) {
		const value = entry.meta[key];
		if (typeof value === 'string' && value.includes('/')) return value.toLowerCase();
	}
	return undefined;
}

function matchesMime(mime: string, pattern: string): boolean {
	const normalized = pattern.trim().toLowerCase();
	if (normalized === '*/*') return true;
	if (normalized.endsWith('/*')) return mime.startsWith(normalized.slice(0, -1));
	return mime === normalized;
}
