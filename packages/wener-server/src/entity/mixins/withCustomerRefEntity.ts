import { type Opt, p, type Ref } from '@mikro-orm/core';
import type { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { resolveEntityRef } from '../resolveEntityRef';
import { setCustomerRef } from '../setCustomerRef';
import type { IdentifiableEntity } from '../types';
import { defineMixinEntity } from './defineMixinEntity';
import type { HasCustomerRefEntity } from './types';

export function withCustomerRefEntity<TBase extends Constructor>(Base: TBase) {
	@Feature([EntityFeature.HasCustomer])
	class HasCustomerRefMixinEntity extends Base implements HasCustomerRefEntity {
		customerId?: string;

		customerType?: string;

		setCustomerRef(entity?: IdentifiableEntity | string | null) {
			setCustomerRef(this, entity);
		}

		setCustomerFrom(entity?: HasCustomerRefEntity) {
			if (!entity) {
				return;
			}
			this.customerId = entity.customerId;
			this.customerType = entity.customerType;
		}

		set customer(entity: IdentifiableEntity | string | null) {
			this.setCustomerRef(entity);
		}

		get customer(): undefined | (Ref<IdentifiableEntity> & Opt) {
			return resolveEntityRef({ entityId: this.customerId, entityType: this.customerType });
		}
	}

	return defineMixinEntity(Base, HasCustomerRefMixinEntity, {
		name: 'HasCustomerRefMixinEntity',
		properties: {
			customerId: p.string().nullable(),
			customerType: p.string().nullable(),
		},
	});
}
