import test from 'ava';
import { parseTimestamp } from './parseTimestamp';

test('parseTimestamp', (t) => {
  t.is(parseTimestamp(''), undefined);
  t.is(parseTimestamp(), undefined);
});
