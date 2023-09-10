import 'reflect-metadata';
import type { Constructor } from '../../types';

const SERVICE_METADATA_KEY = 'Service:Options';
const METHOD_METADATA_KEY = 'Method:Options';

export interface ServiceOptions {
  name: string;
}

export const Service = (opts: ServiceOptions): ClassDecorator => Reflect.metadata(SERVICE_METADATA_KEY, opts);

export const ServiceNameProp = Symbol('$ServiceName');

export function getServiceName(svc: Constructor | string | Function | undefined): string | undefined {
  if (!svc) {
    return;
  }
  if (typeof svc === 'string') {
    return svc;
  }
  if (typeof svc === 'function') {
    let name = Reflect.getMetadata(SERVICE_METADATA_KEY, svc)?.name;
    if (!name && ServiceNameProp in svc && typeof svc[ServiceNameProp] === 'string') {
      name ||= svc[ServiceNameProp];
    }
    return name;
  }
  return;
}

export interface MethodOptions {
  input?: any;
  output?: any;
  name?: string;
}

export const Method = (opts: MethodOptions = {}): MethodDecorator => Reflect.metadata(METHOD_METADATA_KEY, opts);

export function getMethodOptions(method: Function): MethodOptions {
  return Reflect.getMetadata(METHOD_METADATA_KEY, method) || {};
}
