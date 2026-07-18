import { type Opt, p } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { defineMixinEntity } from './defineMixinEntity';

export function withVersionEntity<TBase extends Constructor>(Base: TBase) {
	class HasVersionMixinEntity extends Base {
		version!: number & Opt;
	}

	return defineMixinEntity(Base, HasVersionMixinEntity, {
		name: 'HasVersionMixinEntity',
		properties: { version: p.bigint('number').default(0).version() },
	});
}
