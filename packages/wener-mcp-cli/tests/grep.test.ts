/**
 * Unit tests for grep command - glob pattern matching
 */

import { describe, expect, test } from 'vite-plus/test';
import { globToRegex } from '../src/commands/grep';

describe('globToRegex', () => {
	describe('basic patterns', () => {
		test('matches exact strings', () => {
			const regex = globToRegex('read_file');
			expect(regex.test('read_file')).toBe(true);
			expect(regex.test('read_files')).toBe(false);
			expect(regex.test('aread_file')).toBe(false);
		});

		test('is case insensitive', () => {
			const regex = globToRegex('Read_File');
			expect(regex.test('read_file')).toBe(true);
			expect(regex.test('READ_FILE')).toBe(true);
		});
	});

	describe('single asterisk (*)', () => {
		test('matches any characters except slash', () => {
			const regex = globToRegex('*file*');
			expect(regex.test('read_file')).toBe(true);
			expect(regex.test('file_utils')).toBe(true);
			expect(regex.test('my_file_tool')).toBe(true);
			expect(regex.test('file')).toBe(true);
		});

		test('does not match across slashes', () => {
			const regex = globToRegex('server/*');
			expect(regex.test('server/tool')).toBe(true);
			expect(regex.test('server/')).toBe(true);
			expect(regex.test('server/sub/tool')).toBe(false);
		});

		test('handles prefix patterns', () => {
			const regex = globToRegex('read_*');
			expect(regex.test('read_file')).toBe(true);
			expect(regex.test('read_directory')).toBe(true);
			expect(regex.test('write_file')).toBe(false);
		});

		test('handles suffix patterns', () => {
			const regex = globToRegex('*_file');
			expect(regex.test('read_file')).toBe(true);
			expect(regex.test('write_file')).toBe(true);
			expect(regex.test('file_reader')).toBe(false);
		});
	});

	describe('double asterisk (**) - globstar', () => {
		test('matches anything including slashes', () => {
			const regex = globToRegex('server/**');
			expect(regex.test('server/tool')).toBe(true);
			expect(regex.test('server/sub/tool')).toBe(true);
			expect(regex.test('server/')).toBe(true);
		});

		test('works at start of pattern', () => {
			const regex = globToRegex('**/tool');
			expect(regex.test('server/tool')).toBe(true);
			expect(regex.test('path/to/tool')).toBe(true);
		});

		test('matches in the middle - **test**', () => {
			const regex = globToRegex('**test**');
			expect(regex.test('test')).toBe(true);
			expect(regex.test('my_test_tool')).toBe(true);
			expect(regex.test('testing')).toBe(true);
			expect(regex.test('unit_test')).toBe(true);
			expect(regex.test('server/test/tool')).toBe(true);
		});

		test('handles consecutive asterisks (***)', () => {
			const regex = globToRegex('***file***');
			expect(regex.test('file')).toBe(true);
			expect(regex.test('myfile')).toBe(true);
			expect(regex.test('file_utils')).toBe(true);
		});
	});

	describe('question mark (?)', () => {
		test('matches single character', () => {
			const regex = globToRegex('file?');
			expect(regex.test('file1')).toBe(true);
			expect(regex.test('files')).toBe(true);
			expect(regex.test('file')).toBe(false);
			expect(regex.test('file12')).toBe(false);
		});

		test('does not match slash', () => {
			const regex = globToRegex('a?b');
			expect(regex.test('aXb')).toBe(true);
			expect(regex.test('a/b')).toBe(false);
		});
	});

	describe('special regex characters', () => {
		test('escapes dots', () => {
			const regex = globToRegex('file.txt');
			expect(regex.test('file.txt')).toBe(true);
			expect(regex.test('fileXtxt')).toBe(false);
		});

		test('escapes brackets', () => {
			const regex = globToRegex('[test]');
			expect(regex.test('[test]')).toBe(true);
			expect(regex.test('test')).toBe(false);
		});

		test('escapes parentheses', () => {
			const regex = globToRegex('func(arg)');
			expect(regex.test('func(arg)')).toBe(true);
		});

		test('escapes plus and caret', () => {
			const regex = globToRegex('a+b^c');
			expect(regex.test('a+b^c')).toBe(true);
		});
	});

	describe('real-world patterns', () => {
		test('matches filesystem tools', () => {
			const regex = globToRegex('*file*');
			expect(regex.test('read_file')).toBe(true);
			expect(regex.test('write_file')).toBe(true);
			expect(regex.test('list_directory')).toBe(false);
		});

		test('matches by server/tool path', () => {
			const regex = globToRegex('filesystem/*');
			expect(regex.test('filesystem/read_file')).toBe(true);
			expect(regex.test('github/search_repos')).toBe(false);
		});

		test('matches tools across all servers', () => {
			const regex = globToRegex('**search*');
			expect(regex.test('search')).toBe(true);
			expect(regex.test('search_repos')).toBe(true);
			expect(regex.test('github/search_repos')).toBe(true);
			expect(regex.test('elasticsearch/search')).toBe(true);
		});
	});
});
