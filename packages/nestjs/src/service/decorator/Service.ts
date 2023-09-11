import 'reflect-metadata';
import type { AbstractConstructor, Constructor } from '../../types';

export const SERVICE_METADATA_KEY = 'Service:Metadata:Options';

export interface ServiceOptions {
  name: string;
  timeout?: number;
  metadata?: Record<string, any>;
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

export function getServiceOptions(svc: Constructor | AbstractConstructor | Function): ServiceOptions | undefined {
  if (!svc) {
    return;
  }
  if (typeof svc === 'function') {
    return Reflect.getMetadata(SERVICE_METADATA_KEY, svc);
  }
  return;
}
