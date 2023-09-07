import { createLazyPromise, LazyPromise } from './createLazyPromise';

export function createAsyncIterator<T>(
  fn: (next: (val: [T | undefined, boolean] | undefined, err?: any) => void) => void,
) {
  const values: Array<Promise<[T | undefined, boolean]>> = [];
  let recv: (val: [T | undefined, boolean] | undefined, err?: any) => void;
  {
    let next: LazyPromise<[T | undefined, boolean]>;
    values.push((next = createLazyPromise()));
    recv = (val, err) => {
      if (err !== undefined) {
        next.reject(err);
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
    let value: T | undefined;
    for (let i = 0, done = false; !done; i++) {
      [value, done] = await values[i];
      delete values[i];
      if (value !== undefined) {
        yield value;
      }
    }
  })();
}
