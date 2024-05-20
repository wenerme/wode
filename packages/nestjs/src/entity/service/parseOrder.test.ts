import { assert, test } from 'vitest';
import { parseOrder } from './parseOrder';

test('parseOrder', () => {
  for (const [o, e] of [
    //
    ['', []],
    ['a', [{ field: 'a', order: 'asc' }]],
    [['a'], [{ field: 'a', order: 'asc' }]],
    [[{ field: 'a', order: 'asc' }], [{ field: 'a', order: 'asc' }]],
    [[{ field: 'a', order: 'asc', nulls: 'last' }], [{ field: 'a', order: 'asc', nulls: 'last' }]],
    [
      '-a,+b',
      [
        { field: 'a', order: 'desc' },
        { field: 'b', order: 'asc' },
      ],
    ],
    ['a asc', [{ field: 'a', order: 'asc' }]],
    ['a desc', [{ field: 'a', order: 'desc' }]],
    ['a asc  last', [{ field: 'a', order: 'asc', nulls: 'last' }]],
    ['a asc nulls last', [{ field: 'a', order: 'asc', nulls: 'last' }]],
    ['a asc nulls first', [{ field: 'a', order: 'asc', nulls: 'first' }]],
    ['a asc   first', [{ field: 'a', order: 'asc', nulls: 'first' }]],
    ['a desc nulls last', [{ field: 'a', order: 'desc', nulls: 'last' }]],
    ['a desc nulls first', [{ field: 'a', order: 'desc', nulls: 'first' }]],
    ['a nulls first', [{ field: 'a', order: 'asc', nulls: 'first' }]],
    ['-a nulls first', [{ field: 'a', order: 'desc', nulls: 'first' }]],
    ['a.b', [{ field: 'a.b', order: 'asc' }]],
  ]) {
    assert.deepEqual(parseOrder(o as string), e as any, `parseOrder: ${JSON.stringify(o)}`);
  }
});
