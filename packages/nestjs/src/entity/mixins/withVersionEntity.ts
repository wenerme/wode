import { Entity, type Opt, Property, types } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';

export function withVersionEntity<TBase extends Constructor>(Base: TBase) {
  @Entity({ abstract: true })
  class HasVersionMixinEntity extends Base {
    @Property({ version: true, type: types.bigint, default: 0 })
    version!: number & Opt;
  }

  return HasVersionMixinEntity;
}
