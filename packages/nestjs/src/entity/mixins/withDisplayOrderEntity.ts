import { Entity, Opt, Property, types } from '@mikro-orm/core';
import { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { HasDisplayOrderEntity } from './types';

export function withDisplayOrderEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasDisplayOrder])
  @Entity({ abstract: true })
  abstract class HasDisplayOrderMixinEntity extends Base implements HasDisplayOrderEntity {
    @Property({ type: types.double, nullable: false, default: 0 })
    displayOrder!: number & Opt;
  }

  return HasDisplayOrderMixinEntity;
}
