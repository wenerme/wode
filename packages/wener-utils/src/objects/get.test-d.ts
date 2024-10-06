import { expectTypeOf, test } from 'vitest';
import { get } from './get';

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

test('get typing', () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const obj = {} as TestClass;
  expectTypeOf(get(obj, 'nested.a', null)).toMatchTypeOf<number>();
  expectTypeOf(get(obj, 'normal', null)).toMatchTypeOf<string>();
  expectTypeOf(get(obj, 'nested.a')).toMatchTypeOf<number>();
  expectTypeOf(get(obj, 'nested.b.c')).toMatchTypeOf<boolean>();
  expectTypeOf(get(obj, 'arr')).toMatchTypeOf<number[]>();
  expectTypeOf(get(obj, 'arr[13]')).toMatchTypeOf<number>();
  // @ts-ignore
  expectTypeOf(get(obj, 'arr.13')).toMatchTypeOf<number>();
  expectTypeOf(get(obj, 'nestedArr[3].other')).toMatchTypeOf<null>();
  // @ts-ignore
  expectTypeOf(get(obj, 'deep.deep')).toMatchTypeOf<string[]>();
  expectTypeOf(get(obj, 'deep.arr[333]')).toMatchTypeOf<string>();
  expectTypeOf(get(obj, 'deep.arr[333].length')).toMatchTypeOf<number>();
  // @ts-ignore
  expectTypeOf(get(obj, 'nested["b"]["c"]')).toMatchTypeOf<boolean>();
  // @ts-ignore
  expectTypeOf(get(obj, '')).toMatchTypeOf<never>();
  expectTypeOf(get(obj, '', 3)).toMatchTypeOf<number>();
  // @ts-ignore
  expectTypeOf(get(obj, 'nested.asdfasdf')).toMatchTypeOf<never>();
  expectTypeOf(get(obj, 'deeplvl1[1].deeplvl2.deeplvl3[88].deeplvl4.value')).toMatchTypeOf<RegExp>();
  // @ts-ignore
  expectTypeOf(get(obj, 'deeplvl1[1].deeplvl2.deeplvl1[88].deeplvl4.value')).toMatchTypeOf<never>();
  expectTypeOf(get(obj, 'deeplvl1[1].deeplvl2.deeplvl1[88].deeplvl4.value', obj)).toMatchTypeOf<TestClass>();
  expectTypeOf(get(obj, 'nested["dd"]', '')).toMatchTypeOf<string>();
});
