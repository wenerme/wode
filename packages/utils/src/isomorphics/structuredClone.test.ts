import test from 'ava';
import { classOf } from '../langs/classOf';
import { _clone } from './structuredClone';

test('structuredClone', (t) => {
  for (const [k, v] of [
    ['', ''],
    [Number(1), 1],
  ]) {
    let c = _clone(k);
    t.deepEqual(c, v);
    t.is(classOf(c), classOf(v));
  }
});
