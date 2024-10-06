import { Entity, Property, types } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import type { HasTitleDescriptionEntity } from './types';

export function withTitleDescriptionEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasTitleDescription])
  @Entity({ abstract: true })
  class HasTitleDescriptionMixinEntity extends Base implements HasTitleDescriptionEntity {
    @Property({ type: types.string, nullable: false })
    title!: string;

    @Property({ type: types.string, nullable: true })
    description?: string;
  }

  return HasTitleDescriptionMixinEntity;
}
