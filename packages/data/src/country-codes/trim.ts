export function trim(o: any) {
  switch (o) {
    case '':
    case undefined:
    case null:
      return undefined;
  }
  if (typeof o !== 'object') {
    return o;
  }
  if (Array.isArray(o)) {
    o = o.map(trim).filter((v) => v !== undefined);
    return o.length === 0 ? undefined : o;
  }
  for (let k in o) {
    const v = (o[k] = trim(o[k]));
    if (v === undefined) {
      delete o[k];
    }
  }
  return Object.keys(o).length === 0 ? undefined : o;
}
