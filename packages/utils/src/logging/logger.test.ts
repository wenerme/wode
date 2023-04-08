import { test, expect } from 'vitest';
import { createChildLogger } from './createChildLogger';
import { createLogger } from './createLogger';

test('logger', () => {
  {
    const logs: any[] = [];
    const base = createLogger((o) => logs.push(o));
    const l = createChildLogger(base, { c: 'test' });
    l.info('hello');
    expect(logs.shift()).toEqual({ level: 'info', values: ['hello'], c: 'test' });
    l.child({ m: 1 }).trace('trace');
    expect(logs.shift()).toEqual({ level: 'trace', values: ['trace'], c: 'test', m: 1 });
  }
  createChildLogger(console, { c: 'test' }).info('hello');
  {
    let pass = 0;
    const l = createLogger(
      (o) => {
        pass++;
        console.log(`${o.level}: [${[o.m, o.c].filter(Boolean).join('.') || 'default'}]`, ...o.values);
      },
      {
        m: 'Root',
      },
    );
    l.info('nice');
    expect(pass).toBe(1);
    l.child({}).info('nice 2');
    expect(pass).toBe(2);
    createChildLogger(l, { m: 'Child' }).info('nice 3');
    expect(pass).toBe(3);

    createLogger().child({ name: 'wener' }).info({ x: 1 }, 'Nice');
  }
});
