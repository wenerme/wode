import 'reflect-metadata';

export const METHOD_METADATA_KEY = 'Service:Method:Metadata:Options';

export type MethodOptionsInit = Partial<MethodOptions>

export interface MethodOptions {
  name: string;
  input?: any;
  output?: any;
  timeout?: number;
  metadata?: Record<string, any>;
  stream?: true;
}

export const Method = (opts: MethodOptionsInit = {}): MethodDecorator => Reflect.metadata(METHOD_METADATA_KEY, opts);

export function getMethodOptions(proto: Object, key: string | symbol): MethodOptionsInit | undefined {
  return Reflect.getMetadata(METHOD_METADATA_KEY, proto, key);
}
