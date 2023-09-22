import { MaybePromise } from '@wener/utils';

export interface Value<T> {
  get(): MaybePromise<T>;

  set(value: T): MaybePromise<void>;
}

export interface ReadonlyValue<T> {
  get(): MaybePromise<T>;
}

// export interface ExpiryValue<T> {
//   get(): MaybePromise<T>;
//   set(value: T, expiresAt: number): MaybePromise<void>;
// }

export type MaybeValue<T> = ReadonlyValue<T> | T;

export function getValue<T>(v: MaybeValue<T>): MaybePromise<T> {
  if (isValue(v)) {
    return v.get();
  }
  return v as any;
}

export function isValue(v: any): v is Value<any> {
  return typeof v === 'object' && v && 'get' in v && typeof v.get === 'function';
}
