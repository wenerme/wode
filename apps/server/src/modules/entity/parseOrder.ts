import { arrayOfMaybeArray } from '@wener/utils';

export type OrderSort = [string, 'asc' | 'desc' | 'ASC' | 'DESC', 'last' | 'first' | 'LAST' | 'FIRST' | undefined];

/**
 * parsing order string
 *
 *  e.g.
 *  ```
 *  a desc
 *  +a,-b
 *  a asc nulls last
 *  a desc first
 *  ```
 */
export function parseOrder(
  order?: string | string[] | OrderSort[],
  {
    keyword = (s) => s.toLowerCase(),
  }: {
    keyword?: (s: string) => string;
  } = {},
): OrderSort[] {
  if (!order) {
    return [];
  }

  if (Array.isArray(order) && Array.isArray(order.at(0))) {
    return order as OrderSort[];
  }

  const arr = arrayOfMaybeArray(order as string | string[])
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter(Boolean);

  return arr.map((v) => {
    // const sp = v.match(/^(?<field>[a-z0-9_]+)(\s+(?<order>asc|desc))?(\s+(?<nulls>nulls\s+(?<nulls_order>last|first)))?$/i);
    const sp = v.split(/\s+/);
    const o: string[] = [];

    const f = sp.shift()!;
    if (f.startsWith('-') || f.startsWith('+')) {
      o.push(f.slice(1).trim(), f.startsWith('-') ? 'desc' : 'asc');
    } else {
      o[0] = f.trim();
    }

    while (true) {
      const v = sp.shift()?.trim()?.toLowerCase();
      if (!v) {
        break;
      }

      switch (v) {
        case 'asc':
        case 'desc': {
          o[1] = v;
          break;
        }

        case 'nulls': {
          o[2] = keyword(sp.shift()?.trim()?.toLowerCase() === 'last' ? 'last' : 'first');
          break;
        }

        case 'last':
        case 'first': {
          o[2] = keyword(v);
          break;
        }
      }
    }

    o[1] ||= keyword('asc');
    return o as any;
  }) as any;
}
