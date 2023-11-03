import { assert, test } from 'vitest';
import { parseOrder } from './parseOrder';

test('parseOrder', () => {
  for (const [o, e] of [
    //
    ['', []],
    ['a', [['a', 'asc']]],
    [['a'], [['a', 'asc']]],
    [[['a', 'desc']], [['a', 'desc']]],
    [[['a', 'desc', 'last']], [['a', 'desc', 'last']]],
    [
      '-a,+b',
      [
        ['a', 'desc'],
        ['b', 'asc'],
      ],
    ],
    ['a asc', [['a', 'asc']]],
    ['a desc', [['a', 'desc']]],
    ['a asc  last', [['a', 'asc', 'last']]],
    ['a asc nulls last', [['a', 'asc', 'last']]],
    ['a asc nulls first', [['a', 'asc', 'first']]],
    ['a asc   first', [['a', 'asc', 'first']]],
    ['a desc nulls last', [['a', 'desc', 'last']]],
    ['a desc nulls first', [['a', 'desc', 'first']]],
    ['a nulls first', [['a', 'asc', 'first']]],
    ['-a nulls first', [['a', 'desc', 'first']]],
    ['a.b', [['a.b', 'asc']]],
  ]) {
    assert.deepEqual(parseOrder(o as string), e as any, `${JSON.stringify(o)}`);
  }
});
