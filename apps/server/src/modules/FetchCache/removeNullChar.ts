export function removeNullChar(o: any): any {
  if (typeof o === 'string') {
    return o.replaceAll('\u0000', '');
  }
  if (typeof o !== 'object' || !o) {
    return o;
  }
  if (Array.isArray(o)) {
    return o.map(removeNullChar);
  }
  for (const k in o) {
    o[k] = removeNullChar(o[k]);
  }
  return o;
}
