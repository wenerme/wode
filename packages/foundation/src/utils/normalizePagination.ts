export function normalizePagination({
  pageSize = normalizePagination.defaultPageSize || 20,
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
  limit = Math.max(limit || pageSize, 0);
  offset = Math.max(offset ?? pageIndex * pageSize, 0);
  pageNumber = Math.floor(offset / limit) + 1;

  return {
    limit: limit,
    offset: offset,
    pageSize: limit,
    pageNumber: pageNumber,
    pageIndex: pageNumber - 1,
  };
}

/**
 * default page size
 */
normalizePagination.defaultPageSize = undefined as undefined | number;
