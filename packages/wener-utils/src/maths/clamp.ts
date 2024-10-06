import { isDefined } from '../langs/isDefined';
import { isNullish } from '../langs/isNullish';

// export function clamp<T>(value: T | null | undefined, opts: { min?: T; max?: T; default?: T }): T;
export function clamp<T>(value: T | null | undefined, min: T, max: T, def?: T): T;
export function clamp<T>(value: T | null | undefined, ...o: any[]): T {
  let min: T, max: T, def: T;
  if (o.length === 1 && o[0] && typeof o[0] === 'object') {
    ({ min, max, default: def = min! } = o[0]);
  } else {
    [min, max, def = min!] = o;
  }
  if (isNullish(value)) {
    return def;
  }
  if (isDefined(min) && value < min) {
    return min;
  }
  if (isDefined(max) && value > max) {
    return max;
  }
  return value;
}
