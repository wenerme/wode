import type { EntityManager, EntityName, QBFilterQuery } from '@mikro-orm/core';
import { parse } from './miniquery';

export function toMikroOrmQuery(
  query?: string,
  options?: {
    em?: EntityManager;
    Entity?: EntityName<any>;
  },
): QBFilterQuery<any> {
  query = query?.trim();
  if (!query) {
    return [];
  }
  // console.log(`Query ${query}`);
  let out = parse(query, options);
  // console.log(`Query ${query}:`, out);
  return out;
}
