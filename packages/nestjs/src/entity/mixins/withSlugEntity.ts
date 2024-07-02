import { Entity, Property, types } from '@mikro-orm/core';
import { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { HasSlugEntity } from './types';

export function withSlugEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasSlug])
  @Entity({ abstract: true })
  abstract class HasSlugMixinEntity extends Base implements HasSlugEntity {
    @Property({ type: types.string, nullable: false })
    slug?: string;
  }

  return HasSlugMixinEntity;
}
