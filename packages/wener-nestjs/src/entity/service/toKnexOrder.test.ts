import { expect, test } from 'vitest';
import { toKnexOrder } from './toKnexOrder';

test('toKnexOrder', () => {
  expect(toKnexOrder([])).toStrictEqual({});
  expect(
    toKnexOrder([
      {
        field: 'a',
        order: 'desc',
      },
      {
        field: 'a',
        order: 'asc',
      },
      {
        field: 'b',
        order: 'asc',
      },
      {
        field: 'c.a',
        order: 'asc',
      },
    ]),
  ).toStrictEqual({
    a: 'asc',
    b: 'asc',
    c: {
      a: 'asc',
    },
  });
});
