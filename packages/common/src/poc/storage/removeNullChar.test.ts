import { assert, expect, test } from 'vitest';
import { removeNullChar } from './removeNullChar';

test('removeNullChar', () => {
  // expect('a\0b\0c\0\0\u0000'.isWellFormed()).toBeTruthy();
  // expect('a\0b\0c'.isWellFormed()).toBeTruthy();
  // expect('ab\uD800'.isWellFormed()).toBeFalsy();

  assert.equal('\0', '\u0000');
  assert.equal(removeNullChar('a\0b\0c'), 'abc');
  assert.deepEqual(
    removeNullChar({
      a: 'a\0b\0c',
      b: [
        {
          a: 'a\0b\0c\0\0\u0000',
        },
        'a\0b\0c',
      ],
    }),
    {
      a: 'abc',
      b: [
        {
          a: 'abc',
        },
        'abc',
      ],
    },
  );
});
