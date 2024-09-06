import { assert, describe, test } from 'vitest';
import { merge, type MergeOptions } from './merge';

describe('custom-array-merge', () => {
  test('custom merge array', () => {
    var mergeFunctionCalled = false;

    function overwriteMerge(_target: any, source: any, options: any) {
      mergeFunctionCalled = true;
      assert.equal(options.arrayMerge, overwriteMerge);

      return source;
    }

    const destination = {
      someArray: [1, 2],
      someObject: { what: 'yes' },
    };
    const source = {
      someArray: [1, 2, 3],
    };

    const actual = merge(destination, source, { arrayMerge: overwriteMerge });
    const expected = {
      someArray: [1, 2, 3],
      someObject: { what: 'yes' },
    };
    assert.isTrue(mergeFunctionCalled);
    assert.deepEqual(actual, expected);
  });

  test('merge top-level arrays', function () {
    function overwriteMerge(_a: any, b: any) {
      return b;
    }

    var actual = merge([1, 2], [1, 2], { arrayMerge: overwriteMerge });
    var expected = [1, 2];

    assert.deepEqual(actual, expected);
  });

  test('cloner function is available for merge functions to use', function () {
    var customMergeWasCalled = false;

    function cloneMerge(target: any, source: any, options: any) {
      customMergeWasCalled = true;
      assert.isTrue(!!options.cloneUnlessOtherwiseSpecified, 'cloner function is available');
      return target.concat(source).map(function (element: any) {
        return options.cloneUnlessOtherwiseSpecified(element, options);
      });
    }

    var src = {
      key1: ['one', 'three'],
      key2: ['four'],
    };
    var target = {
      key1: ['one', 'two'],
    };

    var expected = {
      key1: ['one', 'two', 'one', 'three'],
      key2: ['four'],
    };

    assert.deepEqual(merge(target, src, { arrayMerge: cloneMerge }), expected);
    assert.isTrue(customMergeWasCalled);
    assert.isTrue(Array.isArray(merge(target, src).key1));
    assert.isTrue(Array.isArray((merge(target, src) as any).key2));
  });
});

describe('custom-is-mergeable-object', () => {
  test(`isMergeableObject function copying object over object`, () => {
    const src = { key: { isMergeable: false }, baz: `yes` };
    const target = { key: { foo: `wat` }, baz: `whatever` };

    function isMergeableObject(object: any) {
      return object && typeof object === `object` && object.isMergeable !== false;
    }

    const res = merge(target, src, {
      isMergeableObject,
    });

    assert.deepEqual(res, { key: { isMergeable: false }, baz: `yes` });
    assert.equal(res.key, src.key, `Object has the same identity and was not cloned`);
  });

  test(`isMergeableObject function copying object over nothing`, () => {
    const src = { key: { isMergeable: false, foo: `bar` }, baz: `yes` };
    const target = { baz: `whatever` };

    function isMergeableObject(object: any) {
      return object && typeof object === `object` && object.isMergeable !== false;
    }

    const res: any = merge(target, src, {
      isMergeableObject,
    });

    assert.deepEqual(res, { key: { isMergeable: false, foo: `bar` }, baz: `yes` });
    assert.equal(res.key, src.key, `Object has the same identity and was not cloned`);
  });

  test(`example from readme`, () => {
    const { isPlainObject } = require(`is-plain-object`);

    class SuperSpecial {
      special = `oh yeah man totally`;
    }

    const instantiatedSpecialObject: any = new SuperSpecial();

    const target = {
      someProperty: {
        cool: `oh for sure`,
      },
    };

    const source = {
      someProperty: instantiatedSpecialObject,
    };

    const defaultOutput = merge(target, source);

    assert.equal(defaultOutput.someProperty.cool, `oh for sure`);
    assert.equal(defaultOutput.someProperty.special, `oh yeah man totally`);
    assert.equal(defaultOutput.someProperty instanceof SuperSpecial, false);

    const customMergeOutput = merge(target, source, {
      isMergeableObject: isPlainObject,
    });

    assert.equal(customMergeOutput.someProperty.cool, undefined);
    assert.equal(customMergeOutput.someProperty.special, `oh yeah man totally`);
    assert.equal(customMergeOutput.someProperty instanceof SuperSpecial, true);
  });
});

