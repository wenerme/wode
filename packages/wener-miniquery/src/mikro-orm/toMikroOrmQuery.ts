import type { EntityManager, EntityName, QBFilterQuery } from '@mikro-orm/core';
import { parse } from './miniquery';

export function toMikroOrmQuery<T>(
  query?: string,
  options?: {
    em?: EntityManager;
    Entity?: EntityName<T>;
  },
): QBFilterQuery<T> {
  query = query?.trim();
  if (!query) {
    return [];
  }

  // https://mikro-orm.io/docs/query-conditions

  // console.log(`Query ${query}`);
  let out = parse(query, options);
  // console.log(`Query ${query}:`, out);
  return out;
}
