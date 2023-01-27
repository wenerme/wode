import test from 'ava';
import { loadServerSystem } from '../loaders/loadServerSystem';
import type { DeclareFn } from '../utils/getGlobalSystem';
import { getGlobalSystem } from '../utils/getGlobalSystem';

test.before(async () => {
  await loadServerSystem({ hooks: false });
});

test('SystemJS functional', async (t) => {
  const System = getGlobalSystem();
  // named register
  try {
    System.resolve('test');
    t.fail('should not resolve');
  } catch (e) {}

  // will throw error but still valid
  System.set('test0', { default: 'test0' });
  // proper way
  System.set('pkg:test1', { default: 'test1' });
  t.true(System.has('pkg:test1'));

  System.register('test', [], ((e) => {
    return {
      execute: async () => {
        e({ default: 'test' });
      },
    };
  }) as DeclareFn);
  t.is(System.resolve('test'), 'test');
  // t.log(Array.from(System.entries()));
  t.is((await System.import('test')).default, 'test');
});

test.failing('map', async (t) => {
  const System = getGlobalSystem();
  System.addImportMap({
    imports: {
      '@wener/test': 'package:@wener/test/a.js',
      '@wener/test/': 'package:@wener/test/',
    },
  });
  t.is(System.resolve('@wener/test'), 'package:@wener/test/a.js');
  // this failed
  t.is(System.resolve('./b.js', '@wener/test'), 'package:@wener/test/b.js');
});
