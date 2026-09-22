import { expect, test } from 'vitest';
import { formatSort } from './formatSort';

test('formatSort', () => {
	expect(formatSort([{ field: 'name', order: 'asc' }])).toEqual(['name asc']);
	expect(formatSort([{ field: 'age', order: 'desc', nulls: 'last' }])).toEqual(['age desc nulls last']);
	expect(
		formatSort([
			{ field: 'name', order: 'asc' },
			{ field: 'age', order: 'desc' },
		]),
	).toEqual(['name asc', 'age desc']);
});
