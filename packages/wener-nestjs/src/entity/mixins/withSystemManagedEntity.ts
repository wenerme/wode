import { Entity, Property, types, type Opt } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';

export function withSystemManagedEntity<TBase extends Constructor>(Base: TBase) {
  @Entity({ abstract: true })
  class HasSystemManagedMixinEntity extends Base {
    @Property({ type: types.boolean, nullable: false, default: false })
    systemManaged!: boolean & Opt;
  }

  return HasSystemManagedMixinEntity;
}
