import { BaseEntity, Collection, Entity, ManyToOne, OneToMany } from '@mikro-orm/core';
import { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { resolveEntityRef } from '../resolveEntityRef';
import { IdentifiableEntity } from '../types';
import { IsHierarchyEntity } from './types';

export function createHierarchyEntity<E extends IsHierarchyEntity<any>>(entity: Constructor<E>) {
  return function withHierarchyEntity<O extends BaseEntity & IdentifiableEntity, TBase extends Constructor<O>>(
    Base: TBase,
  ) {
    //  implements IsHierarchyEntity<E>
    @Feature([EntityFeature.IsHierarchy])
    @Entity({ abstract: true })
    class IsHierarchyMixinEntity extends Base implements IsHierarchyEntity<E> {
      @ManyToOne(() => entity, { nullable: true })
      parent?: E;

      @OneToMany(() => entity, (e) => e.parent)
      children = new Collection<E>(this);

      get parentId() {
        return this.parent?.id;
      }

      set parentId(id: string | undefined) {
        this.parent = resolveEntityRef(entity, id).unwrap();
      }
    }

    return IsHierarchyMixinEntity;
  };
}
