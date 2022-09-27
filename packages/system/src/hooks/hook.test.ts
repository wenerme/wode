import test from 'ava';
import { loadServerSystem } from '../loaders/loadServerSystem';
import { addSystemPreload } from '../utils/addSystemPreload';
import { getGlobalSystem } from '../utils/getGlobalSystem';

test.before(async () => {
  await loadServerSystem();

  const System = getGlobalSystem();
  // should works with import map
  System.applyImportMap({
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
    t.true(addSystemPreload('test', { default: 'test' }));
    t.false(addSystemPreload('test', { default: 'test1' }));
    t.true(System.has(System.resolve('test')));
    t.is((await System.import('test')).default, 'test');
    // override
    t.true(addSystemPreload('test', { default: 'test1' }, { override: true }));
    t.is((await System.import('test')).default, 'test1');
  }
  {
    // async
    t.true(addSystemPreload('test1', () => Promise.resolve({ default: 'test1' })));
    t.is((await System.import('test1')).default, 'test1');

    // sync
    t.true(addSystemPreload('test2', () => ({ default: 'test2' })));
    // no override
    t.false(addSystemPreload('test2', () => ({ default: 'test3' })));
    t.is((await System.import('test2')).default, 'test2');
    // override
    t.true(addSystemPreload('test2', () => ({ default: 'test3' }), { override: true }));
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
    const { sleep, shallow } = await System.import('package:@wener/utils');
    t.truthy(sleep);
    t.true(shallow({}, {}));
  }
});
