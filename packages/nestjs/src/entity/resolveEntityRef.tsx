import type { Opt, Ref } from '@mikro-orm/core';
import { getEntityManager } from '@wener/nestjs/mikro-orm';
import { Errors } from '@wener/utils';
import { parseEntityTypeId } from './parseEntityTypeId';
import { StandardBaseEntity } from './StandardBaseEntity';

export function resolveEntityRef<T extends StandardBaseEntity>(entityId: string): Opt<Ref<T>>;
export function resolveEntityRef<T extends StandardBaseEntity>(entityId?: string): Opt<Ref<T> | undefined>;
export function resolveEntityRef<T extends StandardBaseEntity>(o: {
  entityId: string;
  entityType?: string;
}): Ref<T> & Opt;
export function resolveEntityRef<T extends StandardBaseEntity>(o: {
  entityId?: string;
  entityType?: string;
}): Opt<Ref<T> | undefined>;
export function resolveEntityRef(args: any) {
  const { entityId, entityType } = typeof args === 'string' ? { entityId: args, entityType: undefined } : args;

  if (!entityId) {
    return;
  }
  const type = entityType || getEntityNameByTypeTag(parseEntityTypeId(entityId)[0]);
  Errors.InternalServerError.check(type, `Unknown entity type: ${entityId}`);
  return getEntityManager().getReference(`${type}Entity`, entityId as string, {
    wrapped: true,
  });
}

export function getEntityNameByTypeTag(tag?: string | null) {
  return;
}

/*
EntityName -> EntityClass
`${TypeName}Entity` -> EntityName
tag -> TypeName
*/
