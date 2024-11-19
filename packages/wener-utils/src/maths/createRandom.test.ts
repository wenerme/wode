import { expect, test } from 'vitest';
import { createRandom } from './random';

test('createRandom', () => {
  let random = createRandom(0);
  expect(random.random(100)).toBe(47);
  for (const a of random) {
    expect(a).toBe(0.557133817113936);
    break;
  }
  expect(random.randomBytes(4)).toEqual(Uint8Array.from([163, 85, 196, 62]));
});
