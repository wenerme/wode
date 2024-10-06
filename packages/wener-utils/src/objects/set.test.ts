/* eslint no-proto:0 no-prototype-builtins:0 */
import { describe, expect, it, test } from 'vitest';
import { set } from './set';

test('set basics', () => {
  expect(set({}, 'c', 3), 'should not give return value').toBe(undefined);
  {
    const item = { foo: 1 };
    set(item, 'bar', 123);
    expect(item, 'should mutate original object').toEqual({
      foo: 1,
      bar: 123,
    });
  }
});

describe('set objects', () => {
  const prepare = (x: any) => ({ input: x, copy: JSON.parse(JSON.stringify(x)) });

  const orig = set;

  function run(isMerge: boolean) {
    const set = (a: any, b: any, c: any) => {
      orig(a, b, c, isMerge);
    };
    const verb = isMerge ? 'merge' : 'overwrite';
    it(`should ${verb} existing object value :: simple`, () => {
      const { input } = prepare({
        hello: { a: 1 },
      });

      set(input, 'hello', { foo: 123 });

      if (isMerge) {
        expect(input).toStrictEqual({
          hello: {
            a: 1,
            foo: 123,
          },
        });
      } else {
        expect(input).toStrictEqual({
          hello: { foo: 123 },
        });
      }
    });

    it(`should ${verb} existing object value :: nested`, () => {
      const { input, copy } = prepare({
        a: {
          b: {
            c: 123,
          },
        },
      });

      set(input, 'a.b', { foo: 123 });

      if (isMerge) {
        Object.assign(copy.a.b, { foo: 123 });
      } else {
        copy.a.b = { foo: 123 };
      }

      expect(input).toStrictEqual(copy);
    });

    it(`should ${verb} existing array value :: simple`, () => {
      const { input } = prepare([{ foo: 1 }]);

      set(input, '0', { bar: 2 });

      if (isMerge) {
        expect(input).toEqual([{ foo: 1, bar: 2 }]);
      } else {
        expect(input).toEqual([{ bar: 2 }]);
      }
    });

    it(`should ${verb} existing array value :: nested`, () => {
      const { input } = prepare([
        { name: 'bob', age: 56, friends: ['foobar'] },
        { name: 'alice', age: 47, friends: ['mary'] },
      ]);

      set(input, '0', { age: 57, friends: ['alice', 'mary'] });
      set(input, '1', { friends: ['bob'] });
      set(input, '2', { name: 'mary', age: 49, friends: ['bob'] });

      if (isMerge) {
        expect(input).toEqual([
          { name: 'bob', age: 57, friends: ['alice', 'mary'] },
          { name: 'alice', age: 47, friends: ['bob'] },
          { name: 'mary', age: 49, friends: ['bob'] },
        ]);
      } else {
        expect(input).toEqual([
          { age: 57, friends: ['alice', 'mary'] },
          { friends: ['bob'] },
          { name: 'mary', age: 49, friends: ['bob'] },
        ]);
      }
    });
  }

  run(true);
  run(false);
});

describe('set arrays', () => {
  it('should create array instead of object via numeric key :: simple', () => {
    const input: any = { a: 1 };
    set(input, 'e.0', 2);
    expect(Array.isArray(input.e)).toBeTruthy();
    expect(input.e[0]).toBe(2);
    expect(input).toStrictEqual({
      a: 1,
      e: [2],
    });
  });

  it('should create array instead of object via numeric key :: nested', () => {
    const input: any = { a: 1 };
    set(input, 'e.0.0', 123);
    expect(input.e instanceof Array).toBeTruthy();
    expect(input.e[0][0]).toBe(123);
    expect(input).toEqual({
      a: 1,
      e: [[123]],
    });
  });

  it('should be able to create object inside of array', () => {
    const input: any = {};
    set(input, ['x', '0', 'z'], 123);
    expect(input.x instanceof Array).toBeTruthy();

    expect(input).toEqual({
      x: [{ z: 123 }],
    });
  });

  it('should create arrays with hole(s) if needed', () => {
    const input: any = {};
    set(input, ['x', '1', 'z'], 123);
    expect(input.x instanceof Array).toBeTruthy();
    expect(input).toEqual({
      x: [undefined, { z: 123 }],
    });
  });

  it('should create object from decimal-like key :: array :: zero :: string', () => {
    const input: any = {};
    set(input, ['x', '10.0', 'z'], 123);
    expect(input.x instanceof Array).toBeFalsy();
    expect(input).toEqual({
      x: {
        '10.0': {
          z: 123,
        },
      },
    });
  });

  it('should create array from decimal-like key :: array :: zero :: number', () => {
    const input: any = {};
    set(input, ['x', 10.0, 'z'], 123);
    expect(input.x instanceof Array).toBeTruthy();

    const x = Array(10);
    x.push({ z: 123 });
    expect(input).toEqual({ x });
  });

  it('should create object from decimal-like key :: array :: nonzero', () => {
    const input: any = {};
    set(input, ['x', '10.2', 'z'], 123);
    expect(input.x instanceof Array).toBeFalsy();
    expect(input).toEqual({
      x: {
        '10.2': {
          z: 123,
        },
      },
    });
  });
});

