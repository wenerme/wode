import test from 'ava';
import { legacy, resolve } from './resolve';

test('resolve legacy', (t) => {
  const base = {
    name: '@org/nice',
    main: 'main.cjs',
    module: 'module.mjs',
    system: 'system.js',
  };
  t.is(legacy(base, { fields: ['system'] }), './system.js');
  t.falsy(
    legacy(
      {
        main: 'index.js',
      },
      { fields: ['system'] },
    ),
    './system.js',
  );
});

test('resolve exports', (t) => {
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
    t.is(resolve(pkg, '.', { unsafe: true, conditions: ['system'] }), './dist/system.js');
    const options = { unsafe: true, conditions: ['system', 'production'] };
    t.is(resolve(pkg, '@org/nice', options), './dist/system.prod.js');
    t.is(resolve(pkg, '.', options), './dist/system.prod.js');
    t.is(resolve(pkg, './assets/icon.png', options), './dist/assets/icon.png');
    t.is(resolve(pkg, './src/hello', options), './src/hello.ts');
    t.is(resolve(pkg, '@org/nice/src/hello', options), './src/hello.ts');
    try {
      resolve(pkg, './xyz.js');
      t.fail();
    } catch (e) {}
  }
});
