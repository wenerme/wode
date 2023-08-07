import { OrderSort } from './parseOrder';

export function toKnexOrder(order: OrderSort[]) {
  return Object.fromEntries(
    order.map(([a, b, c]) => {
      let sort: string = b;
      if (c) {
        sort = `${b} nulls ${c}`;
      }
      return [a, sort];
    }),
  );
}
