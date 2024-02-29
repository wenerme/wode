import type { Constructor } from '../../types';
import { getServiceSchema, type ServiceSchema } from './index';
import { type ServerServiceSchema } from './server.types';

export function getServerServiceSchema<T>(svc: Constructor<T>): ServerServiceSchema | undefined {
  const schema = getServiceSchema(svc) as ServerServiceSchema;
  if (!schema) {
    return;
  }

  let base: undefined | ServiceSchema<T>;
  if (schema.options?.as) {
    base = getServiceSchema(svc);
    if (!base) {
      throw new Error(`Service ${svc} base ${schema.options.as} is invalid`);
    }
  }

  return schema;
}
