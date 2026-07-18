import { p } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { defineMixinEntity } from './defineMixinEntity';
import type { HasSlugEntity } from './types';

export function withSlugEntity<TBase extends Constructor>(Base: TBase) {
	@Feature([EntityFeature.HasSlug])
	abstract class HasSlugMixinEntity extends Base implements HasSlugEntity {
		slug?: string;
	}

	return defineMixinEntity(Base, HasSlugMixinEntity, {
		name: 'HasSlugMixinEntity',
		properties: { slug: p.string() },
	});
}
