import { assert, expect, test } from 'vitest';
import { legacy, resolve } from './resolve';

test('resolve legacy', () => {
  const base = {
    name: '@org/nice',
    main: 'main.cjs',
    module: 'module.mjs',
    system: 'system.js',
  };
  assert.equal(legacy(base, { fields: ['system'] }), './system.js');
  expect(
    legacy(
      {
        main: 'index.js',
      },
      { fields: ['system'] },
    ),
    './system.js',
  ).toBeFalsy();
});

test('resolve exports', () => {
  const base = {
    name: '@org/nice',
    exports: {
      '.': {
        import: './dist/module.mjs',
        require: './dist/require.js',
        system: {
          production: './dist/system.prod.js',
          default: './dist/system.js',
        },
      },
      './assets/*': './dist/assets/*',
      './src/*': './src/*.ts',
    },
  };
  {
    const pkg = base;
    assert.equal(resolve(pkg, '.', { unsafe: true, conditions: ['system'] }), './dist/system.js');
    const options = { unsafe: true, conditions: ['system', 'production'] };
    assert.equal(resolve(pkg, '@org/nice', options), './dist/system.prod.js');
    assert.equal(resolve(pkg, '.', options), './dist/system.prod.js');
    assert.equal(resolve(pkg, './assets/icon.png', options), './dist/assets/icon.png');
    assert.equal(resolve(pkg, './src/hello', options), './src/hello.ts');
    assert.equal(resolve(pkg, '@org/nice/src/hello', options), './src/hello.ts');
    try {
      resolve(pkg, './xyz.js');
      expect.fail();
    } catch (e) {}
  }
});
