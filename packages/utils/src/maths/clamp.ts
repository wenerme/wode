// export function clamp<T>(value: T | null | undefined, o: { min: T; max: T; default?: T }): T;

export function clamp<T>(value: T | null | undefined, min: T, max: T, def?: T): T;
export function clamp<T>(value: T | null | undefined, ...o: any[]): T {
  let min: T, max: T, def: T;
  if (o.length === 1) {
    ({ min, max, default: def = min! } = o[0]);
  } else {
    [min, max, def = min!] = o;
  }
  if (value === null || value === undefined) {
    return def;
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

// type Comparable = number | string | Date | BigInt;
