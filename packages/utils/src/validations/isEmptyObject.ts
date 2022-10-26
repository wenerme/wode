import { isPlainObject } from './isPlainObject';

export function isEmptyObject(o: any) {
  return isPlainObject(o) && Object.keys(o).length === 0;
}
