import { Entity, Opt, Property, types } from '@mikro-orm/core';
import { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { HasStateStatusEntity } from './types';

export function createStateStatusEntity({ status, state }: { status: string; state: string }) {
  return function withStateStatusEntity<TBase extends Constructor>(Base: TBase) {
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
