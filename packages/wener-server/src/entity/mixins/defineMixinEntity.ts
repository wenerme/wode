import { defineEntity, type EntityCtor } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { setEntitySchemaClass } from '../defineEntitySchemaClass';

export function defineMixinEntity<TBase extends Constructor, TClass extends Constructor>(
	Base: TBase,
	Mixin: TClass,
	meta: Omit<Parameters<typeof defineEntity>[0], 'class' | 'extends'>,
) {
	const schema = defineEntity({
		...meta,
		abstract: true,
		extends: Base,
		class: Mixin as EntityCtor,
	});
	setEntitySchemaClass(schema, Mixin as EntityCtor, Base);
	return Mixin;
}
