import { expect, test } from 'vitest';
import { parseObjectPath } from './parseObjectPath';

test('parseObjectPath', () => {
  for (const [k, v] of [
    ['a.b.c', ['a', 'b', 'c']],
    ['a[1].c', ['a', '1', 'c']],
    ['a.1.c', ['a', '1', 'c']],
    ['a[b].c', ['a', 'b', 'c']],
    ['arr[1][0]', ['arr', '1', '0']],
    ['arr.2', ['arr', '2']],
    ['arr[2]', ['arr', '2']],
    [Symbol.toStringTag, [Symbol.toStringTag]],
    [[Symbol.toStringTag], [Symbol.toStringTag]],
  ]) {
    expect(parseObjectPath(k)).toEqual(v);
  }
});
