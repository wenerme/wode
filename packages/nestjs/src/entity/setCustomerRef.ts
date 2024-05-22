import { Errors } from '@wener/utils';
import { getEntityDef } from './defineEntity';
import { IdentifiableEntity } from './types';

export function setCustomerRef<
  T extends {
    customerId?: string;
    customerType?: string;
  },
>(out: T = {} as T, entity?: IdentifiableEntity | string | null): T {
  if (!entity) {
    out.customerId = undefined;
    out.customerType = undefined;
    return out;
  }
  let def = getEntityDef(entity);
  Errors.InternalServerError.check(def, `Invalid customer ${entity}`);
  out.customerId = typeof entity === 'string' ? entity : entity.id;
  out.customerType = def.typeName;
  // todo check type ?
  return out;
}
