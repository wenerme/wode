import { assert, beforeAll, expect, test } from 'vitest';
import { loadServerSystem } from '../loaders/loadServerSystem';
import type { DeclareFn } from '../utils/getGlobalSystem';
import { getGlobalSystem } from '../utils/getGlobalSystem';

beforeAll(async () => {
  await loadServerSystem({ hooks: false });
});

test('SystemJS functional', async () => {
  const System = getGlobalSystem();
  // named register
  try {
    System.resolve('test');
    expect.fail('should not resolve');
  } catch (e) {}

  // will throw error but still valid
  System.set('test0', { default: 'test0' });
  // proper way
  System.set('pkg:test1', { default: 'test1' });
  assert.isTrue(System.has('pkg:test1'));

  System.register('test', [], ((e) => {
    return {
      execute: async () => {
        e({ default: 'test' });
      },
    };
  }) as DeclareFn);
  assert.equal(System.resolve('test'), 'test');
  // t.log(Array.from(System.entries()));
  assert.equal((await System.import('test')).default, 'test');
});

test.fails('map', async () => {
  const System = getGlobalSystem();
  System.addImportMap({
    imports: {
      '@wener/test': 'package:@wener/test/a.js',
      '@wener/test/': 'package:@wener/test/',
    },
  });
  assert.equal(System.resolve('@wener/test'), 'package:@wener/test/a.js');
  // this failed
  assert.equal(System.resolve('./b.js', '@wener/test'), 'package:@wener/test/b.js');
});
