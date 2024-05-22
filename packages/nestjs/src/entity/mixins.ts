import { BaseEntity, Collection, Entity, Opt, Property, Ref, types } from '@mikro-orm/core';
import { Constructor } from '@wener/utils';
import { Feature } from '../Feature';
import { EntityFeature } from './enum';
import { resolveEntityRef } from './resolveEntityRef';
import { setEntityRef } from './setEntityRef';
import { IdentifiableEntity, setOwnerRef } from './setOwnerRef';

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

export interface HasCodeEntity {
  code?: string;
}

export interface HasEntityRefEntity {
  entityId?: string;
  entityType?: string;
  entity?: Ref<IdentifiableEntity>;
}

export interface HasOwnerRefEntity {
  ownerId?: string;
  ownerType?: string;
  owner?: Ref<IdentifiableEntity>;
}

export function withEntityRefEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasEntityRef])
  @Entity({ abstract: true })
  class HasEntityRefEntity extends Base {
    @Property({ type: types.string, nullable: true })
    entityId?: string;

    @Property({ type: types.string, nullable: true })
    entityType?: string;

    setEntityRef(entity?: IdentifiableEntity | string | null) {
      setEntityRef(this, entity);
    }

    set entity(entity: IdentifiableEntity | string | null) {
      this.setEntityRef(entity);
    }

    get entity(): Ref<IdentifiableEntity> & Opt {
      return resolveEntityRef(this);
    }
  }

  return HasEntityRefEntity;
}

export function withOwnerRefEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasOwnerRef])
  @Entity({ abstract: true })
  class HasOwnerRefEntity extends Base {
    @Property({ type: types.string, nullable: true })
    ownerId?: string;

    @Property({ type: types.string, nullable: true })
    ownerType?: string;

    setOwnerRef(entity?: IdentifiableEntity | string | null) {
      setOwnerRef(this, entity);
    }

    set owner(entity: IdentifiableEntity | string | null) {
      this.setOwnerRef(entity);
    }

    get owner(): Ref<IdentifiableEntity> & Opt {
      return resolveEntityRef({ entityId: this.ownerId, entityType: this.ownerType });
    }
  }

  return HasOwnerRefEntity;
}

export function withVendorRefEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasVendorRef])
  @Entity({ abstract: true })
  class HasVendorRefEntity extends Base {
    // vendor
    @Property({ type: types.string, nullable: true })
    cid?: string;
    // vendor external id
    @Property({ type: types.string, nullable: true })
    rid?: string;
  }

  return HasVendorRefEntity;
}

export function withStateStatusEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasStateStatus])
  @Entity({ abstract: true })
  class HasStateStatusEntity extends Base {
    @Property({ type: types.string, nullable: false })
    state!: string & Opt;

    @Property({ type: types.string, nullable: true })
    status!: string & Opt;
  }

  return HasStateStatusEntity;
}

export function withTagsEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasTags])
  abstract class HasTagsEntity extends Base {
    @Property({ type: types.array, nullable: true, default: [] })
    tags?: string[] = [];

    hasTags(tags: string[]) {
      return tags.every((tag) => this.tags?.includes(tag));
    }

    hasTag(tag: string) {
      return this.tags?.includes(tag);
    }
  }

  return HasTagsEntity;
}

export function withNotesEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasNotes])
  abstract class HasNotesEntity extends Base {
    @Property({ type: types.string, nullable: true })
    notes?: string;
  }

  return HasNotesEntity;
}

export function withMetadataEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasNotes])
  abstract class HasNotesEntity extends Base {
    @Property({ type: types.string, nullable: true })
    metadata?: string;
  }

  return HasNotesEntity;
}

export function withCodeEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasCode])
  abstract class HasCodeEntity extends Base {
    @Property({ type: types.string, nullable: true })
    code?: string;
  }

  return HasCodeEntity;
}

export function withSidEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasSid])
  abstract class HasSidEntity extends Base {
    @Property({ type: types.bigint, nullable: false })
    sid!: number;
  }

  return HasSidEntity;
}

export function withTidEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasTid])
  abstract class HasTidEntity extends Base {
    @Property({ type: types.string, nullable: false })
    tid!: string & Opt;
  }

  return HasTidEntity;
}
