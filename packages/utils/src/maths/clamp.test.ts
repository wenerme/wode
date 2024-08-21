import { expect, test } from 'vitest';
import { clamp } from './clamp';

test('clamp', () => {
  for (const [a, b] of [
    [[null, 0, 0], 0],
    [[null, 1, 10], 1],
    [[undefined, 1, 10], 1],
    [[undefined, 1, 10, 5], 5],
    [[2, 1, 10, 5], 2],
    [[11, 1, 10, 5], 10],
    [[11, { min: 1, max: 10 }], 10],
    [[null, { min: 1, max: 10 }], 1],
    [[null, { min: 1, max: 10, default: 5 }], 5],
    [[2n, 1, 10, 5], 2n],
    [[1, 2], 2], //  min
    [[1, undefined, 0], 0], // max
    [[], undefined],
    [[null], undefined],
  ]) {
    expect(clamp.apply(null, a as any), `${a} -> ${b}`).toBe(b);
  }
});
