export function normalizePagination(page: {
  pageSize?: number;
  pageIndex?: number;
  pageNumber?: number;
  limit?: number;
  offset?: number;
}) {
  const { pageSize, pageIndex, pageNumber, limit, offset } = page;
  return {
    limit: limit || pageSize,
    offset: offset || (pageIndex || pageNumber || 0) * (pageSize || 30),
  };
}
