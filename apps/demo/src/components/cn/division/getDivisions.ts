import { MaybePromise } from '@wener/utils';

let Divisions: Record<string, string>;

export function getDivisions(): MaybePromise<Record<string, string>> {
  if (Divisions) {
    return Divisions;
  }
  return import('@wener/data/cn/division/divisions.json').then((v) => (Divisions = v.default));
}
