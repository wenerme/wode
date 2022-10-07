/* eslint no-proto:0 */
import test from 'ava';
import { set } from './set';

test('set basics', (t) => {
  t.is(set({}, 'c', 3), undefined, 'should not give return value');
  {
    const item = { foo: 1 };
    set(item, 'bar', 123);
    t.is(item, item);
    t.deepEqual(
      item,
      {
        foo: 1,
        bar: 123,
      },
      'should mutate original object',
    );
  }
});

test('set objects', (t) => {
  const prepare = (x: any) => ({ input: x, copy: JSON.parse(JSON.stringify(x)) });
  const objects = (s: string, f: Function) => {
    t.log(s);
    f();
  };
  const orig = set;

  function run(isMerge: boolean) {
    const set = (a: any, b: any, c: any) => orig(a, b, c, isMerge);
    const verb = isMerge ? 'merge' : 'overwrite';
    objects(`should ${verb} existing object value :: simple`, () => {
      const { input } = prepare({
        hello: { a: 1 },
      });

      set(input, 'hello', { foo: 123 });

      if (isMerge) {
        t.deepEqual(input, {
          hello: {
            a: 1,
            foo: 123,
          },
        });
      } else {
        t.deepEqual(input, {
          hello: { foo: 123 },
        });
      }
    });

    objects(`should ${verb} existing object value :: nested`, () => {
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

      t.deepEqual(input, copy);
    });

    objects(`should ${verb} existing array value :: simple`, () => {
      const { input } = prepare([{ foo: 1 }]);

      set(input, '0', { bar: 2 });

      if (isMerge) {
        t.deepEqual(input, [{ foo: 1, bar: 2 }]);
      } else {
        t.deepEqual(input, [{ bar: 2 }]);
      }
    });

    objects(`should ${verb} existing array value :: nested`, () => {
      const { input } = prepare([
        { name: 'bob', age: 56, friends: ['foobar'] },
        { name: 'alice', age: 47, friends: ['mary'] },
      ]);

      set(input, '0', { age: 57, friends: ['alice', 'mary'] });
      set(input, '1', { friends: ['bob'] });
      set(input, '2', { name: 'mary', age: 49, friends: ['bob'] });

      if (isMerge) {
        t.deepEqual(input, [
          { name: 'bob', age: 57, friends: ['alice', 'mary'] },
          { name: 'alice', age: 47, friends: ['bob'] },
          { name: 'mary', age: 49, friends: ['bob'] },
        ]);
      } else {
        t.deepEqual(input, [
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

test('set arrays', (t) => {
  const arrays = (s: string, f: Function) => {
    t.log(s);
    f();
  };
  arrays('should create array instead of object via numeric key :: simple', () => {
    const input: any = { a: 1 };
    set(input, 'e.0', 2);
    t.true(Array.isArray(input.e));
    t.is(input.e[0], 2);
    t.deepEqual(input, {
      a: 1,
      e: [2],
    });
  });

  arrays('should create array instead of object via numeric key :: nested', () => {
    const input: any = { a: 1 };
    set(input, 'e.0.0', 123);
    t.true(input.e instanceof Array);
    t.is(input.e[0][0], 123);
    t.deepEqual(input, {
      a: 1,
      e: [[123]],
    });
  });

  arrays('should be able to create object inside of array', () => {
    const input: any = {};
    set(input, ['x', '0', 'z'], 123);
    t.true(input.x instanceof Array);
    t.deepEqual(input, {
      x: [{ z: 123 }],
    });
  });

  arrays('should create arrays with hole(s) if needed', () => {
    const input: any = {};
    set(input, ['x', '1', 'z'], 123);
    t.true(input.x instanceof Array);
    t.deepEqual(input, {
      x: [, { z: 123 }],
    });
  });

  arrays('should create object from decimal-like key :: array :: zero :: string', () => {
    const input: any = {};
    set(input, ['x', '10.0', 'z'], 123);
    t.false(input.x instanceof Array);
    t.deepEqual(input, {
      x: {
        '10.0': {
          z: 123,
        },
      },
    });
  });

  arrays('should create array from decimal-like key :: array :: zero :: number', () => {
    const input: any = {};
    set(input, ['x', 10.0, 'z'], 123);
    t.true(input.x instanceof Array);

    const x = Array(10);
    x.push({ z: 123 });
    t.deepEqual(input, { x });
  });

  arrays('should create object from decimal-like key :: array :: nonzero', () => {
    const input: any = {};
    set(input, ['x', '10.2', 'z'], 123);
    t.false(input.x instanceof Array);
    t.deepEqual(input, {
      x: {
        '10.2': {
          z: 123,
        },
      },
    });
  });
});

test('set pollution', (t) => {
  const pollution = (s: string, f: Function) => {
    t.log(s);
    f();
  };
  pollution('should protect against "__proto__" assignment', () => {
    const input: any = { abc: 123 };
    const before = input.__proto__;
    set(input, '__proto__.hello', 123);

    t.deepEqual(input.__proto__, before);
    t.deepEqual(input, {
      abc: 123,
    });
  });

  pollution('should protect against "__proto__" assignment :: nested', () => {
    const input: any = { abc: 123 };
    const before = input.__proto__;
    set(input, ['xyz', '__proto__', 'hello'], 123);

    t.deepEqual(input.__proto__, before);
    t.deepEqual(input, {
      abc: 123,
      xyz: {
        // empty
      },
    });

    t.is(input.hello, undefined);
  });

  pollution('should ignore "prototype" assignment', () => {
    const input: any = { a: 123 };
    set(input, 'a.prototype.hello', 'world');

    t.is(input.a.prototype, undefined);
    t.is(input.a.hello, undefined);

    t.deepEqual(input, {
      a: {
        // converted, then aborted
      },
    });

    t.is(JSON.stringify(input), '{"a":{}}');
  });

  pollution('should ignore "constructor" assignment :: direct', () => {
    const input: any = { a: 123 };

    function Custom() {
      //
    }

    set(input, 'a.constructor', Custom);
    t.not(input.a.constructor, Custom);
    t.false(input.a instanceof Custom);

    t.true(input.a.constructor instanceof Object, '~> 123 -> {}');
    t.is(input.a.hasOwnProperty('constructor'), false);
    t.deepEqual(input, { a: {} });
  });

  pollution('should ignore "constructor" assignment :: nested', () => {
    const input: any = {};

    set(input, 'constructor.prototype.hello', 'world');
    t.is(input.hasOwnProperty('constructor'), false);
    t.is(input.hasOwnProperty('hello'), false);

    t.deepEqual(input, {
      // empty
    });
  });

  // Test for CVE-2022-25645 - CWE-1321
  pollution('should ignore JSON.parse crafted object with "__proto__" key', () => {
    const a: any = { b: { c: 1 } };
    t.is(a.polluted, undefined);
    set(a, 'b', JSON.parse('{"__proto__":{"polluted":"Yes!"}}'));
    t.is(a.polluted, undefined);
  });
});
test('set assigns', (t) => {
  const assigns = (s: string, f: Function) => {
    t.log(s);
    f();
  };
  assigns('should add value to key path :: shallow :: string', () => {
    const input: any = {};
    set(input, 'abc', 123);
    t.deepEqual(input, { abc: 123 });
  });

  assigns('should add value to key path :: shallow :: array', () => {
    const input: any = {};
    set(input, ['abc'], 123);
    t.deepEqual(input, { abc: 123 });
  });

  assigns('should add value to key path :: nested :: string', () => {
    const input: any = {};
    set(input, 'a.b.c', 123);
    t.deepEqual(input, {
      a: {
        b: {
          c: 123,
        },
      },
    });
  });

  assigns('should add value to key path :: nested :: array', () => {
    const input: any = {};
    set(input, ['a', 'b', 'c'], 123);
    t.deepEqual(input, {
      a: {
        b: {
          c: 123,
        },
      },
    });
  });

  assigns('should create Array via integer key :: string', () => {
    const input: any = {};
    set(input, ['foo', '0'], 123);
    t.true(input.foo instanceof Array);
    t.deepEqual(input, {
      foo: [123],
    });
  });

  assigns('should create Array via integer key :: number', () => {
    const input: any = {};
    set(input, ['foo', 0], 123);
    t.true(input.foo instanceof Array);
    t.deepEqual(input, {
      foo: [123],
    });
  });
});
test('set preserves', (t) => {
  const preserves = (s: string, f: Function) => {
    t.log(s);
    f();
  };
  preserves('should preserve existing object structure', () => {
    const input = {
      a: {
        b: {
          c: 123,
        },
      },
    };

    set(input, 'a.b.x.y', 456);

    t.deepEqual(input, {
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

  preserves('should overwrite existing non-object values as object', () => {
    const input = {
      a: {
        b: 123,
      },
    };

    set(input, 'a.b.c', 'hello');

    t.deepEqual(input, {
      a: {
        b: {
          c: 'hello',
        },
      },
    });
  });

  preserves('should preserve existing object tree w/ array value', () => {
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

    t.deepEqual(input.a.b.d, {
      e: 5,
      z: [1, 2, 3, 4],
    });
  });
});
