import { Entity, type Opt, Property, types } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import type { HasStateStatusEntity } from './types';

export function withStateStatusEntity({ status, state }: { status: string; state: string }) {
  return <TBase extends Constructor>(Base: TBase) => {
    @Feature([EntityFeature.HasStateStatus])
    @Entity({ abstract: true })
    class HasStateStatusMixinEntity extends Base implements HasStateStatusEntity {
      @Property({ type: types.string, nullable: false, default: state })
      state!: string & Opt;

      @Property({ type: types.string, nullable: false, default: status })
      status!: string & Opt;
    }

    return HasStateStatusMixinEntity;
  };
}
