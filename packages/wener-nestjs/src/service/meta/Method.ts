import 'reflect-metadata';
import type { MethodOptions } from './client.types';

export const METHOD_METADATA_KEY = 'Service:Method:Metadata:Options';

export type MethodOptionsInit = Partial<MethodOptions>;

export const Method = (opts: MethodOptionsInit = {}): MethodDecorator => Reflect.metadata(METHOD_METADATA_KEY, opts);

export function getMethodOptions(proto: Record<string, unknown>, key: string | symbol): MethodOptionsInit | undefined {
  return Reflect.getMetadata(METHOD_METADATA_KEY, proto, key);
}
