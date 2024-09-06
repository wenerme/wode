import { get } from '@wener/utils';
import type { JSONArgs } from './JSONArgs';

export function resolveGraphQLJSON(a: any, args: JSONArgs) {
  let o = a;
  if (args.path) {
    o = get(o, args.path);
  }
  if (args.default !== undefined) {
    o = o ?? args.default;
  }
  return o;
}
