import test from 'ava';
import { createTranslate } from './createTranslate';

test('exports', (t) => {
  const out = createTranslate();
  t.is(typeof out, 'object', 'returns an object');
  t.is(typeof out.t, 'function', '~> has "t" function');
  t.is(typeof out.dict, 'function', '~> has "set" function');
  t.is(typeof out.locale, 'function', '~> has "locale" function');
});

test('usage', (t) => {
  const ctx = createTranslate({
    en: { hello: 'Hello, {{name}}!' },
    es: { hello: 'Hola {{name}}!' },
    pt: { foo: 'foo {{name}}~!' },
  });

  t.deepEqual(ctx.dict('en'), { hello: 'Hello, {{name}}!' });

  t.true(ctx.dict('foobar') === undefined);

  const foo = ctx.t('hello');
  t.is(foo, '', '~> "" w/o locale');

  t.is(ctx.locale('en'), 'en', '>>> ctx.locale()');

  t.is(ctx.locale(), 'en');

  const bar = ctx.t('hello');
  t.not(bar, '', '(en) found "hello" key');
  t.is(bar, 'Hello, !', '~> interpolations empty if missing param');

  const baz = ctx.t('hello', { name: 'world' });
  t.is(baz, 'Hello, world!', '~> interpolations successful');

  const bat = ctx.t('hello', { name: 'world' }, 'es');
  t.not(bat, '', '(es) found "hello" key');
  t.is(bat, 'Hola world!', '~> success');

  t.is(ctx.t('hello', { name: 'world' }, 'pt'), '', '(pt) did NOT find "hello" key');

  t.is(ctx.dict('pt', { hello: 'Oí {{name}}!' }), undefined, '>>> ctx.dict()');

  const quz = ctx.t('hello', { name: 'world' }, 'pt');
  t.not(quz, '', '(pt) found "hello" key');
  t.is(quz, 'Oí world!', '~> success');

  const qut = ctx.t('foo', { name: 'bar' }, 'pt');
  t.not(qut, '', '(pt) found "foo" key');
  t.is(qut, 'foo bar~!', '~> success');

  t.is(ctx.locale('es'), 'es', '>>> ctx.locale()');

  t.is(ctx.locale(), 'es');
  t.is(ctx.locale(''), 'es');
  t.is(ctx.locale(false as any), 'es');
  t.is(ctx.locale(null as any), 'es');
  t.is(ctx.locale(0 as any), 'es');

  const qux = ctx.t('hello', { name: 'default' });
  t.not(qux, '', '(es) found "hello" key');
  t.is(qux, 'Hola default!', '~> success');

  t.is(ctx.t('hello', { name: 'world' }, 'de'), '', '(de) did NOT find "hello" key');

  t.is(ctx.dict('de', { hello: 'Hallo {{name}}!' }), undefined, '>>> ctx.dict(de)');

  const qar = ctx.t('hello', { name: 'world' }, 'de');
  t.not(qar, '', '(de) found "hello" key');
  t.is(qar, 'Hallo world!', '~> success');
});

test('functional', (t) => {
  const ctx = createTranslate({
    en: {
      hello(value: any) {
        return `hello ${value || 'stranger'}~!`;
      },
    },
  });

  ctx.locale('en');

  const foo = ctx.t('hello');
  t.is(foo, 'hello stranger~!', '~> called function w/o param');

  const bar = ctx.t('hello', 'world' as any);
  t.is(bar, 'hello world~!', '~> called function w/ param (string)');

  const baz = ctx.t('hello', [1, 2, 3]);
  t.is(baz, 'hello 1,2,3~!', '~> called function w/ param (array)');
});

test('nested', (t) => {
  const ctx = createTranslate({
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
  t.is(ctx.t('fruits.apple'), 'apple', '(en) fruits.apple');
  t.is(ctx.t('fruits.orange'), 'orange', '(en) fruits.orange');
  t.is(ctx.t(['fruits', 'grape']), 'grape', '(en) ["fruits","grape"]');
  t.is(ctx.t('fruits.404'), '', '(en) fruits.404 ~> ""');
  t.is(ctx.t('error.404'), '', '(en) error.404 ~> ""');

  ctx.locale('es');
  t.is(ctx.t('fruits.apple'), 'manzana', '(es) fruits.apple');
  t.is(ctx.t('fruits.orange'), 'naranja', '(es) fruits.orange');
  t.is(ctx.t(['fruits', 'grape']), 'uva', '(es) ["fruits","grape"]');
  t.is(ctx.t('fruits.404'), '', '(es) fruits.404 ~> ""');
  t.is(ctx.t('error.404'), '', '(es) error.404 ~> ""');
});

test('arrays', (t) => {
  const ctx = createTranslate({
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

  t.is(ctx.t('foo', [1, 2, 3]), '1 + 2 = 3', '~> foo');

  t.is(ctx.t('bar.0.baz', { colors: ['red', 'blue'] }), 'roses are red, violets are blue', '~> bar.0.baz');
});

test('invalid value', (t) => {
  const ctx = createTranslate({
    en: {
      foo: ['bar'],
    },
  });

  t.deepEqual(ctx.t('foo', null as any, 'en'), ['bar']);
});

test('fallback', (t) => {
  const ctx = createTranslate({
    en: {
      a: 'a',
    },
    'en-US': {
      a: 'a-US',
    },
  });

  // t.deepEqual(ctx.t('a', undefined, 'en'), 'a');
  // t.deepEqual(ctx.t('a', undefined, 'en-US'), 'a-US');
  t.deepEqual(ctx.t('a', undefined, 'en-UK'), 'a');
});
