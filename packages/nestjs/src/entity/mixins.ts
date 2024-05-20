import { Ref } from 'react';
import { BaseEntity, Entity, Opt, Property, types } from '@mikro-orm/core';
import { Constructor } from '@wener/utils';
import { Feature } from '../Feature';
import { EntityFeature } from './enum';

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

export interface HasRelEntity {
  entityId: string;
  entityType?: string;

  get entity(): Ref<BaseEntity> & Opt;
}

export interface HasTidEntity {
  tid: string & Opt;
}

export interface HasTagsEntity {
  tags?: string[];
}

export interface HasNotesEntity {
  notes?: string;
}

export interface HasCodeEntity {
  code?: string;
}

export function withEntityRefEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasEntityRef])
  @Entity({ abstract: true })
  class HasEntityRefEntity extends Base {
    @Property({ type: types.string, nullable: true })
    entityId?: string;

    @Property({ type: types.string, nullable: true })
    entityType?: string;
  }

  return HasEntityRefEntity;
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
  @Feature([EntityFeature.HasStatus])
  @Entity({ abstract: true })
  class HasStatusEntity extends Base {
    @Property({ type: types.string, nullable: false })
    state!: string & Opt;

    @Property({ type: types.string, nullable: true })
    status!: string & Opt;
  }

  return HasStatusEntity;
}

export function withTagsEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasTags])
  abstract class HasTagsEntity extends Base {
    @Property({ type: types.array, nullable: true, default: [] })
    tags?: string[] = [];
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
