import { p } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { defineMixinEntity } from './defineMixinEntity';
import type { HasSidEntity } from './types';

export function withSidEntity<TBase extends Constructor>(Base: TBase) {
	@Feature([EntityFeature.HasSid])
	abstract class HasSidMixinEntity extends Base implements HasSidEntity {
		sid!: number;
	}

	return defineMixinEntity(Base, HasSidMixinEntity, {
		name: 'HasSidMixinEntity',
		properties: { sid: p.bigint('number') },
	});
}
