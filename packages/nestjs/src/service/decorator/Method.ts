import 'reflect-metadata';

export const METHOD_METADATA_KEY = 'Service:Method:Metadata:Options';

export interface MethodOptions {
  input?: any;
  output?: any;
  name?: string;
  timeout?: number;
  metadata?: Record<string, any>;
  stream?: true;
}

export const Method = (opts: MethodOptions = {}): MethodDecorator => Reflect.metadata(METHOD_METADATA_KEY, opts);

export function getMethodOptions(proto: Object, key: string | symbol): MethodOptions | undefined {
  return Reflect.getMetadata(METHOD_METADATA_KEY, proto, key);
}
