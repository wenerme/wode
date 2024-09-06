import { Entity, Property, types } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import type { HasVendorRefEntity } from './types';

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

export function requireVendorRefEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasVendorRef])
  @Entity({ abstract: true })
  class RequireVendorRefMixinEntity extends Base implements HasVendorRefEntity {
    // vendor
    @Property({ type: types.string, nullable: false })
    cid!: string;
    // vendor external id
    @Property({ type: types.string, nullable: false })
    rid!: string;
  }

  return RequireVendorRefMixinEntity;
}
