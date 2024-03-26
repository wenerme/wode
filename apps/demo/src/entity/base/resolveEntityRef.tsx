import type { Opt, Ref } from '@mikro-orm/core';
import { getEntityManager } from '@wener/nestjs/mikro-orm';
import { Errors } from '@wener/utils';
import { StandardBaseEntity } from '@/entity/base/StandardBaseEntity';
import { parseTypeId } from './parseTypeId';

export function resolveEntityRef(o: { entityId: string; entityType?: string }): Ref<StandardBaseEntity> & Opt;
export function resolveEntityRef(o: {
  entityId?: string;
  entityType?: string;
}): Opt<Ref<StandardBaseEntity> | undefined>;
export function resolveEntityRef({ entityId, entityType }: { entityId?: string; entityType?: string }) {
  if (!entityId) {
    return;
  }
  const type = entityType || getEntityMetadataByTag(parseTypeId(entityId)[0])?.name;
  Errors.InternalServerError.check(type, `Unknown entity type: ${entityId}`);
  return getEntityManager().getReference(`${type}Entity`, entityId as string, {
    wrapped: true,
  });
}

export function getEntityMetadataByTag(tag?: string) {
  return { name: '' };
}
