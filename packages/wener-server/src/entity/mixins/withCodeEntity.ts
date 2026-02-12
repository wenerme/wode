import { types } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import type { HasCodeEntity } from './types';

export function withCodeEntity<TBase extends Constructor>(Base: TBase) {
	@Feature([EntityFeature.HasCode])
	@Entity({ abstract: true })
	abstract class HasCodeMixinEntity extends Base implements HasCodeEntity {
		@Property({ type: types.string, nullable: true })
		code?: string;
	}

	return HasCodeMixinEntity;
}
