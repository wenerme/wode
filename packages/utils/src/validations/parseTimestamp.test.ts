import { assert, test } from 'vitest';
import { parseTimestamp } from './parseTimestamp';

test('parseTimestamp', () => {
  assert.equal(parseTimestamp(''), undefined);
  assert.equal(parseTimestamp(), undefined);
});
