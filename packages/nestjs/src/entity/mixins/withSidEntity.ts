import { Entity, Property, types } from '@mikro-orm/core';
import { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { HasSidEntity } from './types';

export function withSidEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasSid])
  @Entity({ abstract: true })
  abstract class HasSidMixinEntity extends Base implements HasSidEntity {
    @Property({ type: types.bigint, nullable: false })
    sid!: number;
  }

  return HasSidMixinEntity;
}
