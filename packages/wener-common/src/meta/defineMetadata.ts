import { startCase } from 'es-toolkit';
import { get, set } from 'es-toolkit/compat';

type HasMetadata = {
  metadata?: Record<string, any>;
};

type MetadataKey<T> = {
  key: string;
  type: T;
  title: string;
  description?: string;
};

interface CreateMetadataKeyOptions {
  key: string;
  title?: string;
  description?: string;
}

export function createMetadataKey<T = never>(key: string, opts?: Omit<CreateMetadataKeyOptions, 'key'>): MetadataKey<T>;
export function createMetadataKey<T = never>(opts: CreateMetadataKeyOptions): MetadataKey<T>;
export function createMetadataKey<T = never>(a: any, b?: any): MetadataKey<T> {
  const opts: CreateMetadataKeyOptions =
    typeof a === 'string'
      ? {
          key: a,
          ...b,
        }
      : a;

  const { key } = opts;
  opts.title ||= startCase(key);

  const k: MetadataKey<T> = {
    ...opts,
    type: null as any,
  } as MetadataKey<T>;

  if ('toStringTag' in Symbol && typeof Symbol.toStringTag === 'symbol') {
    Object.defineProperty(k, Symbol.toStringTag, {
      value: key,
    });
  }

  return k;
}

export function defineMetadata<T>(res: HasMetadata, key: MetadataKey<T>, opts: T): void;
export function defineMetadata<T>(key: MetadataKey<T>, items: Array<[HasMetadata, T]>): void;
export function defineMetadata<T>(a: any, b: any, c?: any) {
  if (Array.isArray(b)) {
    const key = a;
    const items = b;
    for (const [res, opts] of items) {
      defineMetadata(res, key, opts);
    }
  } else {
    const res = a;
    const key = b;
    const opts = c;
    res.metadata = res.metadata || {};
    set(res.metadata, key.key, opts);
  }
}

export function getMetadata<T>(res: HasMetadata | undefined | null, key: MetadataKey<T>): T | undefined {
  if (!res?.metadata) return undefined;
  return get(res.metadata, key.key);
}
