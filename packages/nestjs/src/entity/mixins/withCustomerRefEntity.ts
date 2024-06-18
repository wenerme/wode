import { Entity, Opt, Property, Ref, types } from '@mikro-orm/core';
import { Constructor } from '@wener/utils';
import { Feature } from '../../Feature';
import { EntityFeature } from '../enum';
import { resolveEntityRef } from '../resolveEntityRef';
import { setCustomerRef } from '../setCustomerRef';
import { IdentifiableEntity } from '../types';
import { HasCustomerRefEntity } from './types';

export function withCustomerRefEntity<TBase extends Constructor>(Base: TBase) {
  @Feature([EntityFeature.HasCustomer])
  @Entity({ abstract: true })
  class HasCustomerRefMixinEntity extends Base implements HasCustomerRefEntity {
    @Property({ type: types.string, nullable: true })
    customerId?: string;

    @Property({ type: types.string, nullable: true })
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

    get customer(): Ref<IdentifiableEntity> & Opt {
      return resolveEntityRef({ entityId: this.customerId, entityType: this.customerType });
    }
  }

  return HasCustomerRefMixinEntity;
}
