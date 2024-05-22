import { BaseEntity, Collection, Entity, Opt, Property, Ref, types } from '@mikro-orm/core';
import { Constructor } from '@wener/utils';
import { Feature } from '../Feature';
import { EntityFeature } from './enum';
import { resolveEntityRef } from './resolveEntityRef';
import { setCustomerRef } from './setCustomerRef';
import { setEntityRef } from './setEntityRef';
import { setOwnerRef } from './setOwnerRef';
import { IdentifiableEntity } from './types';

export interface HasTidEntity {
  tid: string;
}

export interface HasSidEntity {
  sid: number;
}

export interface HasVendorRefEntity {
  cid?: string;
  rid?: string;
}

export interface HasStateStatusEntity {
  state: string & Opt;
  status: string & Opt;
}

export interface HasTagsEntity {
  tags?: string[];
}

export interface HasLabelsEntity<E extends BaseEntity> {
  labels: Collection<E>;
}

export interface HasNotesEntity {
  notes?: string;
}

export interface HasMetadataEntity {
  metadata?: Record<string, any>;
}

export interface HasCodeEntity {
  code?: string;
}

export interface HasEntityRefEntity {
  entityId?: string;
  entityType?: string;
  entity?: Ref<IdentifiableEntity>;
}

export interface HasCustomerRefEntity {
  customerId?: string;
  customerType?: string;
  customer?: Ref<IdentifiableEntity>;
}

export interface HasOwnerRefEntity {
  ownerId?: string;
  ownerType?: string;
  owner?: Ref<IdentifiableEntity>;
}

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

export function withCustomerRefEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasCustomer])
  @Entity({ abstract: true })
  class HasCustomerRefMixinEntity extends Base implements HasCustomerRefEntity {
    @Property({ type: types.string, nullable: true })
    customerId?: string;

    @Property({ type: types.string, nullable: true })
    customerType?: string;

    setCustomerRef(entity?: IdentifiableEntity | string | null) {
      setCustomerRef(this, entity);
    }

    setCustomerFrom(entity?: HasCustomerRefEntity) {
      if (!entity) {
        return;
      }
      this.customerId = entity.customerId;
      this.customerType = entity.customerType;
    }

    set customer(entity: IdentifiableEntity | string | null) {
      this.setCustomerRef(entity);
    }

    get customer(): Ref<IdentifiableEntity> & Opt {
      return resolveEntityRef({ entityId: this.customerId, entityType: this.customerType });
    }
  }

  return HasCustomerRefMixinEntity;
}

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

export function withVendorRefEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasVendorRef])
  @Entity({ abstract: true })
  class HasVendorRefMixinEntity extends Base implements HasVendorRefEntity {
    // vendor
    @Property({ type: types.string, nullable: true })
    cid?: string;
    // vendor external id
    @Property({ type: types.string, nullable: true })
    rid?: string;
  }

  return HasVendorRefMixinEntity;
}

export function withStateStatusEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasStateStatus])
  @Entity({ abstract: true })
  class HasStateStatusMixinEntity extends Base implements HasStateStatusEntity {
    @Property({ type: types.string, nullable: false })
    state!: string & Opt;

    @Property({ type: types.string, nullable: true })
    status!: string & Opt;
  }

  return HasStateStatusMixinEntity;
}

export function withTagsEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasTags])
  abstract class HasTagsMixinEntity extends Base implements HasTagsEntity {
    @Property({ type: types.array, nullable: true, default: [] })
    tags?: string[] = [];

    hasTags(tags: string[]) {
      return tags.every((tag) => this.tags?.includes(tag));
    }

    hasTag(tag: string) {
      return this.tags?.includes(tag);
    }
  }

  return HasTagsMixinEntity;
}

export function withNotesEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasNotes])
  abstract class HasNotesMixinEntity extends Base implements HasNotesEntity {
    @Property({ type: types.string, nullable: true })
    notes?: string;
  }

  return HasNotesMixinEntity;
}

export function withMetadataEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasNotes])
  abstract class HasMetadataMixinEntity extends Base implements HasMetadataEntity {
    @Property({ type: types.json, nullable: true })
    metadata?: Record<string, any>;
  }

  return HasMetadataMixinEntity;
}

export function withCodeEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasCode])
  abstract class HasCodeMixinEntity extends Base implements HasCodeEntity {
    @Property({ type: types.string, nullable: true })
    code?: string;
  }

  return HasCodeMixinEntity;
}

export function withSidEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasSid])
  abstract class HasSidMixinEntity extends Base implements HasSidEntity {
    @Property({ type: types.bigint, nullable: false })
    sid!: number;
  }

  return HasSidMixinEntity;
}

export function withTidEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasTid])
  abstract class HasTidMixinEntity extends Base implements HasTidEntity {
    @Property({ type: types.string, nullable: false })
    tid!: string & Opt;
  }

  return HasTidMixinEntity;
}
