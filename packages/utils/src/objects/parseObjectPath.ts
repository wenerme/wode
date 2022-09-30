export type ObjectKey = string | symbol | number;
export type ObjectPath = Array<ObjectKey>;
export type ObjectPathLike = ObjectKey | ObjectPath;

/**
 * Parse object path
 *
 * @example
 * parseObjectPath('a.b.c') // => ['a', 'b', 'c']
 * parseObjectPath('a[0].b') // => ['a', 0, 'b']
 * parseObjectPath('a[0][1]') // => ['a', 0, 1]
 *
 */
export function parseObjectPath(s: ObjectPathLike): ObjectPath {
  if (typeof s !== 'string') {
    return Array.isArray(s) ? s : [s];
  }
  const parts = s.split('.');
  // fast path
  if (!s.includes('[')) {
    return parts;
  }

  const result = [];
  for (const part of parts) {
    if (!part.endsWith(']')) {
      result.push(part);
    } else {
      // a[0][1]
      // try parseInt can extend to support a[-1] to use .at access
      const s = part.split('[');
      for (let sub of s) {
        if (sub.endsWith(']')) {
          sub = sub.slice(0, -1);
        }
        result.push(sub);
      }
    }
  }
  return result;
}
