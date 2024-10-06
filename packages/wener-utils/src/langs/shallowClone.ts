export function shallowClone<T>(obj: T): T {
  if (!obj) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.slice() as T;
  }
  if (typeof obj === 'object') {
    return Object.assign({}, obj);
  }
  // skip Map, Set, WeakMap, WeakSet, Date, RegExp, etc.
  return obj;
}
