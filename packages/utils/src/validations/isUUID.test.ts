import { expect, test } from 'vitest';
import { randomUUID } from '../crypto/randomUUID';
import { isUUID } from './isUUID';

test('isUUID', () => {
  for (const [a, b] of [
    [undefined, false],
    [null, false],
    ['', false],
    [randomUUID(), true],
  ] as const) {
    expect(isUUID(a), `${a} -> ${b}`).toEqual(b);
  }
});
