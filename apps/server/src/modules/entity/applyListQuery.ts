import { QueryOrder } from '@mikro-orm/core';
import type { QueryBuilder } from '@mikro-orm/postgresql';
import { normalizePagination } from '@wener/console';
import { parseOrder } from '@wener/console';
import { toKnexOrder } from './toKnexOrder';

export function applyListQuery<T extends QueryBuilder<any>>({
  builder,
  query,
}: {
  builder: T;
  query: {
    pageSize?: number;
    pageIndex?: number;
    pageNumber?: number;
    order?: string;
    deleted?: boolean;
    limit?: number;
    offset?: number;
  };
}) {
  {
    const { limit, offset } = normalizePagination(query);
    builder.limit(limit || 20).offset(offset);
  }

  const order = parseOrder(query.order);
  if (order.length > 0) {
    builder.orderBy(toKnexOrder(order));
  } else {
    builder.orderBy({ id: QueryOrder.DESC });
  }

  if (!query.deleted) {
    builder = builder.andWhere({
      deletedAt: null,
    });
  }

  return builder;
}
