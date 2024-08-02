import { expect, test } from 'vitest';
import { isSemanticZero, strip } from './strip.js';

test('prune', () => {
  expect(
    strip({
      a: undefined,
      b: null,
      c: NaN,
      d: new Date('abc'),
    }),
  ).toEqual({
    c: NaN,
    d: new Date('abc'),
  });
  expect(
    strip(
      {
        a: undefined,
        b: null,
        c: NaN,
        d: new Date('abc'),
      },
      isSemanticZero,
    ),
  ).toEqual(undefined);
});
