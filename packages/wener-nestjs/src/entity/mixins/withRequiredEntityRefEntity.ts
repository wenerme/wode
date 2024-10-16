import { Entity, Property, types, type Opt, type Ref } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { resolveEntityRef } from '../resolveEntityRef';
import { setEntityRef } from '../setEntityRef';
import type { IdentifiableEntity } from '../types';
import type { HasRequiredEntityRefEntity } from './types';

export function withRequiredEntityRefEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasEntityRef])
  @Entity({ abstract: true })
  class HasRequiredEntityRefMixinEntity extends Base implements HasRequiredEntityRefEntity {
    @Property({ type: types.string, nullable: false })
    entityId!: string;

    @Property({ type: types.string, nullable: false })
    entityType!: string;

    setEntityRef(entity: IdentifiableEntity | string) {
      setEntityRef(this, entity);
    }

    setEntityFrom(entity: HasRequiredEntityRefEntity) {
      if (!entity) {
        return;
      }
      this.entityId = entity.entityId;
      this.entityType = entity.entityType;
    }

    set entity(entity: IdentifiableEntity | string) {
      this.setEntityRef(entity);
    }

    get entity(): Ref<IdentifiableEntity> & Opt {
      return resolveEntityRef(this);
    }
  }

  return HasRequiredEntityRefMixinEntity;
}
