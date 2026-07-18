import { p } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { defineMixinEntity } from './defineMixinEntity';
import type { HasCodeEntity } from './types';

export function withCodeEntity<TBase extends Constructor>(Base: TBase) {
	@Feature([EntityFeature.HasCode])
	abstract class HasCodeMixinEntity extends Base implements HasCodeEntity {
		code?: string;
	}

	return defineMixinEntity(Base, HasCodeMixinEntity, {
		name: 'HasCodeMixinEntity',
		properties: { code: p.string().nullable() },
	});
}
