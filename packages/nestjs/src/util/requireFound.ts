import { HttpException } from '@nestjs/common';

export function requireFound<T>(v: T | undefined, message?: string): T;
export function requireFound<T>(v: Promise<T | undefined>, message?: string): Promise<T>;
export function requireFound<T>(v: T | undefined | Promise<T | undefined>, message?: string): T | Promise<T> {
  if (v instanceof Promise) {
    return v.then((v) => requireFound(v));
  }

  if (v === undefined || v === null) {
    throw new HttpException(message || 'Not Found', 404);
  }

  return v;
}
