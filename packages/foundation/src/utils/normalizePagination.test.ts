import { expect, test } from 'vitest';
import { normalizePagination } from './normalizePagination';

test('normalizePagination', () => {
  for (const [a, b] of [
    //
    [, { pageSize: 20, pageNumber: 1, pageIndex: 0, limit: 20, offset: 0 }],
    [{ pageNumber: 2 }, { pageSize: 20, pageNumber: 2, pageIndex: 1, limit: 20, offset: 20 }],
    [{ pageIndex: 1 }, { pageSize: 20, pageNumber: 2, pageIndex: 1, limit: 20, offset: 20 }],
    [
      { limit: 40, offset: 40 },
      { pageSize: 40, pageNumber: 2, pageIndex: 1, limit: 40, offset: 40 },
    ],
    // not enough for a page
    [
      { limit: 10, offset: 5 },
      { pageSize: 10, pageNumber: 1, pageIndex: 0, limit: 10, offset: 5 },
    ],
    [
      { limit: 44, offset: 99 },
      { pageSize: 44, pageNumber: 3, pageIndex: 2, limit: 44, offset: 99 },
    ],
  ]) {
    expect(normalizePagination(a)).toEqual(b);
  }
});
