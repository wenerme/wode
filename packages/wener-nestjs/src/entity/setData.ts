import { deepEqual, merge } from '@wener/utils';

export interface SetDataOptions {
  data?: any;
  schema?: any;
  partial?: boolean;
}

const overwriteMerge = (destinationArray: any, sourceArray: any, options: any) => sourceArray;

export function setData(data: any, { data: next, schema, partial }: SetDataOptions) {
  if (!next) {
    return data;
  }
  const last = data;
  if (partial) {
    data = merge(data, next, { arrayMerge: overwriteMerge });
  } else {
    data = next;
  }
  if (deepEqual(data, last)) {
    return data;
  }
  if (schema) {
    // TODO validate
  }
  return data;
}
