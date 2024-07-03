import { QBFilterQuery, QueryOrder, type FilterQuery } from '@mikro-orm/core';
import type { QueryBuilder } from '@mikro-orm/postgresql';
import { toMikroOrmQuery } from '@wener/miniquery/mikro-orm';
import { Errors, MaybePromise } from '@wener/utils';
import { StandardBaseEntity } from '../StandardBaseEntity';
import { resolveSimpleSearch } from './applySearch';
import { normalizePagination } from './normalizePagination';
import { parseOrder } from './parseOrder';
import { resolveEntityContext, ResolveEntityContextOptions } from './resolveEntityContext';
import { toKnexOrder } from './toKnexOrder';

export interface FindAllEntityOptions<E extends StandardBaseEntity> {
  count?: boolean;
  data?: boolean;

  pageSize?: number;
  pageIndex?: number;
  pageNumber?: number;
  limit?: number;
  offset?: number;
  order?: string[];

  ids?: string[];
  search?: string;
  filter?: string;
  filters?: string[];
  deleted?: boolean;

  where?: FilterQuery<E>;
  onBuilder?: (builder: QueryBuilder<E>) => MaybePromise<void>;
}

export interface FindAllEntityResult<E extends StandardBaseEntity> {
  data: E[];
  total: number;
  builder: QueryBuilder<E>;
}

export async function findAllEntity<E extends StandardBaseEntity>(
  opts: FindAllEntityOptions<E>,
  resolveCtx: ResolveEntityContextOptions<E> & {
    applySearch?: (opts: { builder: QueryBuilder<E>; search: string }) => MaybePromise<void>;
    resolveSearch?: (opts: { search: string }) => MaybePromise<{
      and: any[];
      or: any[];
    }>;
  },
): Promise<FindAllEntityResult<E>> {
  const { resolveSearch = resolveSimpleSearch } = resolveCtx;
  const { createQueryBuilder } = resolveEntityContext(resolveCtx);
  const { builder } = await createQueryBuilder();

  // where
  {
    const { where, filter, filters = [], ids, search, deleted } = opts;

    if (where) {
      builder.andWhere(where);
    }

    for (let q of [filter, ...filters].map((v) => v?.trim()).filter(Boolean)) {
      try {
        builder.andWhere(toMikroOrmQuery(q) as QBFilterQuery);
      } catch (error: any) {
        throw Errors.BadRequest.asError({
          message: 'Invalid filter',
          description: error?.message as string,
        });
      }
    }

    if (ids?.length) {
      builder.andWhere({
        id: { $in: ids },
      });
    }
    if (search) {
      if (resolveCtx.applySearch) {
        await resolveCtx.applySearch({ builder, search });
      } else if (resolveSearch) {
        const { and = [], or = [] } = await resolveSearch({ search });
        and.length && builder.andWhere({ $and: and });
        or.length && builder.andWhere({ $or: or });
      }
    }

    // soft delete
    if (deleted === false) {
      builder.andWhere({
        deletedAt: null,
      });
    } else if (deleted === true) {
      builder.andWhere({
        deletedAt: { $ne: null },
      });
    }
  }

  // order
  {
    const { order } = opts;
    const orderRules = parseOrder(order);
    if (orderRules.length > 0) {
      builder.orderBy(toKnexOrder(orderRules));
    } else {
      builder.orderBy({ id: QueryOrder.DESC });
    }
  }

  // pagination
  {
    const { limit, offset } = normalizePagination(opts);
    limit > 0 && builder.limit(limit);
    offset > 0 && builder.offset(offset);
  }

  {
    const { onBuilder } = opts;
    if (onBuilder) {
      await onBuilder(builder);
    }
  }

  // execute
  let out: FindAllEntityResult<E> = {
    data: [],
    total: -1,
    builder,
  };
  {
    const { count: needTotal = true, data: needData = true } = opts;
    if (needTotal && needData) {
      const [data, count] = await builder.getResultAndCount();
      out.data = data;
      out.total = count;
    } else if (needTotal) {
      out.total = await builder.count();
    } else if (needData) {
      out.data = await builder.getResult();
    }
  }

  return out;
}
