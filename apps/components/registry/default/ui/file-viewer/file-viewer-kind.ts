import type { FileViewerFileDescriptor, FileViewerKind } from './file-viewer-types';

const textExtensions = new Set([
	'c',
	'cc',
	'conf',
	'cpp',
	'css',
	'csv',
	'go',
	'h',
	'hpp',
	'htm',
	'html',
	'ini',
	'java',
	'js',
	'json',
	'jsonl',
	'jsx',
	'log',
	'md',
	'mdx',
	'properties',
	'py',
	'rs',
	'sh',
	'sql',
	'svg',
	'toml',
	'ts',
	'tsv',
	'tsx',
	'txt',
	'vue',
	'xml',
	'yaml',
	'yml',
]);
const imageExtensions = new Set([
	'avif',
	'bmp',
	'gif',
	'heic',
	'ico',
	'jpeg',
	'jpg',
	'png',
	'svg',
	'tif',
	'tiff',
	'webp',
]);
const audioExtensions = new Set(['aac', 'flac', 'm4a', 'mp3', 'oga', 'ogg', 'opus', 'wav', 'weba']);
const videoExtensions = new Set(['avi', 'm4v', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg', 'ogv', 'webm']);

const extensionMimeTypes: Readonly<Record<string, string>> = {
	aac: 'audio/aac',
	avif: 'image/avif',
	bmp: 'image/bmp',
	css: 'text/css',
	csv: 'text/csv',
	flac: 'audio/flac',
	gif: 'image/gif',
	html: 'text/html',
	ico: 'image/x-icon',
	jpeg: 'image/jpeg',
	jpg: 'image/jpeg',
	js: 'text/javascript',
	json: 'application/json',
	jsonl: 'application/x-ndjson',
	m4a: 'audio/mp4',
	m4v: 'video/mp4',
	md: 'text/markdown',
	mkv: 'video/x-matroska',
	mov: 'video/quicktime',
	mp3: 'audio/mpeg',
	mp4: 'video/mp4',
	mpeg: 'video/mpeg',
	oga: 'audio/ogg',
	ogg: 'audio/ogg',
	ogv: 'video/ogg',
	opus: 'audio/ogg',
	pdf: 'application/pdf',
	png: 'image/png',
	svg: 'image/svg+xml',
	tsv: 'text/tab-separated-values',
	txt: 'text/plain',
	wav: 'audio/wav',
	weba: 'audio/webm',
	webm: 'video/webm',
	webp: 'image/webp',
	xml: 'application/xml',
	yaml: 'application/yaml',
	yml: 'application/yaml',
};

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

export function resolveFileViewerKind(input: FileViewerKindInput | string, mimeType?: string): FileViewerKind {
	const file = typeof input === 'string' ? { name: input, mimeType } : input;
	const normalizedMime = normalizeFileViewerMimeType(file.mimeType);
	const mimeKind = resolveMimeKind(normalizedMime);
	if (mimeKind) return mimeKind;
	const extension = getFileViewerExtension(file.name || file.path || '');
	return resolveFileViewerExtensionKind(extension);
}

export function resolveFileSystemViewerKind(input: FileViewerKindInput): FileViewerKind {
	const normalizedMime = normalizeFileViewerMimeType(input.mimeType);
	const mimeKind = resolveMimeKind(normalizedMime);
	if (mimeKind) return mimeKind;
	return resolveFileViewerExtensionKind(getFileSystemViewerExtension(input.name || input.path || ''));
}

function resolveFileViewerExtensionKind(extension: string): FileViewerKind {
	if (textExtensions.has(extension)) return 'text';
	if (imageExtensions.has(extension)) return 'image';
	if (extension === 'pdf') return 'pdf';
	if (audioExtensions.has(extension)) return 'audio';
	if (videoExtensions.has(extension)) return 'video';
	return 'unsupported';
}

export function getFileViewerMimeType(file: FileViewerKindInput, kind = resolveFileViewerKind(file)): string {
	const normalized = normalizeFileViewerMimeType(file.mimeType);
	if (normalized) return normalized;
	const extension = getFileViewerExtension(file.name || file.path || '');
	return extensionMimeTypes[extension] ?? defaultFileViewerMimeType(kind);
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

function resolveMimeKind(mimeType: string): FileViewerKind | undefined {
	if (!mimeType || mimeType === 'application/octet-stream' || mimeType === 'binary/octet-stream') return undefined;
	if (mimeType.startsWith('text/')) return 'text';
	if (mimeType.startsWith('image/')) return 'image';
	if (mimeType === 'application/pdf') return 'pdf';
	if (mimeType.startsWith('audio/')) return 'audio';
	if (mimeType.startsWith('video/')) return 'video';
	if (
		mimeType === 'application/json' ||
		mimeType === 'application/xml' ||
		mimeType === 'application/yaml' ||
		mimeType.endsWith('+json') ||
		mimeType.endsWith('+xml')
	)
		return 'text';
	return undefined;
}
