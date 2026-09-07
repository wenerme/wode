import type {
	FileManagerFileTypeDefinition,
	FileManagerRegistry,
} from '@components/file-type-registry/file-manager-file-type-types';
import { getFileManager } from './file-manager-registry';
import type { FileViewerFileDescriptor, FileViewerKind } from './file-viewer-types';

export type FileViewerKindInput = Pick<FileViewerFileDescriptor, 'mimeType' | 'name' | 'path'>;

export function getFileViewerExtension(value: string): string {
	const clean = value.split(/[?#]/, 1)[0].replaceAll('\\', '/');
	const name = clean.slice(clean.lastIndexOf('/') + 1);
	const dot = name.lastIndexOf('.');
	return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1).toLowerCase() : '';
}

export function getFileSystemViewerExtension(value: string): string {
	const clean = value.replaceAll('\\', '/').replace(/\/+$/, '');
	const name = clean.slice(clean.lastIndexOf('/') + 1);
	const dot = name.lastIndexOf('.');
	return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1).toLowerCase() : '';
}

export function normalizeFileViewerMimeType(mimeType: string | undefined): string {
	return mimeType?.split(';', 1)[0].trim().toLowerCase() ?? '';
}

export function resolveFileViewerKind(
	input: FileViewerKindInput | string,
	mimeType?: string,
	manager: FileManagerRegistry = getFileManager(),
): FileViewerKind {
	const file = typeof input === 'string' ? { name: input, mimeType } : input;
	return toFileViewerKind(resolveFileViewerType(file, manager));
}

export function resolveFileSystemViewerKind(
	input: FileViewerKindInput,
	manager: FileManagerRegistry = getFileManager(),
): FileViewerKind {
	return toFileViewerKind(resolveFileSystemViewerType(input, manager));
}

export function resolveFileViewerType(
	file: FileViewerKindInput,
	manager: FileManagerRegistry = getFileManager(),
): FileManagerFileTypeDefinition | undefined {
	return manager.fileTypes.resolve({
		...file,
		extension: getFileViewerExtension(file.name || file.path || ''),
		kind: 'file',
	});
}

export function resolveFileSystemViewerType(
	file: FileViewerKindInput,
	manager: FileManagerRegistry = getFileManager(),
): FileManagerFileTypeDefinition | undefined {
	return manager.fileTypes.resolve({
		...file,
		extension: getFileSystemViewerExtension(file.name || file.path || ''),
		kind: 'file',
	});
}

export function getFileViewerMimeType(
	file: FileViewerKindInput,
	kind = resolveFileViewerKind(file),
	manager: FileManagerRegistry = getFileManager(),
): string {
	return resolveMimeType(file, kind, manager, getFileViewerExtension(file.name || file.path || ''));
}

export function getFileTypeMimeType(
	file: FileViewerKindInput,
	definition: FileManagerFileTypeDefinition,
	kind = toFileViewerKind(definition),
	manager: FileManagerRegistry = getFileManager(),
): string {
	const normalized = normalizeFileViewerMimeType(file.mimeType);
	if (normalized) return normalized;
	const value = file.name || file.path || '';
	const urlExtension = getFileViewerExtension(value);
	const rawExtension = getFileSystemViewerExtension(value);
	const extension = definition.match.extensions?.includes(rawExtension) ? rawExtension : urlExtension;
	const input = manager.fileTypes.resolveInput({ ...file, extension, kind: 'file' });
	let mimeType: string | undefined;
	try {
		mimeType = typeof definition.mimeType === 'function' ? definition.mimeType(input) : definition.mimeType;
	} catch {
		// Consumer MIME resolvers fail closed to the viewer-kind fallback.
	}
	return normalizeFileViewerMimeType(mimeType) || defaultFileViewerMimeType(kind);
}

export function getFileSystemViewerMimeType(
	file: FileViewerKindInput,
	kind = resolveFileSystemViewerKind(file),
	manager: FileManagerRegistry = getFileManager(),
): string {
	return resolveMimeType(file, kind, manager, getFileSystemViewerExtension(file.name || file.path || ''));
}

export function defaultFileViewerMimeType(kind: FileViewerKind): string {
	return {
		audio: 'audio/mpeg',
		image: 'image/*',
		pdf: 'application/pdf',
		text: 'text/plain',
		unsupported: 'application/octet-stream',
		video: 'video/mp4',
	}[kind];
}

export function toFileViewerKind(definition: FileManagerFileTypeDefinition | undefined): FileViewerKind {
	return definition?.viewerKind ?? 'unsupported';
}

function resolveMimeType(
	file: FileViewerKindInput,
	kind: FileViewerKind,
	manager: FileManagerRegistry,
	extension: string,
): string {
	const normalized = normalizeFileViewerMimeType(file.mimeType);
	if (normalized) return normalized;
	const input = { ...file, extension, kind: 'file' as const };
	const definition = manager.fileTypes.resolve(input);
	if (definition?.viewerKind === kind)
		return manager.fileTypes.resolveMimeType(input) ?? defaultFileViewerMimeType(kind);
	return defaultFileViewerMimeType(kind);
}
