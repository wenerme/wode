import { assert, test } from 'vitest';
import { HSLToRGB } from './hsl';

test('hsl', () => {
  assert.equal(
    HSLToRGB(...('259 94% 51%'.split(/\s/).map((v) => parseFloat(v)) as [number, number, number]))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join(''),
    '570df8',
  );
});
