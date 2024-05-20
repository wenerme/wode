import type { AbstractConstructor, Constructor } from '@wener/nestjs';

export function getObjectName<T extends object>(ObjectType: Constructor<T> | AbstractConstructor<T>) {
  return ObjectType.name.replace(/Object$/, '');
}

export function getInputName<T extends object>(ObjectType: Constructor<T> | AbstractConstructor<T>) {
  return ObjectType.name.replace(/Input$/, '');
}
