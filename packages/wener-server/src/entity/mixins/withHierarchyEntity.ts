import { type BaseEntity, Collection, p } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { resolveEntityRef } from '../resolveEntityRef';
import type { IdentifiableEntity } from '../types';
import { defineMixinEntity } from './defineMixinEntity';
import type { IsHierarchyEntity } from './types';

export function withHierarchyEntity<E extends IsHierarchyEntity<any>>(
	f: () => Constructor<E>,
): <O extends BaseEntity & IdentifiableEntity, TBase extends Constructor<O>>(
	Base: TBase,
) => TBase & Constructor<IsHierarchyEntity<E>> {
	return <O extends BaseEntity & IdentifiableEntity, TBase extends Constructor<O>>(
		Base: TBase,
	): TBase & Constructor<IsHierarchyEntity<E>> => {
		@Feature([EntityFeature.IsHierarchy])
		class IsHierarchyMixinEntity
			extends (Base as Constructor<BaseEntity & IdentifiableEntity>)
			implements IsHierarchyEntity<E>
		{
			parent?: E;
			children = new Collection<E>(this);

			get parentId() {
				return this.parent?.id;
			}

			set parentId(id: string | undefined) {
				this.parent = resolveEntityRef(f(), id).unwrap();
			}
		}

		return defineMixinEntity(Base, IsHierarchyMixinEntity, {
			name: 'IsHierarchyMixinEntity',
			properties: {
				parent: p.manyToOne(f).nullable(),
				children: p.oneToMany(f).mappedBy('parent'),
			},
		}) as TBase & Constructor<IsHierarchyEntity<E>>;
	};
}
