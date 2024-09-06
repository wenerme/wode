import { Entity, type Opt, Property, type Ref, types } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { resolveEntityRef } from '../resolveEntityRef';
import { setEntityRef } from '../setEntityRef';
import type { IdentifiableEntity } from '../types';
import type { HasEntityRefEntity } from './types';

export function withEntityRefEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasEntityRef])
  @Entity({ abstract: true })
  class HasEntityRefMixinEntity extends Base implements HasEntityRefEntity {
    @Property({ type: types.string, nullable: true })
    entityId?: string;

    @Property({ type: types.string, nullable: true })
    entityType?: string;

    setEntityRef(entity?: IdentifiableEntity | string | null) {
      setEntityRef(this, entity);
    }

    setEntityFrom(entity?: HasEntityRefEntity) {
      if (!entity) {
        return;
      }
      this.entityId = entity.entityId;
      this.entityType = entity.entityType;
    }

    set entity(entity: IdentifiableEntity | string | null) {
      this.setEntityRef(entity);
    }

    get entity(): Ref<IdentifiableEntity> & Opt {
      return resolveEntityRef(this);
    }
  }

  return HasEntityRefMixinEntity;
}
