import { MikroORM, RequestContext, type EntityManager, type TransactionOptions } from '@mikro-orm/core';
import { type MaybePromise } from '@wener/utils';
import { getContext } from '../context';

/*
这个文件是重复的，有几个问题，导致 optional 依赖被强制引入

- https://github.com/mikro-orm/mikro-orm/issues/3743
- https://github.com/mikro-orm/mikro-orm/blob/522c3e583186c98bd6090d734fcc2fae88c520d2/packages/core/src/utils/Configuration.ts#L136-L143
- https://github.com/vercel/next.js/issues/47494
 */

export function getMikroORM<M extends MikroORM = MikroORM>() {
  return getContext(MikroORM) as M;
}

export function getEntityManager<E extends EntityManager = EntityManager>({
  fork,
  em,
}: {
  fork?: true;
  em?: E;
} = {}): E {
  em ||= RequestContext.getEntityManager() as E;
  if (em && !fork) {
    return em;
  }
  const orm = getMikroORM();
  em = orm.em as E;
  if (fork) {
    em = em.fork() as E;
  }
  return em as E;
}

export function requireContextEntityManager<E extends EntityManager = EntityManager>() {
  const context = RequestContext.getEntityManager();
  if (!context) {
    throw new Error('No entity manager context');
  }

  return context as E;
}

export function runInTransaction<R, E extends EntityManager = EntityManager>(
  fn: (em: E) => MaybePromise<R>,
  { em, ...opts }: TransactionOptions & { em?: E } = {},
): Promise<R> {
  return getEntityManager({ em }).transactional(fn as any, opts);
}
