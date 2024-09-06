import { Errors } from '@wener/utils';
import { getEntityDef } from '../defineEntity';
import type { HasEntityRefEntity } from '../mixins';
import type { IdentifiableEntity } from '../types';

export interface BindEntityOptions {
  entity: HasEntityRefEntity;
  ref: IdentifiableEntity;
}

export function bindEntity({ entity, ref }: BindEntityOptions) {
  let def = getEntityDef(ref);
  Errors.BadRequest.check(def, 'unable to resolve entity def');

  entity.entityId = ref.id;
  entity.entityType = def.typeName;
  // todo check entity type is allowed
  return entity;
}
