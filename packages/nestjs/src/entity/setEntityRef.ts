import { Errors } from '@wener/utils';
import { getEntityDef } from './defineEntity';
import { IdentifiableEntity } from './setOwnerRef';

export function setEntityRef<
  T extends {
    entityId?: string;
    entityType?: string;
  },
>(out: T = {} as T, entity?: IdentifiableEntity | string | null): T {
  if (!entity) {
    out.entityId = undefined;
    out.entityType = undefined;
    return out;
  }
  let def = getEntityDef(entity);
  Errors.InternalServerError.check(def, `Invalid entity ${entity}`);
  out.entityId = typeof entity === 'string' ? entity : entity.id;
  out.entityType = def.typeName;
  // todo check type ?
  return out;
}
