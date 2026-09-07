import { type Opt, p } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { defineMixinEntity } from './defineMixinEntity';
import type { HasDisplayOrderEntity } from './types';

export function withDisplayOrderEntity<TBase extends Constructor>(Base: TBase) {
	@Feature([EntityFeature.HasDisplayOrder])
	abstract class HasDisplayOrderMixinEntity extends Base implements HasDisplayOrderEntity {
		displayOrder!: number & Opt;
	}

	return defineMixinEntity(Base, HasDisplayOrderMixinEntity, {
		name: 'HasDisplayOrderMixinEntity',
		properties: { displayOrder: p.double().default(0) },
	});
}
