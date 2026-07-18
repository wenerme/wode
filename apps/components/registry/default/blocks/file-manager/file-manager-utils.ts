import type { FileManagerFileStat } from './file-manager-types';

export function normalizeFileManagerPath(path: string): string {
	const parts: string[] = [];
	for (const part of path.replaceAll('\\', '/').split('/')) {
		if (!part || part === '.') continue;
		if (part === '..') {
			parts.pop();
			continue;
		}
		parts.push(part);
	}
	return `/${parts.join('/')}`;
}

export function joinFileManagerPath(directory: string, name: string): string {
	return normalizeFileManagerPath(`${directory}/${name}`);
}

export function getFileManagerParentPath(path: string): string {
	const normalized = normalizeFileManagerPath(path);
	if (normalized === '/') return '/';
	const index = normalized.lastIndexOf('/');
	return index <= 0 ? '/' : normalized.slice(0, index);
}

export function getFileManagerBasename(path: string): string {
	const normalized = normalizeFileManagerPath(path);
	return normalized === '/' ? '' : normalized.slice(normalized.lastIndexOf('/') + 1);
}

export function isFileManagerPathWithinRoot(path: string, rootPath: string): boolean {
	const normalizedPath = normalizeFileManagerPath(path);
	const normalizedRoot = normalizeFileManagerPath(rootPath);
	return normalizedRoot === '/' || normalizedPath === normalizedRoot || normalizedPath.startsWith(`${normalizedRoot}/`);
}

export function isFileManagerDescendantPath(sourcePath: string, targetPath: string): boolean {
	const source = normalizeFileManagerPath(sourcePath);
	const target = normalizeFileManagerPath(targetPath);
	return source === '/' ? target !== '/' : target.startsWith(`${source}/`);
}

export function validateFileManagerName(name: string): string | undefined {
	const value = name.trim();
	if (!value) return '名称不能为空';
	if (value === '.' || value === '..') return '名称不能是 . 或 ..';
	if (value.includes('/') || value.includes('\\') || value.includes('\0')) return '名称不能包含路径分隔符';
	return undefined;
}

export function sortFileManagerEntries(
	entries: readonly FileManagerFileStat[],
	options: { by: 'name' | 'size' | 'mtime'; direction: 'asc' | 'desc' },
): FileManagerFileStat[] {
	const direction = options.direction === 'asc' ? 1 : -1;
	return [...entries].sort((left, right) => {
		if (left.kind !== right.kind) return left.kind === 'directory' ? -1 : 1;
		if (options.by === 'size' && left.size !== right.size) return (left.size - right.size) * direction;
		if (options.by === 'mtime' && left.mtime !== right.mtime) return (left.mtime - right.mtime) * direction;
		return left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' }) * direction;
	});
}

export function formatFileManagerBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	const value = bytes / 1024 ** index;
	return `${value.toFixed(index === 0 || value >= 10 ? 0 : 1)} ${units[index]}`;
}

export function getFileManagerExtension(name: string): string {
	const dot = name.lastIndexOf('.');
	return dot <= 0 ? '' : name.slice(dot + 1).toLowerCase();
}

export function isFileManagerTextFile(name: string): boolean {
	return new Set([
		'c',
		'conf',
		'cpp',
		'css',
		'csv',
		'env',
		'go',
		'h',
		'html',
		'ini',
		'java',
		'js',
		'json',
		'jsx',
		'log',
		'md',
		'py',
		'rs',
		'sh',
		'sql',
		'svg',
		'toml',
		'ts',
		'tsx',
		'txt',
		'xml',
		'yaml',
		'yml',
	]).has(getFileManagerExtension(name));
}

export function getFileManagerMediaKind(name: string): 'audio' | 'binary' | 'image' | 'pdf' | 'text' | 'video' {
	const extension = getFileManagerExtension(name);
	if (['avif', 'bmp', 'gif', 'heic', 'ico', 'jpeg', 'jpg', 'png', 'tif', 'tiff', 'webp'].includes(extension))
		return 'image';
	if (extension === 'pdf') return 'pdf';
	if (['aac', 'flac', 'm4a', 'mp3', 'oga', 'ogg', 'opus', 'wav', 'weba'].includes(extension)) return 'audio';
	if (['avi', 'm4v', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg', 'ogv', 'webm'].includes(extension)) return 'video';
	if (isFileManagerTextFile(name)) return 'text';
	return 'binary';
}

export function sanitizeFileManagerStat(entry: FileManagerFileStat, safePath: string): FileManagerFileStat {
	const path = normalizeFileManagerPath(safePath);
	if (entry.kind !== 'directory' && entry.kind !== 'file') throw new Error(`文件系统返回了非法项目类型：${path}`);
	return {
		directory: getFileManagerParentPath(path),
		kind: entry.kind,
		meta: entry.meta ?? {},
		mtime: Number.isFinite(entry.mtime) ? entry.mtime : 0,
		name: getFileManagerBasename(path),
		path,
		size: Number.isFinite(entry.size) && entry.size > 0 ? entry.size : 0,
	};
}
