import { arrayOfMaybeArray, type MaybeArray } from '@wener/utils';

export type SortRule = {
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
export function parseSort(
  order:
    | MaybeArray<
        | {
            field?: string;
            order?: string;
            nulls?: string;
          }
        | string
      >
    | undefined
    | null,
): SortRule[] {
  if (!order) {
    return [];
  }

  return arrayOfMaybeArray(order).flatMap((v): MaybeArray<SortRule> => {
    if (!v) return [];
    if (typeof v === 'object') {
      // invalid
      if (!v.field) {
        return [];
      }
      let rule: SortRule = {
        field: v.field,
        order: v.order?.toLowerCase() === 'asc' ? 'asc' : 'desc',
      };
      if (v.nulls) {
        rule.nulls = v.nulls.toLowerCase() === 'last' ? 'last' : 'first';
      }
      return rule;
    }
    return v
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .map(_parse);
  });
}

function _parse(v: string) {
  // const sp = v.match(/^(?<field>[a-z0-9_]+)(\s+(?<order>asc|desc))?(\s+(?<nulls>nulls\s+(?<nulls_order>last|first)))?$/i);
  const sp = v.split(/\s+/);
  let field = '';
  let order: SortRule['order'];
  let nulls: SortRule['nulls'];

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
}
