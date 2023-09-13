import { MaybePromise } from './MaybePromise';
import { isIterator } from './isIterator';
import { isPromise } from './isPromise';

export function nextOfAsyncIterator<T>(
  it: MaybePromise<AsyncIterator<T> | Iterator<T> | T>,
): MaybePromise<[value: T, done?: boolean]> {
  if (isPromise(it)) {
    return it.then((v) => nextOfAsyncIterator(v));
  }
  if (isIterator(it)) {
    let next = it.next();
    if (isPromise(next)) {
      return next.then((v) => [v.value, v.done]);
    }
    return [next.value, next.done];
  }
  return [it];
}
