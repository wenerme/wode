import type { Opt, Ref } from '@mikro-orm/core';
import { Errors } from '@wener/utils';
import { getEntityManager } from '../mikro-orm';
import { getEntityDef } from './defineEntity';
import { IdentifiableEntity } from './types';

export function resolveEntityRef<E = IdentifiableEntity>(o: { entityId: string; entityType?: string }): Ref<E> & Opt;
export function resolveEntityRef<E = IdentifiableEntity>(o: {
  entityId?: string;
  entityType?: string;
}): (undefined | Ref<E>) & Opt;
export function resolveEntityRef({ entityId, entityType }: { entityId?: string; entityType?: string }) {
  if (!entityId) {
    return;
  }
  let def = getEntityDef(entityId);
  let Entity = def?.Entity;
  Errors.InternalServerError.check(Entity, `Unknown entity type: ${entityId}`);
  Errors.InternalServerError.check(
    !entityType || entityType === def?.typeName,
    `Entity type mismatch: ${entityType} != ${def?.typeName}`,
  );

  return getEntityManager().getReference(Entity, entityId as string, {
    wrapped: true,
  }) as any;
}
