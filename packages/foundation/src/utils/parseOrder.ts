import { arrayOfMaybeArray } from '@wener/utils';

export type ParsedOrderRule = {
  field: string;
  order: 'asc' | 'desc';
  nulls?: 'last' | 'first';
};

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
export function parseOrder(order?: string | string[] | ParsedOrderRule[]): ParsedOrderRule[] {
  if (!order) {
    return [];
  }

  if (Array.isArray(order)) {
    if (!order.length) {
      return order as ParsedOrderRule[];
    }
    if (typeof order.at(0) !== 'string') {
      return order as ParsedOrderRule[];
    }
  }

  const arr = arrayOfMaybeArray(order as string | string[])
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter(Boolean);

  return arr.map((v) => {
    // const sp = v.match(/^(?<field>[a-z0-9_]+)(\s+(?<order>asc|desc))?(\s+(?<nulls>nulls\s+(?<nulls_order>last|first)))?$/i);
    const sp = v.split(/\s+/);
    let field = '';
    let order: ParsedOrderRule['order'];
    let nulls: ParsedOrderRule['nulls'];

    const f = sp.shift()!;
    if (f.startsWith('-') || f.startsWith('+')) {
      // (order = f.slice(1).trim()), f.startsWith('-') ? 'desc' : 'asc';
      field = f.slice(1).trim();
      order = f.startsWith('-') ? 'desc' : 'asc';
    } else {
      field = f.trim();
    }

    while (true) {
      const v = sp.shift()?.trim()?.toLowerCase();
      if (!v) {
        break;
      }

      switch (v) {
        case 'asc':
        case 'desc': {
          order = v;
          break;
        }

        case 'nulls': {
          nulls = sp.shift()?.trim()?.toLowerCase() === 'last' ? 'last' : 'first';
          break;
        }

        case 'last':
        case 'first': {
          nulls = v;
          break;
        }
      }
    }

    order ||= 'asc';
    // avoid undefined
    // NOTE pg default nulls first for desc, last for asc
    // https://www.postgresql.org/docs/current/queries-order.html
    if (!nulls) {
      return { field, order };
    }
    return {
      field,
      order,
      nulls,
    };
  });
}
