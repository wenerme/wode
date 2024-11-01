import { MikroORM, RequestContext, type TransactionOptions } from '@mikro-orm/core';
import type { EntityManager, PostgreSqlDriver } from '@mikro-orm/postgresql';
import type { MaybeFunction, MaybePromise } from '@wener/utils';
import { getContext } from '../app.context';

let _provider = () => getContext(MikroORM);

export function setMikroORM(orm: MaybeFunction<MikroORM<any>>) {
  _provider = typeof orm === 'function' ? orm : () => orm;
}

export function getMikroORM(): MikroORM<PostgreSqlDriver> {
  return _provider() as MikroORM<PostgreSqlDriver>;
}

export function getEntityManager({ fork }: { fork?: true } = {}) {
  let em = RequestContext.getEntityManager() as EntityManager<PostgreSqlDriver>;
  if (em && !fork) {
    return em;
  }
  const orm = getMikroORM();
  em = orm.em;
  if (fork) {
    em = em.fork();
  }
  return em;
}

export function requireContextEntityManager() {
  const context = RequestContext.getEntityManager();
  if (!context) {
    throw new Error('No entity manager context');
  }
  return context as EntityManager<PostgreSqlDriver>;
}

export function runInTransaction<T>(
  fn: (em: EntityManager<PostgreSqlDriver>) => MaybePromise<T>,
  opts?: TransactionOptions,
): Promise<T> {
  return getEntityManager().transactional(fn as any, opts);
}
