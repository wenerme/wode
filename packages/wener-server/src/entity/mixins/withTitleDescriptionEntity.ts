import { p } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { defineMixinEntity } from './defineMixinEntity';
import type { HasTitleDescriptionEntity } from './types';

export function withTitleDescriptionEntity<TBase extends Constructor>(Base: TBase) {
	@Feature([EntityFeature.HasTitleDescription])
	class HasTitleDescriptionMixinEntity extends Base implements HasTitleDescriptionEntity {
		title!: string;
		description?: string;
	}

	return defineMixinEntity(Base, HasTitleDescriptionMixinEntity, {
		name: 'HasTitleDescriptionMixinEntity',
		properties: {
			title: p.string(),
			description: p.string().nullable(),
		},
	});
}
