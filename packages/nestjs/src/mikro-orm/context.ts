import type { EntityManager, IDatabaseDriver } from '@mikro-orm/core';
import { MikroORM, RequestContext, type TransactionOptions } from '@mikro-orm/core';
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

export function getEntityManager<D extends IDatabaseDriver = IDatabaseDriver>({
  fork,
  em,
}: {
  fork?: true;
  em?: EntityManager<D>;
} = {}): EntityManager<D> {
  em ||= RequestContext.getEntityManager() as EntityManager<D>;
  if (em && !fork) {
    return em;
  }
  const orm = getMikroORM<D>();
  em = orm.em as EntityManager<D>;
  if (fork) {
    em = em.fork() as EntityManager<D>;
  }
  return em as EntityManager<D>;
}

export function requireContextEntityManager<D extends IDatabaseDriver = IDatabaseDriver>() {
  const context = RequestContext.getEntityManager();
  if (!context) {
    throw new Error('No entity manager context');
  }

  return context as EntityManager<D>;
}

export function runInTransaction<R, D extends IDatabaseDriver = IDatabaseDriver>(
  fn: (em: EntityManager<D>) => MaybePromise<R>,
  { em, ...opts }: TransactionOptions & { em?: EntityManager } = {},
): Promise<R> {
  return getEntityManager({ em }).transactional(fn as any, opts);
}