describe('merge-all', () => {
  test('throw error if first argument is not an array', function () {
    assert.throws(merge.all.bind(null, { example: true } as any, { another: '2' } as any), Error);
  });

  test('return an empty object if first argument is an array with no elements', function () {
    assert.deepEqual(merge.all([]), {});
  });

  test('Work just fine if first argument is an array with least than two elements', function () {
    var actual = merge.all([{ example: true }]);
    var expected = { example: true };
    assert.deepEqual(actual, expected);
  });

  test('execute correctly if options object were not passed', function () {
    var arrayToMerge = [{ example: true }, { another: '123' }];
    assert.doesNotThrow(merge.all.bind(null, arrayToMerge));
  });

  test('execute correctly if options object were passed', function () {
    var arrayToMerge = [{ example: true }, { another: '123' }];
    assert.doesNotThrow(merge.all.bind(null, arrayToMerge, { clone: true }));
  });

  test('invoke merge on every item in array should result with all props', function () {
    var firstObject = { first: true };
    var secondObject = { second: false };
    var thirdObject = { third: 123 };
    var fourthObject = { fourth: 'some string' };

    var mergedObject = merge.all([firstObject, secondObject, thirdObject, fourthObject]);

    assert.isTrue(mergedObject.first === true);
    assert.isTrue(mergedObject.second === false);
    assert.isTrue(mergedObject.third === 123);
    assert.isTrue(mergedObject.fourth === 'some string');
  });

  test('invoke merge on every item in array with clone should clone all elements', function () {
    var firstObject = { a: { d: 123 } };
    var secondObject = { b: { e: true } };
    var thirdObject = { c: { f: 'string' } };

    var mergedWithClone = merge.all([firstObject, secondObject, thirdObject], { clone: true });

    assert.notEqual(mergedWithClone.a, firstObject.a);
    assert.notEqual(mergedWithClone.b, secondObject.b);
    assert.notEqual(mergedWithClone.c, thirdObject.c);
  });

  test('invoke merge on every item in array clone=false should not clone all elements', function () {
    var firstObject = { a: { d: 123 } };
    var secondObject = { b: { e: true } };
    var thirdObject = { c: { f: 'string' } };

    var mergedWithoutClone = merge.all([firstObject, secondObject, thirdObject], { clone: false });

    assert.equal(mergedWithoutClone.a, firstObject.a);
    assert.equal(mergedWithoutClone.b, secondObject.b);
    assert.equal(mergedWithoutClone.c, thirdObject.c);
  });

  test('invoke merge on every item in array without clone should clone all elements', function () {
    var firstObject = { a: { d: 123 } };
    var secondObject = { b: { e: true } };
    var thirdObject = { c: { f: 'string' } };

    var mergedWithoutClone = merge.all([firstObject, secondObject, thirdObject]);

    assert.notEqual(mergedWithoutClone.a, firstObject.a);
    assert.notEqual(mergedWithoutClone.b, secondObject.b);
    assert.notEqual(mergedWithoutClone.c, thirdObject.c);
  });
});

