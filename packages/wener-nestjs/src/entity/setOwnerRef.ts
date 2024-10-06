import { Errors } from '@wener/utils';
import { getEntityDef } from './defineEntity';
import type { IdentifiableEntity } from './types';

export function setOwnerRef<
  T extends {
    ownerId?: string;
    ownerType?: string;
  },
>(out: T = {} as T, entity?: IdentifiableEntity | string | null): T {
  if (!entity) {
    out.ownerId = undefined;
    out.ownerType = undefined;
    return out;
  }
  let def = getEntityDef(entity);
  Errors.InternalServerError.check(def, `Invalid owner ${entity}`);
  out.ownerId = typeof entity === 'string' ? entity : entity.id;
  out.ownerType = def.typeName;
  // todo check type ?
  return out;
}
