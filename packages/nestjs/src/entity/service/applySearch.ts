import { QueryBuilder } from '@mikro-orm/postgresql';
import { resolveSearch, ResolveSearchOptions } from './resolveSearch';

export interface ApplySearchOptions
  extends ResolveSearchOptions<{
    and: any[];
    or: any[];
  }> {
  search?: string;
}

export function resolveSimpleSearch(opts: ApplySearchOptions) {
  const ctx: { and: any[]; or: any[] } = { or: [], and: [] };
  const {
    search,
    onTypedKey = (s, ctx) => {
      ctx.and.push({ id: s });
    },
    onULID = (s, ctx) => {
      ctx.and.push({ id: s });
    },
    onUUID = (s, ctx) => {
      ctx.and.push({ uid: s });
    },
    onKeyLike = (s, ctx) => {
      ctx.or.push({ rid: s }, { eid: s });
    },
    ...rest
  } = opts;

  resolveSearch(search, {
    onTypedKey,
    onULID,
    onUUID,
    onKeyLike,
    context: ctx,
    ...rest,
  });

  return ctx;
}

export function applySearch<T extends QueryBuilder<any>>(
  o: {
    builder: T;
  } & ApplySearchOptions,
) {
  const ctx = { or: [], and: [] };
  // fixme check field exists
  const {
    builder,
    search,
    onTypedKey = (s, ctx) => {
      ctx.and.push({ id: s });
    },
    onULID = (s, ctx) => {
      ctx.and.push({ id: s });
    },
    onUUID = (s, ctx) => {
      ctx.and.push({ uid: s });
    },
    onKeyLike = (s, ctx) => {
      ctx.or.push({ rid: s }, { eid: s });
    },
    ...rest
  } = o;

  resolveSearch(search, {
    onTypedKey,
    onULID,
    onUUID,
    onKeyLike,
    context: ctx,
    ...rest,
  });
  if (ctx.and.length) {
    builder.andWhere({ $and: ctx.and });
  } else if (ctx.or.length) {
    builder.andWhere({ $or: ctx.or });
  }
}
