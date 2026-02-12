import { types, type Opt } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';
import type { Constructor } from '@wener/utils';

export function withSystemManagedEntity<TBase extends Constructor>(Base: TBase) {
	@Entity({ abstract: true })
	class HasSystemManagedMixinEntity extends Base {
		@Property({ type: types.boolean, nullable: false, default: false })
		systemManaged!: boolean & Opt;
	}

	return HasSystemManagedMixinEntity;
}
