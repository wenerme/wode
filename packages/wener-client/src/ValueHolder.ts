import { type MaybePromise } from '@wener/utils';

export interface ValueHolder<T> {
  get(): MaybePromise<T>;

  set(value: T): MaybePromise<void>;
}

export interface ReadonlyValueHolder<T> {
  get(): MaybePromise<T>;
}

export type MaybeValueHolder<T> = ReadonlyValueHolder<T> | T;

export function getValue<T>(v: MaybeValueHolder<T>): MaybePromise<T> {
  if (isValueHolder(v)) {
    return v.get();
  }

  return v as any;
}

export function isValueHolder(v: any): v is ValueHolder<any> {
  return typeof v === 'object' && v && 'get' in v && typeof v.get === 'function';
}
