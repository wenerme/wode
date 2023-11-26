export function resolveLimitOffset(page: {
  pageSize?: number;
  pageIndex?: number;
  pageNumber?: number;
  limit?: number;
  offset?: number;
}) {
  let { pageSize = 20, pageIndex, pageNumber, limit, offset } = page;
  return {
    limit: limit || pageSize,
    offset: offset || (pageIndex || pageNumber || 0) * pageSize,
  };
}
