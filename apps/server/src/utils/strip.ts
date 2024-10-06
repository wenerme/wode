function isNumber(v: any): v is Number {
  return typeof v === 'number' || v instanceof Number;
}

function isDate(v: any): v is Date {
  return v instanceof Date;
}

export function isSemanticZero(v: any) {
  switch (v) {
    case '':
    case undefined:
    case null:
      return true;
  }
  if (isNumber(v)) {
    return v === 0 || Number.isNaN(v);
  }
  if (isDate(v)) {
    return v.getTime() === 0 || Number.isNaN(Number(v));
  }
  if (Array.isArray(v)) {
    return v.length === 0;
  }
  if (typeof v === 'object') {
    return Object.keys(v).length === 0;
  }
  return false;
}

export function stripNulls(o: any) {
  return strip(o, (v) => {
    switch (v) {
      case null:
        return undefined;
    }
    return v;
  });
}

export function strip(
  o: any,
  by: <V = any>(v: V) => V | undefined | boolean = (v: any) => {
    switch (v) {
      case undefined:
      case null:
        return undefined;
    }
    return v;
  },
) {
  o = falsy(by(o), o);
  if (o === undefined) {
    return undefined;
  }
  if (typeof o !== 'object') {
    return o;
  }
  if (Array.isArray(o)) {
    o = o.map((v) => strip(v, by)).filter((v) => v !== undefined);
    return falsy(by(o), o);
  }
  for (const k in o) {
    const v = (o[k] = strip(o[k], by));
    if (v === undefined) {
      delete o[k];
    }
  }
  return falsy(by(o), o);
}

const falsy = (v: any, vv: any) => {
  switch (v) {
    case true:
      return undefined;
    case false:
      return vv;
    default:
      return v;
  }
};
