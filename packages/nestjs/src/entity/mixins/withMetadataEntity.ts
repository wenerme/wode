import { Entity, Property, types } from '@mikro-orm/core';
import { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { HasMetadataEntity } from './types';

export function withMetadataEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasMetadata])
  @Entity({ abstract: true })
  abstract class HasMetadataMixinEntity extends Base implements HasMetadataEntity {
    @Property({ type: types.json, nullable: true })
    metadata?: Record<string, any>;
  }

  return HasMetadataMixinEntity;
}
