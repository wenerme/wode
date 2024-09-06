import { Entity, Property, types } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import type { HasTagsEntity } from './types';

export function withTagsEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasTags])
  @Entity({ abstract: true })
  abstract class HasTagsMixinEntity extends Base implements HasTagsEntity {
    @Property({ type: types.array, nullable: true, default: [] })
    tags?: string[] = [];

    hasTags(tags: string[]) {
      return tags.every((tag) => this.tags?.includes(tag));
    }

    hasTag(tag: string) {
      return this.tags?.includes(tag);
    }
  }

  return HasTagsMixinEntity;
}