describe('set pollution', () => {
  it('should protect against "__proto__" assignment', () => {
    const input: any = { abc: 123 };
    const before = input.__proto__;
    set(input, '__proto__.hello', 123);

    expect(input.__proto__).toEqual(before);
    expect(input).toEqual({
      abc: 123,
    });
  });

  it('should protect against "__proto__" assignment :: nested', () => {
    const input: any = { abc: 123 };
    const before = input.__proto__;
    set(input, ['xyz', '__proto__', 'hello'], 123);

    expect(input.__proto__).toEqual(before);
    expect(input).toEqual({
      abc: 123,
      xyz: {
        // empty
      },
    });

    expect(input.hello).toBe(undefined);
  });

  it('should ignore "prototype" assignment', () => {
    const input: any = { a: 123 };
    set(input, 'a.prototype.hello', 'world');

    expect(input.a.prototype).toBe(undefined);
    expect(input.a.hello).toBe(undefined);

    expect(input).toEqual({
      a: {
        // converted, then aborted
      },
    });

    expect(JSON.stringify(input)).toBe('{"a":{}}');
  });

  it('should ignore "constructor" assignment :: direct', () => {
    const input: any = { a: 123 };

    function Custom() {
      //
    }

    set(input, 'a.constructor', Custom);
    expect(input.a.constructor).not.toBe(Custom);
    expect(input.a instanceof Custom).toBeFalsy();

    expect(input.a.constructor instanceof Object, '~> 123 -> {}').toBeTruthy();
    expect(input.a.hasOwnProperty('constructor')).toBe(false);
    expect(input).toEqual({ a: {} });
  });

  it('should ignore "constructor" assignment :: nested', () => {
    const input: any = {};

    set(input, 'constructor.prototype.hello', 'world');
    expect(input.hasOwnProperty('constructor')).toBe(false);
    expect(input.hasOwnProperty('hello')).toBe(false);

    expect(input).toEqual({
      // empty
    });
  });

  // Test for CVE-2022-25645 - CWE-1321
  it('should ignore JSON.parse crafted object with "__proto__" key', () => {
    const a: any = { b: { c: 1 } };
    expect(a.polluted).toBe(undefined);
    set(a, 'b', JSON.parse('{"__proto__":{"polluted":"Yes!"}}'));
    expect(a.polluted).toBe(undefined);
  });
});

describe('set assigns', () => {
  it('should add value to key path :: shallow :: string', () => {
    const input: any = {};
    set(input, 'abc', 123);
    expect(input).toEqual({ abc: 123 });
  });

  it('should add value to key path :: shallow :: array', () => {
    const input: any = {};
    set(input, ['abc'], 123);
    expect(input).toEqual({ abc: 123 });
  });

  it('should add value to key path :: nested :: string', () => {
    const input: any = {};
    set(input, 'a.b.c', 123);
    expect(input).toEqual({
      a: {
        b: {
          c: 123,
        },
      },
    });
  });

  it('should add value to key path :: nested :: array', () => {
    const input: any = {};
    set(input, ['a', 'b', 'c'], 123);
    expect(input).toEqual({
      a: {
        b: {
          c: 123,
        },
      },
    });
  });

  it('should create Array via integer key :: string', () => {
    const input: any = {};
    set(input, ['foo', '0'], 123);
    expect(input.foo instanceof Array).toBeTruthy();
    expect(input).toEqual({
      foo: [123],
    });
  });

  it('should create Array via integer key :: number', () => {
    const input: any = {};
    set(input, ['foo', 0], 123);
    expect(input.foo instanceof Array).toBeTruthy();
    expect(input).toEqual({
      foo: [123],
    });
  });
});

describe('set preserves', () => {
  it('should preserve existing object structure', () => {
    const input = {
      a: {
        b: {
          c: 123,
        },
      },
    };

    set(input, 'a.b.x.y', 456);

    expect(input).toEqual({
      a: {
        b: {
          c: 123,
          x: {
            y: 456,
          },
        },
      },
    });
  });

  it('should overwrite existing non-object values as object', () => {
    const input = {
      a: {
        b: 123,
      },
    };

    set(input, 'a.b.c', 'hello');

    expect(input).toEqual({
      a: {
        b: {
          c: 'hello',
        },
      },
    });
  });

  it('should preserve existing object tree w/ array value', () => {
    const input = {
      a: {
        b: {
          c: 123,
          d: {
            e: 5,
          },
        },
      },
    };

    set(input, 'a.b.d.z', [1, 2, 3, 4]);

    expect(input.a.b.d).toEqual({
      e: 5,
      z: [1, 2, 3, 4],
    });
  });
});
