import { createLazyPromise, LazyPromise } from './createLazyPromise';

export function createAsyncIterator<T>(
  fn: (next: (val: [T | undefined, boolean] | undefined, err?: any) => void) => void,
) {
  const values: Array<Promise<[val: T | undefined, done: boolean, err?: any]>> = [];
  let recv: (val: [T | undefined, boolean] | undefined, err?: any) => void;
  {
    let next: LazyPromise<[val: T | undefined, done: boolean, err?: any]>;
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
    let value: T | undefined;
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
