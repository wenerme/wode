import { p } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { defineMixinEntity } from './defineMixinEntity';
import type { HasVendorRefEntity } from './types';

export function withVendorRefEntity<TBase extends Constructor>(Base: TBase) {
	@Feature([EntityFeature.HasVendorRef])
	class HasVendorRefMixinEntity extends Base implements HasVendorRefEntity {
		// vendor
		cid?: string;
		// vendor external id
		rid?: string;
	}

	return defineMixinEntity(Base, HasVendorRefMixinEntity, {
		name: 'HasVendorRefMixinEntity',
		properties: {
			cid: p.string().nullable(),
			rid: p.string().nullable(),
		},
	});
}

export function requireVendorRefEntity<TBase extends Constructor>(Base: TBase) {
	@Feature([EntityFeature.HasVendorRef])
	class RequireVendorRefMixinEntity extends Base implements HasVendorRefEntity {
		// vendor
		cid!: string;
		// vendor external id
		rid!: string;
	}

	return defineMixinEntity(Base, RequireVendorRefMixinEntity, {
		name: 'RequireVendorRefMixinEntity',
		properties: {
			cid: p.string(),
			rid: p.string(),
		},
	});
}