describe('merge', () => {
  test('add keys in target that do not exist at the root', function () {
    var src = { key1: 'value1', key2: 'value2' };
    var target = {};

    var res = merge(target, src);

    assert.deepEqual(target, {}, 'merge should be immutable');
    assert.deepEqual(res, src);
  });

  test('merge existing simple keys in target at the roots', function () {
    var src = { key1: 'changed', key2: 'value2' };
    var target = { key1: 'value1', key3: 'value3' };

    var expected = {
      key1: 'changed',
      key2: 'value2',
      key3: 'value3',
    };

    assert.deepEqual(target, { key1: 'value1', key3: 'value3' });
    assert.deepEqual(merge(target, src), expected);
  });

  test('merge nested objects into target', function () {
    var src = {
      key1: {
        subkey1: 'changed',
        subkey3: 'added',
      },
    };
    var target = {
      key1: {
        subkey1: 'value1',
        subkey2: 'value2',
      },
    };

    var expected = {
      key1: {
        subkey1: 'changed',
        subkey2: 'value2',
        subkey3: 'added',
      },
    };

    assert.deepEqual(target, {
      key1: {
        subkey1: 'value1',
        subkey2: 'value2',
      },
    });
    assert.deepEqual(merge(target, src), expected);
  });

  test('replace simple key with nested object in target', function () {
    var src = {
      key1: {
        subkey1: 'subvalue1',
        subkey2: 'subvalue2',
      },
    };
    var target = {
      key1: 'value1',
      key2: 'value2',
    };

    var expected = {
      key1: {
        subkey1: 'subvalue1',
        subkey2: 'subvalue2',
      },
      key2: 'value2',
    };

    assert.deepEqual(target, { key1: 'value1', key2: 'value2' });
    assert.deepEqual(merge(target, src), expected);
  });

  test('should add nested object in target', function () {
    var src = {
      b: {
        c: {},
      },
    };

    var target = {
      a: {},
    };

    var expected = {
      a: {},
      b: {
        c: {},
      },
    };

    assert.deepEqual(merge(target, src), expected);
  });

  test('should clone source and target', function () {
    var src = {
      b: {
        c: 'foo',
      },
    };

    var target = {
      a: {
        d: 'bar',
      },
    };

    var expected = {
      a: {
        d: 'bar',
      },
      b: {
        c: 'foo',
      },
    };

    var merged = merge(target, src, { clone: true });

    assert.deepEqual(merged, expected);

    assert.notEqual(merged.a, target.a);
    assert.notEqual(merged.b, src.b);
  });

  test('should clone source and target', function () {
    var src = {
      b: {
        c: 'foo',
      },
    };

    var target = {
      a: {
        d: 'bar',
      },
    };

    var merged = merge(target, src);
    assert.notEqual(merged.a, target.a);
    assert.notEqual(merged.b, src.b);
  });

  test('should replace object with simple key in target', function () {
    var src = { key1: 'value1' };
    var target = {
      key1: {
        subkey1: 'subvalue1',
        subkey2: 'subvalue2',
      },
      key2: 'value2',
    };

    var expected = { key1: 'value1', key2: 'value2' };

    assert.deepEqual(target, {
      key1: {
        subkey1: 'subvalue1',
        subkey2: 'subvalue2',
      },
      key2: 'value2',
    });
    assert.deepEqual(merge(target, src), expected);
  });

  test('should replace objects with arrays', function () {
    var target = { key1: { subkey: 'one' } };

    var src = { key1: ['subkey'] };

    var expected = { key1: ['subkey'] };

    assert.deepEqual(merge(target, src), expected);
  });

  test('should replace arrays with objects', function () {
    var target = { key1: ['subkey'] };

    var src = { key1: { subkey: 'one' } };

    var expected = { key1: { subkey: 'one' } };

    assert.deepEqual(merge(target, src), expected);
  });

  test('should replace dates with arrays', function () {
    var target = { key1: new Date() };

    var src = { key1: ['subkey'] };

    var expected = { key1: ['subkey'] };

    assert.deepEqual(merge(target, src), expected);
  });

  test('should replace null with arrays', function () {
    var target = {
      key1: null,
    };

    var src = {
      key1: ['subkey'],
    };

    var expected = {
      key1: ['subkey'],
    };

    assert.deepEqual(merge(target, src), expected);
  });

  test('should work on simple array', function () {
    var src = ['one', 'three'];
    var target = ['one', 'two'];

    var expected = ['one', 'two', 'one', 'three'];

    assert.deepEqual(merge(target, src), expected);
    assert.isTrue(Array.isArray(merge(target, src)));
  });

  test('should work on another simple array', function () {
    var target = ['a1', 'a2', 'c1', 'f1', 'p1'];
    var src = ['t1', 's1', 'c2', 'r1', 'p2', 'p3'];

    var expected = ['a1', 'a2', 'c1', 'f1', 'p1', 't1', 's1', 'c2', 'r1', 'p2', 'p3'];
    assert.deepEqual(target, ['a1', 'a2', 'c1', 'f1', 'p1']);
    assert.deepEqual(merge(target, src), expected);
    assert.isTrue(Array.isArray(merge(target, src)));
  });

  test('should work on array properties', function () {
    var src = {
      key1: ['one', 'three'],
      key2: ['four'],
    };
    var target = {
      key1: ['one', 'two'],
    };

    var expected = {
      key1: ['one', 'two', 'one', 'three'],
      key2: ['four'],
    };

    assert.deepEqual(merge(target, src), expected);
    assert.isTrue(Array.isArray(merge(target, src).key1));
    assert.isTrue(Array.isArray(merge(target, src).key2));
  });

  test('should work on array properties with clone option', function () {
    var src = {
      key1: ['one', 'three'],
      key2: ['four'],
    };
    var target = {
      key1: ['one', 'two'],
    };

    assert.deepEqual(target, {
      key1: ['one', 'two'],
    });
    var merged = merge(target, src, { clone: true });
    assert.notEqual(merged.key1, src.key1);
    assert.notEqual(merged.key1, target.key1);
    assert.notEqual(merged.key2, src.key2);
  });

  test('should work on array of objects', function () {
    var src = [{ key1: ['one', 'three'], key2: ['one'] }, { key3: ['five'] }];
    var target = [{ key1: ['one', 'two'] }, { key3: ['four'] }];

    var expected = [
      { key1: ['one', 'two'] },
      { key3: ['four'] },
      { key1: ['one', 'three'], key2: ['one'] },
      { key3: ['five'] },
    ];

    assert.deepEqual(merge(target, src), expected);
    assert.isTrue(Array.isArray(merge(target, src)), 'result should be an array');
    assert.isTrue(Array.isArray(merge(target, src)[0].key1), 'subkey should be an array too');
  });

  test('should work on array of objects with clone option', function () {
    var src = [{ key1: ['one', 'three'], key2: ['one'] }, { key3: ['five'] }];
    var target = [{ key1: ['one', 'two'] }, { key3: ['four'] }];

    var expected = [
      { key1: ['one', 'two'] },
      { key3: ['four'] },
      { key1: ['one', 'three'], key2: ['one'] },
      { key3: ['five'] },
    ];

    var merged = merge(target, src, { clone: true });
    assert.deepEqual(merged, expected);
    assert.isTrue(Array.isArray(merge(target, src)), 'result should be an array');
    assert.isTrue(Array.isArray(merge(target, src)[0].key1), 'subkey should be an array too');
    assert.notEqual(merged[0].key1, src[0].key1);
    assert.notEqual(merged[0].key1, target[0].key1);
    assert.notEqual(merged[0].key2, src[0].key2);
    assert.notEqual(merged[1].key3, src[1].key3);
    assert.notEqual(merged[1].key3, target[1].key3);
  });

  test('should treat regular expressions like primitive values', function () {
    var target = { key1: /abc/ };
    var src = { key1: /efg/ };
    var expected = { key1: /efg/ };

    assert.deepEqual(merge(target, src), expected);
    assert.deepEqual(merge(target, src).key1.test('efg'), true);
  });

  test(
    'should treat regular expressions like primitive values and should not' + ' clone even with clone option',
    function () {
      var target = { key1: /abc/ };
      var src = { key1: /efg/ };

      var output = merge(target, src, { clone: true });

      assert.equal(output.key1, src.key1);
    },
  );

  test('should treat dates like primitives', function () {
    var monday = new Date('2016-09-27T01:08:12.761Z');
    var tuesday = new Date('2016-09-28T01:18:12.761Z');

    var target = {
      key: monday,
    };
    var source = {
      key: tuesday,
    };

    var expected = {
      key: tuesday,
    };
    var actual = merge(target, source);

    assert.deepEqual(actual, expected);
    assert.equal(actual.key.valueOf(), tuesday.valueOf());
  });

  test('should treat dates like primitives and should not clone even with clone' + ' option', function () {
    var monday = new Date('2016-09-27T01:08:12.761Z');
    var tuesday = new Date('2016-09-28T01:18:12.761Z');

    var target = {
      key: monday,
    };
    var source = {
      key: tuesday,
    };

    var actual = merge(target, source, { clone: true });

    assert.equal(actual.key, tuesday);
  });

  test('should work on array with null in it', function () {
    var target: any[] = [];

    var src = [null];

    var expected = [null];

    assert.deepEqual(merge(target, src), expected);
  });

  test("should clone array's element if it is object", function () {
    var a = { key: 'yup' };
    var target: any[] = [];
    var source = [a];

    var output = merge(target, source, { clone: true });

    assert.notEqual(output[0], a);
    assert.equal(output[0].key, 'yup');
  });

  test('should clone an array property when there is no target array', function () {
    const someObject = {};
    var target = {};
    var source = { ary: [someObject] };
    var output = merge(target, source, { clone: true });

    assert.deepEqual(output, { ary: [{}] });
    assert.notEqual(output.ary[0], someObject);
  });

  test('should overwrite values when property is initialised but undefined', function () {
    var target1 = { value: [] };
    var target2 = { value: null };
    var target3 = { value: 2 };

    var src = { value: undefined };

    function hasUndefinedProperty(o: any) {
      assert.isTrue(o.hasOwnProperty('value'));
      assert.equal(typeof o.value, 'undefined');
    }

    hasUndefinedProperty(merge(target1, src));
    hasUndefinedProperty(merge(target2, src));
    hasUndefinedProperty(merge(target3, src));
  });

  test('dates should copy correctly in an array', function () {
    var monday = new Date('2016-09-27T01:08:12.761Z');
    var tuesday = new Date('2016-09-28T01:18:12.761Z');

    var target = [monday, 'dude'];
    var source = [tuesday, 'lol'];

    var expected = [monday, 'dude', tuesday, 'lol'];
    var actual = merge(target, source);

    assert.deepEqual(actual, expected);
  });

  test('should handle custom merge functions', function () {
    var target = {
      letters: ['a', 'b'],
      people: {
        first: 'Alex',
        second: 'Bert',
      },
    };

    var source = {
      letters: ['c'],
      people: {
        first: 'Smith',
        second: 'Bertson',
        third: 'Car',
      },
    };

    const mergePeople = (target: any, source: any) => {
      const keys = new Set(Object.keys(target).concat(Object.keys(source)));
      const destination: Record<string, any> = {};
      keys.forEach((key) => {
        if (key in target && key in source) {
          destination[key] = `${target[key]}-${source[key]}`;
        } else if (key in target) {
          destination[key] = target[key];
        } else {
          destination[key] = source[key];
        }
      });
      return destination;
    };

    const options: MergeOptions = {
      customMerge: (key: string) => {
        if (key === 'people') {
          return mergePeople;
        }
        return merge;
      },
    };

    var expected = {
      letters: ['a', 'b', 'c'],
      people: {
        first: 'Alex-Smith',
        second: 'Bert-Bertson',
        third: 'Car',
      },
    };

    var actual = merge(target, source, options);
    assert.deepEqual(actual, expected);
  });

  test('should handle custom merge functions', function () {
    var target = {
      letters: ['a', 'b'],
      people: {
        first: 'Alex',
        second: 'Bert',
      },
    };

    var source = {
      letters: ['c'],
      people: {
        first: 'Smith',
        second: 'Bertson',
        third: 'Car',
      },
    };

    const mergeLetters = () => {
      return 'merged letters';
    };

    const options: MergeOptions = {
      customMerge: (key: any) => {
        if (key === 'letters') {
          return mergeLetters;
        }
        return;
      },
    };

    const expected: any = {
      letters: 'merged letters',
      people: {
        first: 'Smith',
        second: 'Bertson',
        third: 'Car',
      },
    };

    var actual = merge(target, source, options);
    assert.deepEqual(actual, expected);
  });

  test('should merge correctly if custom merge is not a valid function', function () {
    var target = {
      letters: ['a', 'b'],
      people: {
        first: 'Alex',
        second: 'Bert',
      },
    };

    var source = {
      letters: ['c'],
      people: {
        first: 'Smith',
        second: 'Bertson',
        third: 'Car',
      },
    };

    const options: MergeOptions = {
      customMerge: () => {
        return false as any;
      },
    };

    const expected = {
      letters: ['a', 'b', 'c'],
      people: {
        first: 'Smith',
        second: 'Bertson',
        third: 'Car',
      },
    };

    var actual = merge(target, source, options);
    assert.deepEqual(actual, expected);
  });

  test('copy symbol keys in target that do not exist on the target', function () {
    var mySymbol = Symbol();
    var src = { [mySymbol]: 'value1' };
    var target = {};

    var res: any = merge(target, src);

    assert.equal(res[mySymbol], 'value1');
    assert.deepEqual(Object.getOwnPropertySymbols(res), Object.getOwnPropertySymbols(src));
  });

  test('copy symbol keys in target that do exist on the target', function () {
    var mySymbol = Symbol();
    var src = { [mySymbol]: 'value1' };
    var target = { [mySymbol]: 'wat' };

    var res: any = merge(target, src);

    assert.equal(res[mySymbol], 'value1');
  });

  test('Falsey properties should be mergeable', function () {
    var uniqueValue = {};

    var target = {
      wat: false,
    };

    var source = {
      wat: false,
    };

    var customMergeWasCalled = false;

    var result = merge(target, source, {
      isMergeableObject: function () {
        return true;
      },
      customMerge: function () {
        return function () {
          customMergeWasCalled = true;
          return uniqueValue;
        };
      },
    });

    assert.equal(result.wat, uniqueValue);
    assert.isTrue(customMergeWasCalled, 'custom merge function was called');
  });
});

