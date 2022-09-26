import test from 'ava';
import { dequal } from './dequal';

test('deep equal', (t) => {
  t.true(
    dequal(
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
