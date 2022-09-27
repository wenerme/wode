import test from 'ava';
import { createChildLogger } from './createChildLogger';
import { createWriteLogger } from './createWriteLogger';

test('logger', (t) => {
  {
    let logs: any[] = [];
    const base = createWriteLogger((o) => logs.push(o));
    let l = createChildLogger(base, { c: 'test' });
    l.info('hello');
    t.deepEqual(logs.shift(), { level: 'info', values: ['hello'], c: 'test' });
    l.child({ m: 1 }).trace('trace');
    t.deepEqual(logs.shift(), { level: 'trace', values: ['trace'], c: 'test', m: 1 });
  }
  createChildLogger(console, { c: 'test' }).info('hello');
});
