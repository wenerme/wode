import { p } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { defineMixinEntity } from './defineMixinEntity';
import type { HasMetadataEntity } from './types';

export function withMetadataEntity<TBase extends Constructor>(Base: TBase) {
	@Feature([EntityFeature.HasMetadata])
	abstract class HasMetadataMixinEntity extends Base implements HasMetadataEntity {
		metadata?: Record<string, any>;
	}

	return defineMixinEntity(Base, HasMetadataMixinEntity, {
		name: 'HasMetadataMixinEntity',
		properties: { metadata: p.json<Record<string, any>>().nullable() },
	});
}
