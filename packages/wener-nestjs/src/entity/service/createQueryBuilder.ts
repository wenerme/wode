import type { EntityManager, QueryBuilder } from '@mikro-orm/postgresql';
import type { StandardBaseEntity } from '../StandardBaseEntity';
import type { EntityClass } from './EntityClass';

export async function createQueryBuilder<E extends StandardBaseEntity>(
  em: EntityManager,
  Entity: EntityClass<E>,
): Promise<{
  builder: QueryBuilder<E, string>;
}> {
  // 使用 qb 必须手动 applyFilter
  // 让 TidFilter 生效
  const builder = em.createQueryBuilder(Entity, undefined, undefined, {
    // enabled: getDatabaseContext().debug,
  });
  let cond = await em.applyFilters<E>(Entity.name, {}, {}, 'read');
  cond && builder.andWhere(cond);
  // await builder will execute
  return { builder };
}
