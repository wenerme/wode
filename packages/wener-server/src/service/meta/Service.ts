import 'reflect-metadata';
import type { AbstractConstructor, Constructor } from '../../types';
import type { ServiceOptions } from './client.types';

export const SERVICE_METADATA_KEY = 'Service:Metadata:Options';

export type ServiceOptionsInit = Partial<ServiceOptions>;

export const Service = (opts: ServiceOptionsInit): ClassDecorator => Reflect.metadata(SERVICE_METADATA_KEY, opts);
export const ServiceNameProp = Symbol('$ServiceName');

export function getServiceName(svc: Constructor | string | Function | undefined): string | undefined {
	if (!svc) {
		return undefined;
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
	return undefined;
}

export function getServiceOptions(svc: Constructor | AbstractConstructor | Function): ServiceOptionsInit | undefined {
	if (!svc) {
		return undefined;
	}

	if (typeof svc === 'function') {
		return Reflect.getMetadata(SERVICE_METADATA_KEY, svc);
	}
	return undefined;
}
