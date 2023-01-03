import type { MaybeArray } from '@wener/utils';
import { arrayOfMaybeArray } from '@wener/utils';

export type Order = Array<[string, 'ASC' | 'DESC', 'NULLS LAST' | 'NULLS FIRST']>;

export function parseOrder(s?: MaybeArray<string>): Order {
  const arr = arrayOfMaybeArray(s)
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter(Boolean);
  return arr.map((v) => {
    // const sp = v.match(/^(?<field>[a-z0-9_]+)(\s+(?<order>asc|desc))?(\s+(?<nulls>nulls\s+(?<nulls_order>last|first)))?$/i);
    const sp = v.split(/\s+/);
    const o: string[] = [];

    const f = sp.shift() as string;
    if (f.startsWith('-') || f.startsWith('+')) {
      o.push(f.slice(1).trim(), f.startsWith('-') ? 'DESC' : 'ASC');
    } else {
      o[0] = f.trim();
    }
    while (true) {
      const v = sp.shift()?.trim()?.toUpperCase();
      if (!v) {
        break;
      }
      switch (v) {
        case 'ASC':
        case 'DESC':
          o[1] = v;
          break;
        case 'NULLS':
          o[2] = `${v} ${sp.shift()?.trim()?.toUpperCase() === 'LAST' ? 'LAST' : 'FIRST'}`;
          break;
      }
    }
    o[1] ||= 'ASC';
    return o as any;
  }) as any;
}
