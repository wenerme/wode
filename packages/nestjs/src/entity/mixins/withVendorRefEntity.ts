import { Entity, Property, types } from '@mikro-orm/core';
import { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { HasVendorRefEntity } from './types';

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
