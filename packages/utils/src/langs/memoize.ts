// https://github.com/angus-c/just/blob/master/packages/function-memoize/index.mjs
type func = (...args: any) => any;

export function memoize<T extends func>(
  callback: T,
  {
    resolver = (...args: Parameters<T>) => JSON.stringify(args),
  }: { resolver?: (...args: Parameters<T>) => string } = {},
): T {
  if (typeof callback !== 'function') {
    throw new Error('`callback` should be a function');
  }

  if (resolver !== undefined && typeof resolver !== 'function') {
    throw new Error('`resolver` should be a function');
  }

  const cache: Record<string, any> = {};

  const memoized = function (this: any) {
    const args = Array.prototype.slice.call(arguments); // to simplify JSON.stringify
    const key = resolver.apply(this, args as Parameters<T>);

    if (!(key in cache)) {
      cache[key] = callback.apply(this, args);
    }

    return cache[key];
  };
  memoized.cache = cache;
  return memoized as func as T;
}
