import { assert, test } from 'vitest';
import { createTranslate } from './createTranslate';

test('exports', () => {
  assert.equal(typeof createTranslate, 'function', 'exports a function');

  let out = createTranslate();
  assert.equal(typeof out, 'object', 'returns an object');
  assert.equal(typeof out.t, 'function', '~> has "t" function');
  assert.equal(typeof out.dict, 'function', '~> has "dict" function');
  assert.equal(typeof out.locale, 'function', '~> has "locale" function');
});

test('usage', () => {
  let ctx = createTranslate({
    en: { hello: 'Hello, {{name}}!' },
    es: { hello: 'Hola {{name}}!' },
    pt: { foo: 'foo {{name}}~!' },
  });

  assert.deepEqual(ctx.dict('en'), { hello: 'Hello, {{name}}!' });

  assert.equal(ctx.dict('foobar'), undefined);

  let foo = ctx.t('hello');
  assert.equal(foo, '', '~> "" w/o locale');

  assert.equal(ctx.locale('en'), 'en', '>>> ctx.locale()');

  assert.equal(ctx.locale(), 'en');

  let bar = ctx.t('hello');

  assert.notEqual(bar, '', '(en) found "hello" key');
  assert.equal(bar, 'Hello, !', '~> interpolations empty if missing param');

  let baz = ctx.t('hello', { name: 'world' });
  assert.equal(baz, 'Hello, world!', '~> interpolations successful');

  let bat = ctx.t('hello', { name: 'world' }, 'es');
  assert.notEqual(bat, '', '(es) found "hello" key');
  assert.equal(bat, 'Hola world!', '~> success');

  assert.equal(ctx.t('hello', { name: 'world' }, 'pt'), '', '(pt) did NOT find "hello" key');

  assert.equal(ctx.dict('pt', { hello: 'Oí {{name}}!' }), undefined, '>>> ctx.set()');

  let quz = ctx.t('hello', { name: 'world' }, 'pt');
  assert.notEqual(quz, '', '(pt) found "hello" key');
  assert.equal(quz, 'Oí world!', '~> success');

  let qut = ctx.t('foo', { name: 'bar' }, 'pt');
  assert.notEqual(qut, '', '(pt) found "foo" key');
  assert.equal(qut, 'foo bar~!', '~> success');

  assert.equal(ctx.locale('es'), 'es', '>>> ctx.locale()');

  assert.equal(ctx.locale(), 'es');
  assert.equal(ctx.locale(''), 'es');
  assert.equal(ctx.locale(false as any), 'es');
  assert.equal(ctx.locale(null as any), 'es');
  assert.equal(ctx.locale(0 as any), 'es');

  let qux = ctx.t('hello', { name: 'default' });
  assert.notEqual(qux, '', '(es) found "hello" key');
  assert.equal(qux, 'Hola default!', '~> success');

  assert.equal(ctx.t('hello', { name: 'world' }, 'de'), '', '(de) did NOT find "hello" key');

  assert.equal(ctx.dict('de', { hello: 'Hallo {{name}}!' }), undefined, '>>> ctx.set(de)');

  let qar = ctx.t('hello', { name: 'world' }, 'de');
  assert.notEqual(qar, '', '(de) found "hello" key');
  assert.equal(qar, 'Hallo world!', '~> success');
});

test('functional', () => {
  let ctx = createTranslate({
    en: {
      hello(value: string) {
        return `hello ${value || 'stranger'}~!`;
      },
    },
  });

  ctx.locale('en');

  let foo = ctx.t('hello');
  assert.equal(foo, 'hello stranger~!', '~> called function w/o param');

  let bar = ctx.t('hello', 'world' as any);
  assert.equal(bar, 'hello world~!', '~> called function w/ param (string)');

  let baz = ctx.t('hello', [1, 2, 3]);
  assert.equal(baz, 'hello 1,2,3~!', '~> called function w/ param (array)');
});

test('nested', () => {
  let ctx = createTranslate({
    en: {
      fruits: {
        apple: 'apple',
        orange: 'orange',
        grape: 'grape',
      },
    },
    es: {
      fruits: {
        apple: 'manzana',
        orange: 'naranja',
        grape: 'uva',
      },
    },
  });

  ctx.locale('en');
  assert.equal(ctx.t('fruits.apple'), 'apple', '(en) fruits.apple');
  assert.equal(ctx.t('fruits.orange'), 'orange', '(en) fruits.orange');
  assert.equal(ctx.t(['fruits', 'grape']), 'grape', '(en) ["fruits","grape"]');
  assert.equal(ctx.t('fruits.404'), '', '(en) fruits.404 ~> ""');
  assert.equal(ctx.t('error.404'), '', '(en) error.404 ~> ""');

  ctx.locale('es');
  assert.equal(ctx.t('fruits.apple'), 'manzana', '(es) fruits.apple');
  assert.equal(ctx.t('fruits.orange'), 'naranja', '(es) fruits.orange');
  assert.equal(ctx.t(['fruits', 'grape']), 'uva', '(es) ["fruits","grape"]');
  assert.equal(ctx.t('fruits.404'), '', '(es) fruits.404 ~> ""');
  assert.equal(ctx.t('error.404'), '', '(es) error.404 ~> ""');
});

test('arrays', () => {
  let ctx = createTranslate({
    en: {
      foo: '{{0}} + {{1}} = {{2}}',
      bar: [
        {
          baz: 'roses are {{colors.0}}, violets are {{colors.1}}',
        },
      ],
    },
  });

  ctx.locale('en');

  assert.equal(ctx.t('foo', [1, 2, 3]), '1 + 2 = 3', '~> foo');

  assert.equal(ctx.t('bar.0.baz', { colors: ['red', 'blue'] }), 'roses are red, violets are blue', '~> bar.0.baz');
});

test('invalid value', () => {
  let ctx = createTranslate({
    en: {
      foo: ['bar'],
    },
  });

  assert.deepEqual(ctx.t('foo', null as never, 'en'), ['bar'] as any);
});
