import { isPromise } from './isPromise';
import { MaybePromise } from './MaybePromise';
import { nextOfAsyncIterator } from './nextOfAsyncIterator';

export function firstOfAsyncIterator<T>(it: MaybePromise<AsyncIterator<T> | Iterator<T> | T>): MaybePromise<T> {
  const next = nextOfAsyncIterator(it);
  if (isPromise(next)) {
    return next.then((v) => v[0]);
  }
  return next[0];
}
