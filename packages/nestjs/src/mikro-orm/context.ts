import type { IDatabaseDriver } from '@mikro-orm/core';
import { type EntityManager, MikroORM, RequestContext } from '@mikro-orm/core';
import { type TransactionOptions } from '@mikro-orm/core/enums';
import { type MaybePromise } from '@wener/utils';
import { getContext } from '../context';

/*
这个文件是重复的，有几个问题，导致 optional 依赖被强制引入

- https://github.com/mikro-orm/mikro-orm/issues/3743
- https://github.com/mikro-orm/mikro-orm/blob/522c3e583186c98bd6090d734fcc2fae88c520d2/packages/core/src/utils/Configuration.ts#L136-L143
- https://github.com/vercel/next.js/issues/47494
 */

export function getMikroORM<D extends IDatabaseDriver = IDatabaseDriver>() {
  return getContext(MikroORM<D>);
}

export function getEntityManager<D extends IDatabaseDriver = IDatabaseDriver>({ fork }: { fork?: true } = {}) {
  let em = RequestContext.getEntityManager() as EntityManager<D>;
  if (em && !fork) {
    return em;
  }
  const orm = getMikroORM<D>();
  em = orm.em as any;
  if (fork) {
    em = em.fork() as any;
  }
  return em;
}

export function requireContextEntityManager<D extends IDatabaseDriver = IDatabaseDriver>() {
  const context = RequestContext.getEntityManager();
  if (!context) {
    throw new Error('No entity manager context');
  }
  return context as EntityManager<D>;
}

export function runInTransaction<T, D extends IDatabaseDriver = IDatabaseDriver>(
  fn: (em: EntityManager<D>) => MaybePromise<T>,
  opts?: TransactionOptions,
): Promise<T> {
  return getEntityManager().transactional(fn as any, opts);
}
