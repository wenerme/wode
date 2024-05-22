import type { AbstractConstructor, Constructor } from '@wener/nestjs';

export function getObjectName<T extends object>(Type: Constructor<T> | AbstractConstructor<T>) {
  return Type.name.replace(/Object$/, '');
}

export function getInputName<T extends object>(Type: Constructor<T> | AbstractConstructor<T>) {
  return Type.name.replace(/Input$/, '');
}