describe('prototype-poisoning', async () => {
  const { isMergeableObject } = await import('./isMergeableObject');
  test('merging objects with own __proto__', function () {
    var user = {};
    var malicious = JSON.parse('{ "__proto__": { "admin": true } }');
    var mergedObject: any = merge(user, malicious);
    assert.isFalse(!!mergedObject.__proto__.admin, 'non-plain properties should not be merged');
    assert.isFalse(!!mergedObject.admin, 'the destination should have an unmodified prototype');
  });

  test('merging objects with plain and non-plain properties', function () {
    var plainSymbolKey = Symbol('plainSymbolKey');
    var parent = {
      parentKey: 'should be undefined',
    };

    var target = Object.create(parent);
    target.plainKey = 'should be replaced';
    target[plainSymbolKey] = 'should also be replaced';

    var source = {
      parentKey: 'foo',
      plainKey: 'bar',
      newKey: 'baz',
      [plainSymbolKey]: 'qux',
    };

    var mergedObject: any = merge(target, source);
    assert.equal(
      undefined,
      mergedObject.parentKey,
      'inherited properties of target should be removed, not merged or ignored',
    );
    assert.equal('bar', mergedObject.plainKey, 'enumerable own properties of target should be merged');
    assert.equal('baz', mergedObject.newKey, 'properties not yet on target should be merged');
    assert.equal('qux', mergedObject[plainSymbolKey], 'enumerable own symbol properties of target should be merged');
  });

  // the following cases come from the thread here: https://github.com/TehShrike/deepmerge/pull/164
  test('merging strings works with a custom string merge', function () {
    var target = { name: 'Alexander' };
    var source = { name: 'Hamilton' };

    function customMerge(key: any): any {
      if (key === 'name') {
        return function (target: any, source: any) {
          return target[0] + '. ' + source.substring(0, 3);
        };
      } else {
        return merge;
      }
    }

    function mergeable(target: any) {
      return isMergeableObject(target) || (typeof target === 'string' && target.length > 1);
    }

    assert.equal('A. Ham', merge(target, source, { customMerge: customMerge, isMergeableObject: mergeable }).name);
  });

  test('merging objects with null prototype', function () {
    var target = Object.create(null);
    var source = Object.create(null);
    target.wheels = 4;
    target.trunk = { toolbox: ['hammer'] };
    source.trunk = { toolbox: ['wrench'] };
    source.engine = 'v8';
    var expected = {
      wheels: 4,
      engine: 'v8',
      trunk: {
        toolbox: ['hammer', 'wrench'],
      },
    };

    assert.deepEqual(expected, merge(target, source));
  });
});
