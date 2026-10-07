import { describe, expect, it } from 'vitest';
import { FileSystemError } from '../FileSystemError';
import { assertNonOverlappingPaths, joinChildPath, normalizeFileSystemPath, toStatLocation } from './paths';

describe('normalizeFileSystemPath', () => {
	it('lenient 规范化吸收根目录处的 .. 并统一分隔符', () => {
		expect(normalizeFileSystemPath('a/b', 'lenient')).toBe('/a/b');
		expect(normalizeFileSystemPath('/../x', 'lenient')).toBe('/x');
		expect(normalizeFileSystemPath('//..', 'lenient')).toBe('/');
		expect(normalizeFileSystemPath('//../x', 'lenient')).toBe('/x');
		expect(normalizeFileSystemPath('\\..\\x', 'lenient')).toBe('/x');
		expect(normalizeFileSystemPath('/C:/x', 'lenient')).toBe('/C:/x');
		expect(normalizeFileSystemPath('/a//b/', 'lenient')).toBe('/a/b/');
	});

	it('strict 规范化拒绝相对路径和 .. 段', () => {
		expect(normalizeFileSystemPath('/a/./b/', 'strict')).toBe('/a/b');
		for (const path of ['', 'relative', '/a/../b', '/a\\b', null, 1]) {
			expect(() => normalizeFileSystemPath(path as string, 'strict')).toThrowError(
				expect.objectContaining({ code: 'EINVAL' }),
			);
		}
	});
});

describe('assertNonOverlappingPaths', () => {
	it('拒绝根源、相同路径与祖先/后代关系', () => {
		for (const [source, destination] of [
			['/', '/a'],
			['/a', '/a'],
			['/a', '/a/b'],
			['/a/b', '/a'],
		] as const) {
			expect(() => assertNonOverlappingPaths(source, destination)).toThrowError(FileSystemError);
		}
	});

	it('允许兄弟与前缀相似的路径', () => {
		expect(() => assertNonOverlappingPaths('/a', '/ab')).not.toThrow();
		expect(() => assertNonOverlappingPaths('/a/b', '/a/c')).not.toThrow();
	});
});

describe('path helpers', () => {
	it('joinChildPath 和 toStatLocation 使用逻辑 POSIX 路径', () => {
		expect(joinChildPath('/', 'a')).toBe('/a');
		expect(joinChildPath('/a', 'b')).toBe('/a/b');
		expect(toStatLocation('/')).toEqual({ directory: '', name: '' });
		expect(toStatLocation('/a/b.txt')).toEqual({ directory: '/a', name: 'b.txt' });
	});
});
