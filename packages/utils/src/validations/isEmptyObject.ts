export function isEmptyObject(o: any) {
  if (o === null || o === undefined) {
    return true;
  }
  return o.constructor === Object && Object.keys(o).length === 0;
}
