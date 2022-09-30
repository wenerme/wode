import test from 'ava';
import { deepEqual } from './deepEqual';

test('deep equal', (t) => {
  t.true(
    deepEqual(
      {
        a: null,
        b: Infinity,
      },
      {
        a: null,
        b: Infinity,
      },
    ),
  );
});
