import type { EntityClass, Opt, Ref } from '@mikro-orm/core';
import { Errors } from '@wener/utils';
import { getEntityManager } from '../mikro-orm';
import { getEntityDef } from './defineEntity';
import { IdentifiableEntity } from './types';

export function resolveEntityRef<E = IdentifiableEntity>(o: { entityId: string; entityType?: string }): Ref<E> & Opt;
export function resolveEntityRef<E = IdentifiableEntity>(Entity: EntityClass<E>, id?: string): Ref<E> & Opt;
export function resolveEntityRef<E = IdentifiableEntity>(o: {
  entityId?: string;
  entityType?: string;
}): (undefined | Ref<E>) & Opt;
export function resolveEntityRef(...args: any[]) {
  if (args[0] instanceof Function) {
    const [Entity, id] = args;
    if (!id) {
      return;
    }
    return getEntityManager().getReference(Entity, id as string, { wrapped: true }) as any;
  }

  const [{ entityId, entityType }] = args;
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
