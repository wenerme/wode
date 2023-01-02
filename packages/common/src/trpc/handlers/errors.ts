import { TRPCError } from '@trpc/server';

export function requireFound<T>(v: T | undefined | null, message?: string): T;
export function requireFound<T>(v: Promise<T | undefined | null>, message?: string): Promise<T>;
export function requireFound<T>(
  v: T | undefined | null | Promise<T | undefined | null>,
  message?: string,
): T | Promise<T> {
  if (v instanceof Promise) {
    return v.then((v) => {
      return requireFound(v);
    });
  }

  if (v === undefined || v === null) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message,
    });
  }
  return v;
}
