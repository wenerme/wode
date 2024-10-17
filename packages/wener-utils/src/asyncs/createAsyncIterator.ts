import { createLazyPromise, type LazyPromise } from './createLazyPromise';
import type { MaybePromise } from './MaybePromise';

type Val<T> = [val: MaybePromise<T> | undefined, done: boolean, err?: any];

export function createAsyncIterator<T>(
  fn: (next: (val: [MaybePromise<T> | undefined, boolean] | undefined, err?: any) => void) => void,
): AsyncGenerator<T, void, unknown> {
  const values: Array<Promise<Val<T>>> = [];
  let recv: (val: [MaybePromise<T> | undefined, boolean] | undefined, err?: any) => void;
  {
    let next: LazyPromise<Val<T>>;
    values.push((next = createLazyPromise()));
    recv = (val, err) => {
      if (err !== undefined) {
        next.resolve([undefined, true, err]);
      } else if (val !== undefined) {
        next.resolve(val);
      } else {
        return;
      }
      values.push((next = createLazyPromise()));
    };
  }

  fn(recv);

  return (async function* () {
    let value: Val<T>[0];
    let err: any;
    for (let i = 0, done = false; !done; i++) {
      let result = await values[i];
      delete values[i];
      [value, done, err] = result;
      if (err) {
        throw err;
      }
      if (value !== undefined) {
        yield value;
      }
    }
  })();
}
