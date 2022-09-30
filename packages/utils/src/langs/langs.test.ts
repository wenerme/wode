import test from 'ava';
import { classOf } from './classOf';

test('classOf', (t) => {
  for (const [k, v] of [
    [0, 'Number'],
    ['', 'String'],
    [true, 'Boolean'],
    [null, 'Null'],
    [undefined, 'Undefined'],
    [{}, 'Object'],
    [[], 'Array'],
    [new ArrayBuffer(0), 'ArrayBuffer'],
    [new Map(), 'Map'],
    [new Set(), 'Set'],
    [new Date(), 'Date'],
    [new RegExp(''), 'RegExp'],
    [new DataView(new ArrayBuffer(0)), 'DataView'],
    [new Int8Array(0), 'Int8Array'],
  ]) {
    t.is(classOf(k), v as any);
  }
});
