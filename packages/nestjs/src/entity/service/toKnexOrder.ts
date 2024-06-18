import { set } from '@wener/utils';

export function toKnexOrder(order: OrderRule[]): Record<string, any> {
  return order
    .map(({ field, order, nulls }) => {
      let o: string = order;
      if (nulls) {
        o = `${order} nulls ${nulls}`;
      }
      return [field, o];
    })
    .reduce(
      (acc, [field, o]) => {
        set(acc, field, o);
        return acc;
      },
      {} as Record<string, any>,
    );
}

export type OrderRule = {
  field: string;
  order: 'asc' | 'desc';
  nulls?: 'last' | 'first';
};
