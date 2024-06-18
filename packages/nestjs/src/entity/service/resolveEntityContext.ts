import type { EntityManager, EntityRepository, QueryBuilder } from '@mikro-orm/postgresql';
import { getEntityManager } from '../../mikro-orm';
import { EntityDef, getEntityDef } from '../defineEntity';
import { StandardBaseEntity } from '../StandardBaseEntity';
import { EntityClass } from './EntityBaseService';

export interface ResolveEntityContextOptions<E extends StandardBaseEntity> {
  Entity: EntityClass<E>;
  repo?: EntityRepository<E>;
  em?: EntityManager;
  def?: EntityDef;

  builder?: QueryBuilder<E>;
  createQueryBuilder?: () => QueryBuilder<E>;
}

export interface EntityContext<E extends StandardBaseEntity> {
  Entity: EntityClass<E>;
  repo: EntityRepository<E>;
  em: EntityManager;
  def?: EntityDef;

  builder: QueryBuilder<E>;
}

export function resolveEntityContext<E extends StandardBaseEntity>(
  ctx: ResolveEntityContextOptions<E>,
): EntityContext<E> {
  const {
    Entity,
    em = getEntityManager() as EntityManager,
    repo = em.getRepository(Entity) as EntityRepository<E>,
    def = getEntityDef(Entity),
    createQueryBuilder,
    builder,
  } = ctx;
  return {
    Entity,
    repo,
    em,
    def,
    get builder(): QueryBuilder<E> {
      if (builder) {
        return builder;
      }
      if (createQueryBuilder) {
        return createQueryBuilder.call(ctx);
      }
      return repo.qb();
    },
  };
}
