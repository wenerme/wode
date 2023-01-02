import test from 'ava';
import { parseOrder } from './parseOrder';

test('parseOrder', (t) => {
  for (const [o, e] of [
    //
    ['', []],
    ['a', [['a', 'ASC']]],
    [
      '-a,+b',
      [
        ['a', 'DESC'],
        ['b', 'ASC'],
      ],
    ],
    ['a asc', [['a', 'ASC']]],
    ['a desc', [['a', 'DESC']]],
    ['a asc nulls last', [['a', 'ASC', 'NULLS LAST']]],
    ['a asc nulls first', [['a', 'ASC', 'NULLS FIRST']]],
    ['a desc nulls last', [['a', 'DESC', 'NULLS LAST']]],
    ['a desc nulls first', [['a', 'DESC', 'NULLS FIRST']]],
    ['a nulls first', [['a', 'ASC', 'NULLS FIRST']]],
    ['-a nulls first', [['a', 'DESC', 'NULLS FIRST']]],
  ]) {
    t.deepEqual(parseOrder(o as string), e);
  }
});
