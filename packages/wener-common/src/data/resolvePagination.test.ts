import { expect, test } from 'vitest';
import { resolvePagination } from './resolvePagination';

test(resolvePagination.name, () => {
	const testCases: Array<[string, any, any]> = [
		[
			'pageSize with null pageIndex',
			{ pageSize: '10', pageIndex: null },
			{ limit: 10, offset: 0, pageSize: 10, pageNumber: 1, pageIndex: 0 },
		],
		[
			'pageSize with pageIndex',
			{ pageSize: '10', pageIndex: 1 },
			{ limit: 10, offset: 10, pageSize: 10, pageNumber: 2, pageIndex: 1 },
		],
		[
			'pageSize with pageIndex 2',
			{ pageSize: '10', pageIndex: 2 },
			{ limit: 10, offset: 20, pageSize: 10, pageNumber: 3, pageIndex: 2 },
		],
		[
			'limit with null offset',
			{ limit: '10', offset: null },
			{ limit: 10, offset: 0, pageSize: 10, pageNumber: 1, pageIndex: 0 },
		],
		[
			'limit with offset',
			{ limit: '10', offset: '20' },
			{ limit: 10, offset: 20, pageSize: 10, pageNumber: 3, pageIndex: 2 },
		],
		[
			'null limit with offset',
			{ limit: null, offset: '20' },
			{ limit: 20, offset: 20, pageSize: 20, pageNumber: 2, pageIndex: 1 },
		],
		['empty input', {}, { limit: 20, offset: 0, pageSize: 20, pageNumber: 1, pageIndex: 0 }],
		[
			'negative values',
			{ pageSize: '-5', pageIndex: '-1', limit: '-10', offset: '-20' },
			{ limit: 1, offset: 0, pageSize: 1, pageNumber: 1, pageIndex: 0 },
		],
		[
			'custom pageNumber',
			{ pageNumber: 3, pageSize: 15 },
			{ limit: 15, offset: 30, pageSize: 15, pageNumber: 3, pageIndex: 2 },
		],
	];

	for (const [description, input, expected] of testCases) {
		const result = resolvePagination(input);
		expect(result, description).toMatchObject(expected);
	}
});

test(`${resolvePagination.name} with options`, () => {
	expect(resolvePagination({ pageSize: '200' }, { maxLimit: 50 })).toMatchObject({ pageSize: 50, limit: 50 });
	expect(resolvePagination({}, { pageSize: 30 })).toMatchObject({ pageSize: 30, limit: 30 });
});
