import test from 'ava';
import { createNoopLogger } from '@wener/utils';
import { loadServerSystem } from '../loaders/loadServerSystem';
import { addPreload } from '../utils/addPreload';
import { DeclareFn, getGlobalSystem } from '../utils/getGlobalSystem';

test.before(async () => {
  await loadServerSystem({ logger: createNoopLogger() });

  const System = getGlobalSystem();
  // should works with import map
  System.addImportMap({
    imports: {
      'react/': 'package:react/',
    },
  });
});

test('hooks works', async (t) => {
  t.timeout(30_000, 'network hiccup');

  const System = getGlobalSystem();
  t.truthy(System);
  t.is(System.resolve('@test/test'), 'package:@test/test');

  // unaffected
  {
    // no override
    t.true(addPreload('test', { default: 'test' }));
    t.false(addPreload('test', { default: 'test1' }));
    t.true(System.has(System.resolve('test')));
    t.is((await System.import('test')).default, 'test');
    // override
    t.true(addPreload('test', { default: 'test1' }, { override: true }));
    t.is((await System.import('test')).default, 'test1');
  }
  {
    // async
    t.true(addPreload('test1', () => Promise.resolve({ default: 'test1' })));
    t.is((await System.import('test1')).default, 'test1');

    // sync
    t.true(addPreload('test2', () => ({ default: 'test2' })));
    // no override
    t.false(addPreload('test2', () => ({ default: 'test3' })));
    t.is((await System.import('test2')).default, 'test2');
    // override
    t.true(addPreload('test2', () => ({ default: 'test3' }), { override: true }));
    t.is((await System.import('test2')).default, 'test3');
  }

  {
    const { default: meta } = await System.import('package:react/package.json');
    t.is(meta.name, 'react');
    const { version } = await System.import('package:react');
    t.truthy(version);
    // match by import map, but bare react will not match
    await System.import('react/jsx-runtime');
  }

  {
    const { default: meta } = await System.import('package:@wener/reaction/package.json');
    t.is(meta.name, '@wener/reaction');
    const { sleep, shallowEqual } = await System.import('package:@wener/utils');
    t.truthy(sleep);
    t.truthy(shallowEqual);
    t.true(shallowEqual({}, {}));
  }
});

test('resolve', async (t) => {
  const System = getGlobalSystem();
  t.is(System.resolve('./a.js', '@wener/reaction'), 'package:@wener/reaction/a.js');
  // dynamic import 时的 parent
  t.is(System.resolve('./a.js', 'package:@wener/reaction'), 'package:@wener/reaction/a.js');

  t.is(System.resolve('./b.js', '@wener/reaction/dist/a.js'), 'package:@wener/reaction/dist/b.js');
  t.is(System.resolve('./b.js', 'package:@wener/reaction/dist/a.js'), 'package:@wener/reaction/dist/b.js');

  t.is(System.resolve('../b.js', '@wener/reaction/dist/a.js'), 'package:@wener/reaction/b.js');
  t.is(System.resolve('../b.js', 'package:@wener/reaction/dist/a.js'), 'package:@wener/reaction/b.js');
});

test('resolve throw', async (t) => {
  const System = getGlobalSystem();
  System.register('@wener/test', [], ((_, m) => {
    return {
      execute: async () => {
        await m.import('./hello.js');
      },
    };
  }) as DeclareFn);
  t.is(System.resolve('@wener/test'), '@wener/test');
  await t.throwsAsync(() => System.import('@wener/test'), { message: /Unable to resolve bare specifier/ });
});
