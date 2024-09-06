import type { EntityClass } from '@mikro-orm/core';
import type { QueryBuilder } from '@mikro-orm/postgresql';
import { Features } from '../../Feature';
import { EntityFeature } from '../enum';
import { StandardBaseEntity } from '../StandardBaseEntity';
import { resolveSearch, type ResolveSearchOptions } from './resolveSearch';

export interface ApplySearchOptions
  extends ResolveSearchOptions<{
    and: any[];
    or: any[];
  }> {
  search?: string;
}

export interface ResolveEntitySearchOptions
  extends ResolveSearchOptions<{
    and: any[];
    or: any[];
  }> {
  search?: string;
  Entity?: EntityClass<any>;
  hasFeature?: (s: string) => boolean;
}

export function resolveEntitySearch({
  Entity = StandardBaseEntity,
  hasFeature = (s: string) => Features.hasFeature(Entity, s),
  ...opts
}: ResolveEntitySearchOptions) {
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
    onKeyLike = (s, { or }) => {
      or.push({ eid: s });
      if (hasFeature(EntityFeature.HasVendorRef)) {
        or.push({ rid: s });
      }
      if (hasFeature(EntityFeature.HasCode)) {
        or.push({ code: { $eq: search } });
      }
    },
    onUSCC = (uscc, { and, or }) => {
      if (hasFeature(EntityFeature.HasUSCC)) {
        and.push({ uscc: { $eq: uscc } });
      }
    },
    onSearch = (search, { and, or }) => {
      if (hasFeature(EntityFeature.HasNotes)) {
        or.push({ notes: { $ilike: `%${search}%` } });
      }
      if (hasFeature(EntityFeature.HasTitleDescription)) {
        or.push(
          { title: { $ilike: `%${search}%` } },
          //
          { description: { $ilike: `%${search}%` } },
        );
      }
    },
    ...rest
  } = opts;

  resolveSearch(search, {
    onTypedKey,
    onULID,
    onUUID,
    onKeyLike,
    onUSCC,
    onSearch,
    context: ctx,
    ...rest,
  });

  return ctx;
}

/**
 * @deprecated
 */
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
