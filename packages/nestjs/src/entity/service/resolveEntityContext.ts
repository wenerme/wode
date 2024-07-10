import type { EntityManager, EntityRepository, QueryBuilder } from '@mikro-orm/postgresql';
import { MaybePromise } from '@wener/utils';
import { getEntityManager } from '../../mikro-orm';
import { EntityDef, getEntityDef } from '../defineEntity';
import { StandardBaseEntity } from '../StandardBaseEntity';
import { EntityClass } from './EntityClass';

export interface ResolveEntityContextOptions<E extends StandardBaseEntity> {
  Entity: EntityClass<E>;
  repo?: EntityRepository<E>;
  em?: EntityManager;
  def?: EntityDef;

  builder?: QueryBuilder<E>;
  createQueryBuilder?: () => MaybePromise<{ builder: QueryBuilder<E> }>; // avoid async cause exec
}

export interface ResolvedEntityContext<E extends StandardBaseEntity> {
  Entity: EntityClass<E>;
  repo: EntityRepository<E>;
  em: EntityManager;
  def?: EntityDef;

  // builder: QueryBuilder<E>;
  createQueryBuilder(): Promise<{ builder: QueryBuilder<E> }>;
}

export function resolveEntityContext<E extends StandardBaseEntity>(
  ctx: ResolveEntityContextOptions<E>,
): ResolvedEntityContext<E> {
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
    async createQueryBuilder() {
      let v = builder;
      if (!v && createQueryBuilder) {
        ({ builder: v } = await createQueryBuilder.call(ctx));
      }
      if (!v) {
        v = repo.qb();
      }
      return { builder: v };
    },
  };
}
