import { Entity, Property, types, type Opt } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import type { HasTidEntity } from './types';

export function withTidEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasTid])
  @Entity({ abstract: true })
  abstract class HasTidMixinEntity extends Base implements HasTidEntity {
    @Property({ type: types.string, nullable: false })
    tid!: string & Opt;
  }

  return HasTidMixinEntity;
}
