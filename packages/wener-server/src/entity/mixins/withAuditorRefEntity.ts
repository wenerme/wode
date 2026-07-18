import { p } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { getCurrentUserId } from '../../app';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { resolveEntityRef } from '../resolveEntityRef';
import { defineMixinEntity } from './defineMixinEntity';
import type { HasAuditorRefEntity } from './types';

export function withAuditorRefEntity<TBase extends Constructor>(Base: TBase) {
	// AuditorAware

	@Feature([EntityFeature.HasAuditorRef])
	class HasAuditorRefMixinEntity extends Base implements HasAuditorRefEntity {
		createdById?: string;

		updatedById?: string;

		deletedById?: string;

		get createdBy() {
			return resolveEntityRef({ entityId: this.createdById });
		}

		get updatedBy() {
			return resolveEntityRef({ entityId: this.updatedById });
		}

		get deletedBy() {
			return resolveEntityRef({ entityId: this.deletedById });
		}

		setAuditorBeforeCreate() {
			this.createdById ||= getCurrentUserId();
			this.updatedById ||= getCurrentUserId();
		}

		setAuditorBeforeUpdate() {
			this.updatedById = getCurrentUserId() || this.updatedById;
		}
	}

	return defineMixinEntity(Base, HasAuditorRefMixinEntity, {
		name: 'HasAuditorRefMixinEntity',
		hooks: {
			beforeCreate: [(args) => (args.entity as HasAuditorRefMixinEntity).setAuditorBeforeCreate()],
			beforeUpdate: [(args) => (args.entity as HasAuditorRefMixinEntity).setAuditorBeforeUpdate()],
		},
		properties: {
			createdById: p.string().nullable(),
			updatedById: p.string().nullable(),
			deletedById: p.string().nullable(),
		},
	});
}
