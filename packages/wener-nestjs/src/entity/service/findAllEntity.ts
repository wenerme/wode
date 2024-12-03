import { QueryOrder, type EntityClass, type FilterQuery, type QBFilterQuery } from '@mikro-orm/core';
import type { QueryBuilder } from '@mikro-orm/postgresql';
import { normalizePagination, parseSort } from '@wener/common';
import { toMikroOrmQuery } from '@wener/miniquery/mikro-orm';
import { Errors, type MaybePromise } from '@wener/utils';
import type { StandardBaseEntity } from '../StandardBaseEntity';
import { resolveEntitySearch } from './applySearch';
import { resolveEntityContext, type ResolveEntityContextOptions } from './resolveEntityContext';
import { toKnexOrder } from './toKnexOrder';

export interface FindAllEntityOptions<E extends StandardBaseEntity> {
  count?: boolean; // should count total
  data?: boolean; // should fetch data

  pageSize?: number;
  pageIndex?: number;
  pageNumber?: number;
  limit?: number;
  offset?: number;
  order?: string[];

  search?: string;

  ids?: string[];
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
    Entity?: EntityClass<any>;
    applySearch?: (opts: { builder: QueryBuilder<E>; search: string }) => MaybePromise<void>;
    resolveSearch?: (opts: { search: string }) => MaybePromise<{
      and: any[];
      or: any[];
    }>;
  },
): Promise<FindAllEntityResult<E>> {
  const { Entity, resolveSearch = ({ search }) => resolveEntitySearch({ search, Entity }) } = resolveCtx;
  const { createQueryBuilder } = resolveEntityContext(resolveCtx);
  const { builder } = await createQueryBuilder();

  // where
  {
    const { where, search } = opts;

    if (where) {
      builder.andWhere(where);
    }

    {
      const and = buildFilterQuery(opts);
      and.length && builder.andWhere({ $and: and });
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
  }

  // order
  {
    const { order } = opts;
    const orderRules = parseSort(order);
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

function buildFilterQuery({
  ids,
  filters = [],
  filter,
  deleted,
}: {
  ids?: string[];
  filter?: string;
  filters?: string[];
  deleted?: boolean;
}) {
  let all: FilterQuery<{
    id: string;
    deletedAt?: Date;
  }>[] = [];
  if (ids?.length) {
    all.push({
      id: { $in: ids },
    });
  }
  if (filter) {
    filters = [filter, ...filters];
  }
  for (let q of filters.map((v) => v?.trim()).filter(Boolean)) {
    try {
      all.push(toMikroOrmQuery(q) as QBFilterQuery);
    } catch (error: any) {
      throw Errors.BadRequest.asError({
        message: 'Invalid filter',
        description: error?.message as string,
      });
    }
  }

  if (deleted === false) {
    all.push({
      deletedAt: null,
    });
  } else if (deleted === true) {
    all.push({
      deletedAt: { $ne: null },
    });
  }
  return all;
}
