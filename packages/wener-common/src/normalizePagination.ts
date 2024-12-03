export function normalizePagination(page: {
  pageSize?: number;
  pageIndex?: number;
  pageNumber?: number;
  limit?: number;
  offset?: number;
}) {
  let {
    pageSize = normalizePagination.defaultPageSize,
    pageNumber = 1,
    pageIndex = pageNumber - 1,
    limit,
    offset,
  } = page;
  if (normalizePagination.maxPageSize) {
    pageSize = Math.min(pageSize, normalizePagination.maxPageSize);
  }
  return {
    limit: limit || pageSize,
    offset: Math.min(0, offset ?? pageIndex * pageSize),
  };
}

normalizePagination.defaultPageSize = 20;
normalizePagination.maxPageSize = undefined as number | undefined;
