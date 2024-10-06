export function normalizePagination(page: {
  pageSize?: number;
  pageIndex?: number;
  pageNumber?: number;
  limit?: number;
  offset?: number;
}) {
  let { pageSize = 20, pageNumber = 1, pageIndex = pageNumber - 1, limit, offset } = page;
  return {
    limit: limit || pageSize,
    offset: offset ?? pageIndex * pageSize,
  };
}
