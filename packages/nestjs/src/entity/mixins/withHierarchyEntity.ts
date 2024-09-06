import { Collection, Entity, ManyToOne, OneToMany, type BaseEntity } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { resolveEntityRef } from '../resolveEntityRef';
import type { IdentifiableEntity } from '../types';
import type { IsHierarchyEntity } from './types';

export function withHierarchyEntity<E extends IsHierarchyEntity<any>>(f: () => Constructor<E>) {
  return <O extends BaseEntity & IdentifiableEntity, TBase extends Constructor<O>>(Base: TBase) => {
    @Feature([EntityFeature.IsHierarchy])
    @Entity({ abstract: true })
    class IsHierarchyMixinEntity extends Base implements IsHierarchyEntity<E> {
      @ManyToOne(f, { nullable: true })
      parent?: E;

      @OneToMany(f, (e) => e.parent)
      children = new Collection<E>(this);

      get parentId() {
        return this.parent?.id;
      }

      set parentId(id: string | undefined) {
        this.parent = resolveEntityRef(f(), id).unwrap();
      }
    }

    return IsHierarchyMixinEntity;
  };
}
