/**
 * Freezes the given object and all its nested objects recursively.
 *
 * @param {T} obj - The object to freeze.
 * @returns {T} - The frozen object.
 */
export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  const props = Object.getOwnPropertyNames(obj);
  for (const prop of props) {
    const value = (obj as any)[prop];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  }
  return Object.freeze(obj);
}
