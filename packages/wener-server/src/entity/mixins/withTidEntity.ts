import { type Opt, p } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { defineMixinEntity } from './defineMixinEntity';
import type { HasTidEntity } from './types';

export function withTidEntity<TBase extends Constructor>(Base: TBase) {
	@Feature([EntityFeature.HasTid])
	abstract class HasTidMixinEntity extends Base implements HasTidEntity {
		tid!: string & Opt;
	}

	return defineMixinEntity(Base, HasTidMixinEntity, {
		name: 'HasTidMixinEntity',
		properties: { tid: p.string() },
	});
}
