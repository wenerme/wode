import { QueryBuilder } from '@mikro-orm/postgresql';
import { resolveSearch, ResolveSearchOptions } from './resolveSearch';

export function applySearch<T extends QueryBuilder<any>>(
  o: {
    search?: string;
    builder: T;
  } & ResolveSearchOptions<{
    and: any[];
    or: any[];
  }>,
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
