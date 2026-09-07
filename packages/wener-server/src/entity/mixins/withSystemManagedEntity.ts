import { type Opt, p } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { defineMixinEntity } from './defineMixinEntity';

export function withSystemManagedEntity<TBase extends Constructor>(Base: TBase) {
	class HasSystemManagedMixinEntity extends Base {
		systemManaged!: boolean & Opt;
	}

	return defineMixinEntity(Base, HasSystemManagedMixinEntity, {
		name: 'HasSystemManagedMixinEntity',
		properties: { systemManaged: p.boolean().default(false) },
	});
}
