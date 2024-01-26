/**
 * PostgreSQL does not allow null characters in strings.
 */
export function removeNullChar(o: any): any {
  if (typeof o === 'string') {
    return o.replaceAll('\0', '');
  }
  if (typeof o !== 'object' || !o) {
    return o;
  }
  // same for object & array
  for (const k in o) {
    o[k] = removeNullChar(o[k]);
  }
  return o;
}

function transform(o: any, by: (v: any) => any) {
  if (typeof o !== 'object') {
    return by(o);
  }
  for (const k in o) {
    o[k] = by(o[k]);
  }
  return o;
}
