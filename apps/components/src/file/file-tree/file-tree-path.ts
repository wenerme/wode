export function normalizeFileTreePath(path: string): string {
	const parts: string[] = [];
	for (const part of String(path).replaceAll('\\', '/').split('/')) {
		if (!part || part === '.') continue;
		if (part === '..') {
			parts.pop();
			continue;
		}
		parts.push(part);
	}
	return `/${parts.join('/')}`;
}

export function isFileTreePathWithinRoot(path: string, rootPath: string): boolean {
	const normalizedPath = normalizeFileTreePath(path);
	const normalizedRoot = normalizeFileTreePath(rootPath);
	return normalizedRoot === '/' || normalizedPath === normalizedRoot || normalizedPath.startsWith(`${normalizedRoot}/`);
}

export function isFileTreePathAtOrBelow(path: string, ancestor: string): boolean {
	const normalizedPath = normalizeFileTreePath(path);
	const normalizedAncestor = normalizeFileTreePath(ancestor);
	return normalizedPath === normalizedAncestor || normalizedPath.startsWith(`${normalizedAncestor}/`);
}

export function getFileTreeParentPath(path: string): string {
	const normalized = normalizeFileTreePath(path);
	if (normalized === '/') return '/';
	const separator = normalized.lastIndexOf('/');
	return separator <= 0 ? '/' : normalized.slice(0, separator);
}

export function getFileTreeBasename(path: string): string {
	const normalized = normalizeFileTreePath(path);
	return normalized === '/' ? '' : normalized.slice(normalized.lastIndexOf('/') + 1);
}

export function validateFileTreeName(name: unknown): name is string {
	return (
		typeof name === 'string' &&
		name.length > 0 &&
		name !== '.' &&
		name !== '..' &&
		!name.includes('/') &&
		!name.includes('\\') &&
		!name.includes('\0')
	);
}

export function joinFileTreePath(directory: string, name: string): string {
	if (!validateFileTreeName(name)) throw new Error(`Invalid direct-child name: ${String(name)}`);
	const normalized = normalizeFileTreePath(directory);
	return normalized === '/' ? `/${name}` : `${normalized}/${name}`;
}

export function getFileTreeDepth(path: string, rootPath: string): number | undefined {
	const normalizedPath = normalizeFileTreePath(path);
	const normalizedRoot = normalizeFileTreePath(rootPath);
	if (!isFileTreePathWithinRoot(normalizedPath, normalizedRoot)) return undefined;
	if (normalizedPath === normalizedRoot) return 0;
	return normalizedPath.slice(normalizedRoot === '/' ? 1 : normalizedRoot.length + 1).split('/').length;
}

export function getFileTreeAncestorPaths(path: string, rootPath: string): string[] {
	const normalizedPath = normalizeFileTreePath(path);
	const normalizedRoot = normalizeFileTreePath(rootPath);
	if (!isFileTreePathWithinRoot(normalizedPath, normalizedRoot)) return [];
	const paths = [normalizedRoot];
	if (normalizedPath === normalizedRoot) return paths;
	const relative = normalizedPath.slice(normalizedRoot === '/' ? 1 : normalizedRoot.length + 1);
	let current = normalizedRoot;
	for (const part of relative.split('/')) {
		current = joinFileTreePath(current, part);
		paths.push(current);
	}
	return paths;
}
