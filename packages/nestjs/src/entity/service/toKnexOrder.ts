export function toKnexOrder(order: OrderRule[]): Record<string, string> {
  return Object.fromEntries(
    order.map(({ field, order, nulls }) => {
      let o: string = order;
      if (nulls) {
        o = `${order} nulls ${nulls}`;
      }
      return [field, o];
    }),
  );
}

export type OrderRule = {
  field: string;
  order: 'asc' | 'desc';
  nulls?: 'last' | 'first';
};
