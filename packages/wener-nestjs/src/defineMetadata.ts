import { get, set } from '@wener/utils';

type HasMetadata = {
  metadata: Record<string, any>;
};

type MetadataKey<T> = {
  key: string;
  type: T;
};

export function createMetadataKey<T>(key: string): MetadataKey<T> {
  return { key, type: null as any };
}

export function defineMetadata<T>(res: HasMetadata, key: MetadataKey<T>, opts: T) {
  set(res.metadata, key.key, opts);
}

export function getMetadata<T>(res: HasMetadata, key: MetadataKey<T>): T | undefined {
  return get(res.metadata, key.key);
}
