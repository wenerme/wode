import { createNoopLogger } from '@wener/utils';
import { assert, beforeAll, expect, test } from 'vitest';
import { loadServerSystem } from '../loaders/loadServerSystem';
import { addPreload } from '../utils/addPreload';
import { DeclareFn, getGlobalSystem } from '../utils/getGlobalSystem';

beforeAll(async () => {
  await loadServerSystem({ logger: createNoopLogger() });

  const System = getGlobalSystem();
  // should works with import map
  System.addImportMap({
    imports: {
      'react/': 'package:react/',
    },
  });
});

test('hooks works', async () => {
  const System = getGlobalSystem();
  expect(System).toBeTruthy();
  assert.equal(System.resolve('@test/test'), 'package:@test/test');

  // unaffected
  {
    // no override
    assert.isTrue(addPreload('test', { default: 'test' }));
    assert.isFalse(addPreload('test', { default: 'test1' }));
    assert.isTrue(System.has(System.resolve('test')));
    assert.equal((await System.import('test')).default, 'test');
    // override
    assert.isTrue(addPreload('test', { default: 'test1' }, { override: true }));
    assert.equal((await System.import('test')).default, 'test1');
  }
  {
    // async
    assert.isTrue(addPreload('test1', () => Promise.resolve({ default: 'test1' })));
    assert.equal((await System.import('test1')).default, 'test1');

    // sync
    assert.isTrue(addPreload('test2', () => ({ default: 'test2' })));
    // no override
    assert.isFalse(addPreload('test2', () => ({ default: 'test3' })));
    assert.equal((await System.import('test2')).default, 'test2');
    // override
    assert.isTrue(addPreload('test2', () => ({ default: 'test3' }), { override: true }));
    assert.equal((await System.import('test2')).default, 'test3');
  }

  {
    const { default: meta } = await System.import('package:react/package.json');
    assert.equal(meta.name, 'react');
    const { version } = await System.import('package:react');
    expect(version).toBeTruthy();
    // match by import map, but bare react will not match
    await System.import('react/jsx-runtime');
  }

  {
    const { default: meta } = await System.import('package:@wener/reaction/package.json');
    assert.equal(meta.name, '@wener/reaction');
    const { sleep, shallowEqual } = await System.import('package:@wener/utils');
    expect(sleep).toBeTruthy();
    expect(shallowEqual).toBeTruthy();
    assert.isTrue(shallowEqual({}, {}));
  }
}, 30_000);

test('resolve', async () => {
  const System = getGlobalSystem();
  assert.equal(System.resolve('./a.js', '@wener/reaction'), 'package:@wener/reaction/a.js');
  // dynamic import 时的 parent
  assert.equal(System.resolve('./a.js', 'package:@wener/reaction'), 'package:@wener/reaction/a.js');

  assert.equal(System.resolve('./b.js', '@wener/reaction/dist/a.js'), 'package:@wener/reaction/dist/b.js');
  assert.equal(System.resolve('./b.js', 'package:@wener/reaction/dist/a.js'), 'package:@wener/reaction/dist/b.js');

  assert.equal(System.resolve('../b.js', '@wener/reaction/dist/a.js'), 'package:@wener/reaction/b.js');
  assert.equal(System.resolve('../b.js', 'package:@wener/reaction/dist/a.js'), 'package:@wener/reaction/b.js');
});

test('resolve throw', async () => {
  const System = getGlobalSystem();
  System.register('@wener/test', [], ((_, m) => {
    return {
      execute: async () => {
        await m.import('./hello.js');
      },
    };
  }) as DeclareFn);
  assert.equal(System.resolve('@wener/test'), '@wener/test');
  // /Unable to resolve bare specifier/
  // 实际 404
  await expect(() => System.import('@wener/test')).rejects.toThrow();
}, 30_000);
