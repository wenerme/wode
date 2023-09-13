import type { AbstractConstructor, Constructor } from '../../types';
import type { MethodOptions } from './Method';
import { getMethodOptions } from './Method';
import type { ServiceOptions } from './Service';
import { getServiceName, getServiceOptions } from './Service';

export function getServiceSchema<T = unknown>(type: Constructor<T> | AbstractConstructor<T>) {
  const name = getServiceName(type);
  if (!name) {
    return;
  }
  const schema: ServiceSchema<T> = {
    name,
    options: getServiceOptions(type) ?? { name },
    ref: type,
    methods: [],
  };
  const methods = schema.methods;
  const byName: Record<string, MethodSchema> = {};
  let proto = type.prototype;
  while (proto) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      const method = proto[key];
      const mo = getMethodOptions(proto, key);
      if (!mo) {
        continue;
      }

      switch (Object.prototype.toString.call(method)) {
        case '[object GeneratorFunction]':
        case '[object AsyncGeneratorFunction]':
          mo.stream = true;
      }

      const methodName = key;
      const last = byName[methodName];
      if (last) {
        // first win
        last.name ||= methodName;
        last.options = Object.assign({}, mo, last.options);
      } else {
        const ms = {
          name: methodName,
          options: mo,
          ref: method,
        };
        methods.push(ms);
        byName[methodName] = ms;
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  return schema;
}

export interface ServiceSchema<T = unknown> {
  name: string;
  options: ServiceOptions;
  methods: MethodSchema[];
  ref?: Constructor<T> | AbstractConstructor<T>;
}

export interface MethodSchema {
  name: string;
  options: MethodOptions;
  ref?: any;
}
