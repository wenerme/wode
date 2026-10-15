import { basename, dirname, normalize } from 'pathe';
import type { IFileStat } from '../IFileSystem';
import { type FileSystemErrors, fsErrors } from './errors';

/** 逻辑路径规范化策略。 */
export type FileSystemPathPolicy = 'strict' | 'lenient';

export function normalizeFileSystemPath(
	path: string,
	policy: FileSystemPathPolicy,
	errors: FileSystemErrors = fsErrors,
): string {
	if (policy === 'lenient') {
		if (typeof path !== 'string' || !path) {
			throw errors.create('Invalid path: path must be a non-empty string', 'EINVAL');
		}
		return normalizeLenientPosixPath(path);
	}

	if (typeof path !== 'string' || !path || !path.startsWith('/')) {
		throw errors.create('Path must be a POSIX absolute path', 'EINVAL');
	}
	if (path.includes('\\') || path.includes('\0') || path.split('/').includes('..')) {
		throw errors.create(`Invalid or escaping path: ${path}`, 'EINVAL');
	}
	const normalized = normalize(path);
	if (!normalized.startsWith('/')) throw errors.create(`Path escapes filesystem root: ${path}`, 'EINVAL');
	return normalized.length > 1 ? normalized.replace(/\/$/u, '') : '/';
}

/**
 * 以 POSIX 语义规范化路径。
 *
 * pathe 会把前导 `//` 当作 UNC 前缀处理，导致 `//..` 保留为特殊路径；
 * 这里把反斜杠视为分隔符，并在逻辑根目录吸收 `..`，避免下层再次规范化时越界。
 */
export function normalizeLenientPosixPath(path: string): string {
	const segments: string[] = [];
	for (const segment of path.replaceAll('\\', '/').split('/')) {
		if (!segment || segment === '.') continue;
		if (segment === '..') segments.pop();
		else segments.push(segment);
	}
	const normalized = `/${segments.join('/')}`;
	return normalized !== '/' && /[\\/]$/u.test(path) ? `${normalized}/` : normalized;
}

/** 拒绝根作为源、源与目标相同或互为祖先/后代。 */
export function assertNonOverlappingPaths(
	source: string,
	destination: string,
	errors: FileSystemErrors = fsErrors,
): void {
	if (
		source === '/' ||
		source === destination ||
		destination.startsWith(`${source}/`) ||
		source.startsWith(`${destination}/`)
	) {
		throw errors.overlappingPaths();
	}
}

export function joinChildPath(parent: string, name: string): string {
	return parent === '/' ? `/${name}` : `${parent}/${name}`;
}

export function toStatLocation(path: string): Pick<IFileStat, 'directory' | 'name'> {
	if (path === '/') return { directory: '', name: '' };
	return { directory: dirname(path), name: basename(path) };
}
