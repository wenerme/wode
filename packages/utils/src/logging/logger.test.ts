import test from 'ava';
import { createChildLogger } from './createChildLogger';
import { createWriteLogger } from './createWriteLogger';

test('logger', (t) => {
  {
    const logs: any[] = [];
    const base = createWriteLogger((o) => logs.push(o));
    const l = createChildLogger(base, { c: 'test' });
    l.info('hello');
    t.deepEqual(logs.shift(), { level: 'info', values: ['hello'], c: 'test' });
    l.child({ m: 1 }).trace('trace');
    t.deepEqual(logs.shift(), { level: 'trace', values: ['trace'], c: 'test', m: 1 });
  }
  createChildLogger(console, { c: 'test' }).info('hello');
  {
    let pass = 0;
    const l = createWriteLogger(
      (o) => {
        pass++;
        t.log(`${o.level}: [${[o.m, o.c].filter(Boolean).join('.') || 'default'}]`, ...o.values);
      },
      {
        m: 'Root',
      },
    );
    l.info('nice');
    t.is(pass, 1);
    l.child({}).info('nice 2');
    t.is(pass, 2);
    createChildLogger(l, { m: 'Child' }).info('nice 3');
    t.is(pass, 3);
  }
});
