export type MaybeFunction<T, P extends any[] = any[]> = T | ((...args: P) => T);

export function maybeFunction<T, P extends any[] = any[]>(v: MaybeFunction<T, P>, ...args: P): T {
  // https://github.com/microsoft/TypeScript/issues/37663#issuecomment-759728342
  if (v instanceof Function) {
    return v(...args);
  }
  return v;
}
