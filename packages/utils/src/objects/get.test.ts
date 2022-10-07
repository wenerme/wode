import test from 'ava';
import { expectType } from 'tsd';
import { get } from './get';
import { parseObjectPath } from './parseObjectPath';

test('get typed', (t) => {
  interface TestClass {
    normal: string;
    nested: {
      a: number;
      b: {
        c: boolean;
      };
    };
    arr: number[];
    nestedArr: {
      sum: number;
      other: null;
    }[];
    deep: {
      arr: string[];
    };
    deeplvl1: {
      deeplvl2: {
        deeplvl3: {
          deeplvl4: {
            value: RegExp;
          };
        }[];
      };
    }[];
  }

  const obj = {} as TestClass;

  expectType<number>(get(obj, 'nested.a', null));
  expectType<string>(get(obj, 'normal', null));
  expectType<number>(get(obj, 'nested.a'));
  expectType<boolean>(get(obj, 'nested.b.c'));
  expectType<number[]>(get(obj, 'arr'));
  expectType<number>(get(obj, 'arr[13]'));
  expectType<number>(get(obj, 'arr.13'));
  expectType<null>(get(obj, 'nestedArr[3].other'));
  expectType<string[]>(get(obj, 'deep.deep'));
  expectType<string>(get(obj, 'deep.arr[333]'));
  expectType<number>(get(obj, 'deep.arr[333].length'));
  expectType<boolean>(get(obj, 'nested["b"]["c"]'));
  expectType<never>(get(obj, ''));
  expectType<number>(get(obj, '', 3));
  expectType<never>(get(obj, 'nested.asdfasdf'));
  expectType<RegExp>(get(obj, 'deeplvl1[1].deeplvl2.deeplvl3[88].deeplvl4.value'));
  expectType<never>(get(obj, 'deeplvl1[1].deeplvl2.deeplvl1[88].deeplvl4.value'));
  expectType<TestClass>(get(obj, 'deeplvl1[1].deeplvl2.deeplvl1[88].deeplvl4.value', obj));
  expectType<string>(get(obj, 'nested["dd"]', ''));
  t.pass();
});

test('get', (t) => {
  const obj = {
    undef: undefined,
    zero: 0,
    one: 1,
    n: null,
    f: false,
    a: {
      two: 2,
      b: {
        three: 3,
        c: {
          four: 4,
        },
      },
    },
    arr: [5, [6, { v: 7 }]],
  } as const;

  function check(path: string, value: any, def?: any) {
    const out = get(obj, path, def);
    t.is(out, value, 'get(obj, "' + path + '") should be ' + value + ', got ' + out);
    if (path) {
      const arr = parseObjectPath(path);
      t.is(get(obj, arr, def), value, `get(obj,${JSON.stringify(arr)}, ${def})`);
    }
  }

  check('', undefined);
  check('one', obj.one);
  check('one.two', undefined);
  check('a', obj.a);
  check('a.two', obj.a.two);
  check('a.b', obj.a.b);
  check('a.b.three', obj.a.b.three);
  check('a.b.c', obj.a.b.c);
  check('a.b.c.four', obj.a.b.c.four);
  check('n', obj.n);
  check('n.badkey', undefined);
  check('f', false);
  check('f.badkey', undefined);

  check('', 'foo', 'foo');
  check('undef', 'foo', 'foo');
  check('n', null, 'foo');
  check('n.badkey', 'foo', 'foo');
  check('zero', 0, 'foo');
  check('a.badkey', 'foo', 'foo');
  check('a.badkey.anotherbadkey', 'foo', 'foo');
  check('f', false, 'foo');
  check('f.badkey', 'foo', 'foo');

  check('arr.0', 5);
  check('arr.1.0', 6);
  check('arr.1.1.v', 7);
  check('arr[0]', 5);
  check('arr[1][0]', 6);
  check('arr[1][1][v]', 7);
});
