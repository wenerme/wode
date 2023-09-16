import 'reflect-metadata';
import type { AbstractConstructor, Constructor } from '../../types';

export const SERVICE_METADATA_KEY = 'Service:Metadata:Options';

export type ServiceOptionsInit = Partial<ServiceOptions>;

export interface ServiceOptions {
  name: string;
  summary?: string;
  description?: string;
  timeout?: number;
  metadata?: Record<string, any>;
  as?: Constructor | AbstractConstructor;
}

export const Service = (opts: ServiceOptionsInit): ClassDecorator => Reflect.metadata(SERVICE_METADATA_KEY, opts);
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
}

export function getServiceOptions(svc: Constructor | AbstractConstructor | Function): ServiceOptionsInit | undefined {
  if (!svc) {
    return;
  }

  if (typeof svc === 'function') {
    return Reflect.getMetadata(SERVICE_METADATA_KEY, svc);
  }
}
