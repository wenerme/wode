import { describe, expect, test } from 'vitest';
import { parseSort } from './parseSort';

describe('parseSort', () => {
	describe('basic parsing', () => {
		test('handles empty inputs', () => {
			expect(parseSort('')).toEqual([]);
			expect(parseSort([])).toEqual([]);
			expect(parseSort(null)).toEqual([]);
			expect(parseSort(undefined)).toEqual([]);
		});

		test('handles simple field names', () => {
			expect(parseSort('a')).toEqual([{ field: 'a', order: 'asc' }]);
			expect(parseSort(['a'])).toEqual([{ field: 'a', order: 'asc' }]);
			expect(parseSort('a.b')).toEqual([{ field: 'a.b', order: 'asc' }]);
		});

		test('handles prefix notation', () => {
			expect(parseSort('-a')).toEqual([{ field: 'a', order: 'desc' }]);
			expect(parseSort('+b')).toEqual([{ field: 'b', order: 'asc' }]);
			expect(parseSort('-a,+b')).toEqual([
				{ field: 'a', order: 'desc' },
				{ field: 'b', order: 'asc' },
			]);
		});
	});

	describe('explicit ordering', () => {
		test('handles explicit order keywords', () => {
			expect(parseSort('a asc')).toEqual([{ field: 'a', order: 'asc' }]);
			expect(parseSort('a desc')).toEqual([{ field: 'a', order: 'desc' }]);
			expect(parseSort('-a asc')).toEqual([{ field: 'a', order: 'asc' }]); // explicit order overrides prefix
		});
	});

	describe('nulls handling', () => {
		test('handles nulls specification', () => {
			expect(parseSort('a asc nulls last')).toEqual([{ field: 'a', order: 'asc', nulls: 'last' }]);
			expect(parseSort('a asc nulls first')).toEqual([{ field: 'a', order: 'asc', nulls: 'first' }]);
			expect(parseSort('a desc nulls last')).toEqual([{ field: 'a', order: 'desc', nulls: 'last' }]);
			expect(parseSort('a nulls first')).toEqual([{ field: 'a', order: 'asc', nulls: 'first' }]);
			expect(parseSort('-a nulls first')).toEqual([{ field: 'a', order: 'desc', nulls: 'first' }]);

			// Alternative syntax
			expect(parseSort('a asc last')).toEqual([{ field: 'a', order: 'asc', nulls: 'last' }]);
		});
	});

	describe('object notation', () => {
		test('handles object input', () => {
			expect(parseSort([{ field: 'a', order: 'asc' }])).toEqual([{ field: 'a', order: 'asc' }]);
			expect(parseSort([{ field: 'a', order: 'asc', nulls: 'last' }])).toEqual([
				{ field: 'a', order: 'asc', nulls: 'last' },
			]);
		});
	});

	describe('invalid inputs', () => {
		test('handles invalid inputs gracefully', () => {
			expect(parseSort([{ order: 'asc' }])).toEqual([]);
			expect(parseSort(['a,,', { field: '', order: 'asc' }])).toEqual([{ field: 'a', order: 'asc' }]);
			expect(parseSort([',,', { field: 'a', order: 'asc' }])).toEqual([{ field: 'a', order: 'asc' }]);
		});
	});
});
