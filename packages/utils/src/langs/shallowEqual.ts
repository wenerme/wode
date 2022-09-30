/**
 * shallow compare - support object, array
 *
 * @see {@link https://github.com/pmndrs/zustand/blob/main/src/shallow.ts zustand/src/shallow.ts}
 */
export function shallowEqual<T, U>(objA: T, objB: U) {
  if (Object.is(objA, objB)) {
    return true;
  }
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }
  const keysA = Object.keys(objA);
  if (keysA.length !== Object.keys(objB).length) {
    return false;
  }
  for (let i = 0; i < keysA.length; i++) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, keysA[i] as string) ||
      !Object.is(objA[keysA[i] as keyof T], objB[keysA[i] as keyof U])
    ) {
      return false;
    }
  }
  return true;
}
