import { test, expect } from 'vitest';
import { isSemanticZero, trim } from './trim.js';

test('trim', () => {
  expect(
    trim({
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
    trim(
      {
        a: undefined,
        b: null,
        c: NaN,
        d: new Date('abc'),
      },
      isSemanticZero,
    ),
  ).toEqual();
});
