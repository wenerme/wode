import { assert, test } from 'vitest';
import { removeNullChar } from './removeNullChar';

test('removeNullChar', () => {
  assert.equal(removeNullChar('a\0b\0c'), 'abc');
  assert.deepEqual(
    removeNullChar({
      a: 'a\0b\0c',
      b: [
        {
          a: 'a\0b\0c\0\0\u0000',
        },
      ],
    }),
    {
      a: 'abc',
      b: [
        {
          a: 'abc',
        },
      ],
    },
  );
});
