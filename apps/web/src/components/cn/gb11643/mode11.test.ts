import { assert, test } from 'vitest';
import { mod11 } from './mod11';

test('mod11', () => {
  for (const [s, r] of [['11010519491231002', 'X']]) {
    assert.equal(mod11(s), r);
  }
});
