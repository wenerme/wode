import { EntityName } from '@mikro-orm/core';
import { SqlEntityManager } from '@mikro-orm/sqlite';
import { parse } from './miniquery';

export function toMikroOrmQuery(
  query?: string,
  options?: {
    em?: SqlEntityManager;
    Entity?: EntityName<any>;
  },
) {
  query = query?.trim();
  if (!query) {
    return;
  }
  // console.log(`Query ${query}`);
  let out = parse(query, options);
  // console.log(`Query ${query}:`, out);
  return out;
}
