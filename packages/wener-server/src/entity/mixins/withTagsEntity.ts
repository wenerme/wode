import { p } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { defineMixinEntity } from './defineMixinEntity';
import type { HasTagsEntity } from './types';

export function withTagsEntity<TBase extends Constructor>(Base: TBase) {
	@Feature([EntityFeature.HasTags])
	abstract class HasTagsMixinEntity extends Base implements HasTagsEntity {
		tags?: string[] = [];

		hasTags(tags: string[]) {
			return tags.every((tag) => this.tags?.includes(tag));
		}

		hasTag(tag: string) {
			return this.tags?.includes(tag);
		}
	}

	return defineMixinEntity(Base, HasTagsMixinEntity, {
		name: 'HasTagsMixinEntity',
		properties: { tags: p.array<string>().nullable().default([]) },
	});
}
