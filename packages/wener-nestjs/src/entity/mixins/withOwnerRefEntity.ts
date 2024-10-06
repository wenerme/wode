import { Entity, Property, types, type Opt, type Ref } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { resolveEntityRef } from '../resolveEntityRef';
import { setOwnerRef } from '../setOwnerRef';
import type { IdentifiableEntity } from '../types';
import type { HasOwnerRefEntity } from './types';

export function withOwnerRefEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasOwnerRef])
  @Entity({ abstract: true })
  class HasOwnerRefMixinEntity extends Base implements HasOwnerRefEntity {
    @Property({ type: types.string, nullable: true })
    ownerId?: string;

    @Property({ type: types.string, nullable: true })
    ownerType?: string;

    setOwnerRef(entity?: IdentifiableEntity | string | null) {
      setOwnerRef(this, entity);
    }

    setOwnerFrom(entity?: HasOwnerRefEntity) {
      if (!entity) {
        return;
      }
      this.ownerId = entity.ownerId;
      this.ownerType = entity.ownerType;
    }

    set owner(entity: IdentifiableEntity | string | null) {
      this.setOwnerRef(entity);
    }

    get owner(): Ref<IdentifiableEntity> & Opt {
      return resolveEntityRef({ entityId: this.ownerId, entityType: this.ownerType });
    }
  }

  return HasOwnerRefMixinEntity;
}
