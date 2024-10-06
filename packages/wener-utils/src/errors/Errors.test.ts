import { test } from 'vitest';
import { Errors } from './Errors';

test('Errors', () => {
  {
    let a: string | undefined = '';
    Errors.NotFound.check(a);
    let b: string = a;
    hole(b);
  }
  if (false) {
    // 不能同时 asserts 且返回
    // https://stackoverflow.com/a/73252858/1870054
    // https://github.com/microsoft/TypeScript/issues/34636
    let a: string | undefined;
    Errors.NotFound.require(a);
    // let c: string = a;
    // hole(c);
  }
});

function hole(..._: any[]) {}
