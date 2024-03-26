import { BeforeCreate, BeforeUpdate, Collection, Entity, Opt, Property, type Ref, types } from '@mikro-orm/core';
import { StandardBaseEntity } from '@wener/server/src/entity/base/StandardBaseEntity';
import { Constructor, AbstractConstructor } from '@wener/utils';
import { getUserId } from './context';
import { resolveEntityRef } from './resolveEntityRef';

export function WithVendorRefEntity<TBase extends Constructor>(Base: TBase) {
  @Entity({ abstract: true })
  abstract class HasVendorRefEntity extends Base {
    // vendor
    @Property({ type: types.string, nullable: true })
    cid?: string;
    // vendor external id
    @Property({ type: types.string, nullable: true })
    rid?: string;
  }

  return HasVendorRefEntity;
}

export function WithRelEntity<TBase extends Constructor>(Base: TBase) {
  @Entity({ abstract: true })
  class HasRelEntity extends Base {
    @Property({ type: types.string, nullable: false })
    entityId!: string;

    @Property({ type: types.string, nullable: true })
    entityType?: string;

    // @(Property({ persist: false }))
    get entity() {
      return resolveEntityRef(this);
    }
  }

  return HasRelEntity;
}

export function WithOptionalRelEntity<TBase extends Constructor>(Base: TBase) {
  @Entity({ abstract: true })
  class HasOptionalRelEntity extends Base {
    @Property({ type: types.string, nullable: true })
    entityId?: string;

    @Property({ type: types.string, nullable: true })
    entityType?: string;

    // @(Property({ persist: false }))
    get entity() {
      return resolveEntityRef(this);
    }
  }

  return HasOptionalRelEntity;
}

export function WithStatusEntity<TBase extends Constructor>(Base: TBase) {
  @Entity({ abstract: true })
  class HasStatusEntity extends Base {
    @Property({ type: types.string, nullable: false })
    state!: string & Opt;

    @Property({ type: types.string, nullable: true })
    status!: string & Opt;
  }

  return HasStatusEntity;
}

export function WithAuditUserEntity<TBase extends Constructor>(Base: TBase) {
  @Entity({ abstract: true })
  class HasAuditUserEntity extends Base {
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
    setAuditUserBeforeCreate() {
      this.createdById ||= getUserId();
      this.updatedById ||= getUserId();
    }

    @BeforeUpdate()
    setAuditUserBeforeUpdate() {
      this.updatedById = getUserId() || this.updatedById;
    }
  }

  return HasAuditUserEntity;
}

export interface HasVendorRefEntity {
  cid?: string;
  rid?: string;
}

export interface HasStatusEntity {
  state: string & Opt;
  status: string & Opt;
}

export interface HasSidEntity {
  sid: number;
}

export interface HasRelEntity {
  entityId: string;
  entityType?: string;

  get entity(): Ref<StandardBaseEntity> & Opt;
}

export interface HasTidEntity {
  tid: string & Opt;
}

export interface HasAuditUserEntity {
  createdById?: string;
  updatedById?: string;
  deletedById?: string;

  get createdBy(): Ref<StandardBaseEntity> & Opt;

  get updatedBy(): Ref<StandardBaseEntity> & Opt;

  get deletedBy(): Ref<StandardBaseEntity> & Opt;
}

export interface HasTagEntity {
  tags?: string[];
}

export interface HasLabelEntity {
  labels: Collection<StandardBaseEntity>;
}

export function WithTagEntity<TBase extends Constructor>(Base: TBase) {
  abstract class HasTagEntity extends Base {
    @Property({ type: types.array, nullable: true, default: [] })
    tags?: string[] = [];
  }

  return HasTagEntity;
}

export function WithLabelEntity<TBase extends Constructor>(Base: TBase) {
  abstract class HasLabelEntity extends Base {
    labels = new Collection(this);
  }

  return HasLabelEntity;
}
