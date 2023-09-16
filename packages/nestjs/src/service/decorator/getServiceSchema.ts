import type { AbstractConstructor, Constructor } from '../../types';
import type { MethodOptions } from './Method';
import { getMethodOptions } from './Method';
import type { ServiceOptions } from './Service';
import { getServiceOptions } from './Service';

export function getServiceSchema<T = unknown>(type: Constructor<T> | AbstractConstructor<T>) {
  let so = getServiceOptions(type);
  if (!so) {
    return;
  }

  let base: undefined | ServiceSchema;
  if (so.as) {
    base = getServiceSchema(so.as);
    if (!base) {
      throw new Error(`Service ${type} base ${so.as} is invalid`);
    }

    so = Object.assign({}, base.options, so);
  }

  const { name } = so;
  if (!name) {
    throw new Error(`Service ${type} name is invalid`);
  }

  let methods: MethodSchema[] = [];
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
        case '[object AsyncGeneratorFunction]': {
          mo.stream = true;
        }
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
          options: Object.assign({ name: methodName }, mo),
          ref: method,
        };
        methods.push(ms);
        byName[methodName] = ms;
      }
    }

    proto = Object.getPrototypeOf(proto);
  }

  if (base) {
    for (const method of base.methods) {
      byName[method.name] ||= method;
    }
  }

  methods = Object.values(byName).sort((a, b) => a.options.name.localeCompare(b.options.name));

  const schema: ServiceSchema<T> = {
    name,
    options: {
      name,
      ...so,
    },
    ref: type,
    methods,
  };
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
