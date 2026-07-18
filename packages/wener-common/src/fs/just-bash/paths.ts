import { basename, dirname, join, normalize, relative } from 'pathe';

export const virtualSystemRoots = ['/tmp', '/dev', '/home'] as const;

export class JustBashPathError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'JustBashPathError';
	}
}

export function normalizeVirtualPath(path: string, label = 'path'): string {
	if (typeof path !== 'string' || !path || path.includes('\0')) {
		throw new JustBashPathError(`Invalid ${label}: expected a non-empty path without NUL bytes`);
	}
	const normalized = normalize(path.startsWith('/') ? path : `/${path}`);
	return normalized === '/' ? '/' : normalized.replace(/\/+$/u, '');
}

export function normalizeRootPath(path: string, label: string): string {
	return normalizeVirtualPath(path, label);
}

export function isPathWithin(root: string, path: string): boolean {
	return root === '/' || path === root || path.startsWith(`${root}/`);
}

export function isVirtualSystemPath(path: string): boolean {
	return virtualSystemRoots.some((root) => isPathWithin(root, path));
}

export function isProtectedVirtualSystemPath(path: string): boolean {
	return ['/', '/tmp', '/dev', '/dev/null', '/dev/stdin', '/home', '/home/user'].includes(path);
}

export function mapWorkspacePath(virtualPath: string, workspaceRoot: string, fsRoot: string): string {
	if (!isPathWithin(workspaceRoot, virtualPath)) {
		throw new JustBashPathError(`Path is outside workspace ${workspaceRoot}: ${virtualPath}`);
	}
	const suffix = relative(workspaceRoot, virtualPath);
	if (suffix === '..' || suffix.startsWith('../') || suffix.startsWith('/')) {
		throw new JustBashPathError(`Path escapes workspace ${workspaceRoot}: ${virtualPath}`);
	}
	return normalizeRootPath(suffix ? join(fsRoot, suffix) : fsRoot, 'backing path');
}

export function resolveVirtualPath(base: string, path: string): string {
	return normalizeVirtualPath(path.startsWith('/') ? path : join(base, path));
}

export function parentVirtualPath(path: string): string {
	const parent = dirname(path);
	return parent === '.' ? '/' : normalizeVirtualPath(parent);
}

export function childVirtualPath(parent: string, name: string): string {
	assertLegalVirtualBasename(name);
	return normalizeVirtualPath(join(parent, name));
}

export function assertLegalVirtualBasename(name: string, label = 'directory entry name'): string {
	if (
		typeof name !== 'string' ||
		name.length === 0 ||
		name === '.' ||
		name === '..' ||
		name.includes('/') ||
		name.includes('\\') ||
		name.includes('\0')
	) {
		throw new JustBashPathError(`Invalid ${label}: expected a legal basename`);
	}
	return name;
}

export function virtualBasename(path: string): string {
	return basename(path);
}

export function getMountAncestors(workspaceRoot: string): string[] {
	if (workspaceRoot === '/') return ['/'];
	const ancestors = ['/'];
	let current = '';
	for (const part of workspaceRoot.split('/').filter(Boolean)) {
		current = `${current}/${part}`;
		ancestors.push(current);
	}
	return ancestors;
}

export function assertWorkspaceRootAvailable(workspaceRoot: string): void {
	if (workspaceRoot === '/') return;
	if (isVirtualSystemPath(workspaceRoot)) {
		throw new JustBashPathError(`workspaceRoot cannot be mounted inside reserved virtual paths: ${workspaceRoot}`);
	}
}
