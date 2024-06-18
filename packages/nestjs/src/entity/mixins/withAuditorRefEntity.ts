import { BeforeCreate, BeforeUpdate, Entity, Property, types } from '@mikro-orm/core';
import { Constructor } from '@wener/utils';
import { getCurrentUserId } from '../../app';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { resolveEntityRef } from '../resolveEntityRef';
import { HasAuditorRefEntity } from './types';

export function withAuditorRefEntity<TBase extends Constructor>(Base: TBase) {
  // AuditorAware

  @Feature([EntityFeature.HasAuditorRef])
  @Entity({ abstract: true })
  class HasAuditorRefMixinEntity extends Base implements HasAuditorRefEntity {
    @Property({ type: types.string, nullable: true })
    createdById?: string;

    @Property({ type: types.string, nullable: true })
    updatedById?: string;

    @Property({ type: types.string, nullable: true })
    deletedById?: string;

    get createdBy() {
      return resolveEntityRef({
        entityId: this.createdById,
      });
    }

    get updatedBy() {
      return resolveEntityRef({
        entityId: this.updatedById,
      });
    }

    get deletedBy() {
      return resolveEntityRef({
        entityId: this.deletedById,
      });
    }

    @BeforeCreate()
    setAuditorBeforeCreate() {
      this.createdById ||= getCurrentUserId();
      this.updatedById ||= getCurrentUserId();
    }

    @BeforeUpdate()
    setAuditorBeforeUpdate() {
      this.updatedById = getCurrentUserId() || this.updatedById;
    }
  }

  return HasAuditorRefMixinEntity;
}
