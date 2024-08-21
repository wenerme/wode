export function normalizePagination({
  pageSize = normalizePagination.pageSize || 20,
  pageNumber = 1,
  pageIndex = pageNumber - 1,
  limit,
  offset,
}: {
  pageSize?: number;
  pageIndex?: number;
  pageNumber?: number;
  limit?: number;
  offset?: number;
} = {}) {
  return {
    limit: Math.max(limit || pageSize, 0),
    offset: Math.max(offset ?? pageIndex * pageSize, 0),
  };
}

/**
 * default page size
 */
normalizePagination.pageSize = undefined as undefined | number;
