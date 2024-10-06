import type { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { getEntityManager, runInTransaction } from '@wener/nestjs/mikro-orm';
import { AuditLogEntity } from './AuditLogEntity';
import { collectAuditData } from './collectAuditData';

export function writeAuditLog({
  em,
  entity,
  flush,
}: {
  entity: RequiredEntityData<AuditLogEntity>;
  em?: EntityManager;
  flush?: boolean;
}) {
  // fixme AppContext may not ready
  if (!em) {
    em = getEntityManager({ fork: true });
    if (em) {
      flush = true;
    }
  }

  // we can always flush by run in new tx
  if (!em && !flush) {
    throw new Error('No entity manager in audit context');
  }

  entity = collectAuditData(entity as AudioData);

  if (!(entity instanceof AuditLogEntity)) {
    entity = em.getRepository(AuditLogEntity).create(entity);
  }

  if (flush) {
    return runInTransaction(
      async (em) => {
        await em.persistAndFlush(entity);
        return entity;
      },
      { em: em as any },
    );
  }

  em.persist(entity);

  return entity;
}
