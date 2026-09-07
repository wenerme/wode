import { type Opt, p, type Ref } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { resolveEntityRef } from '../resolveEntityRef';
import { setEntityRef } from '../setEntityRef';
import type { IdentifiableEntity } from '../types';
import { defineMixinEntity } from './defineMixinEntity';
import type { HasEntityRefEntity } from './types';

export function withEntityRefEntity<TBase extends Constructor>(Base: TBase) {
	@Feature([EntityFeature.HasEntityRef])
	class HasEntityRefMixinEntity extends Base implements HasEntityRefEntity {
		entityId?: string;

		entityType?: string;

		setEntityRef(entity?: IdentifiableEntity | string | null) {
			setEntityRef(this, entity);
		}

		setEntityFrom(entity?: HasEntityRefEntity) {
			if (!entity) {
				return;
			}
			this.entityId = entity.entityId;
			this.entityType = entity.entityType;
		}

		set entity(entity: IdentifiableEntity | string | null) {
			this.setEntityRef(entity);
		}

		get entity(): (Ref<IdentifiableEntity> & Opt) | undefined {
			return resolveEntityRef(this);
		}
	}

	return defineMixinEntity(Base, HasEntityRefMixinEntity, {
		name: 'HasEntityRefMixinEntity',
		properties: {
			entityId: p.string().nullable(),
			entityType: p.string().nullable(),
		},
	});
}
