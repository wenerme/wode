import { isIterator } from './isIterator';
import { isPromise } from './isPromise';
import type { MaybePromise } from './MaybePromise';

type IteratorLike<T> = Iterable<T> | Iterator<T>;
type AsyncIteratorLike<T> = AsyncIterable<T> | AsyncIterator<T> | AsyncIterableIterator<T> | IteratorLike<T>;

export function nextOfAsyncIterator<T>(
  it: MaybePromise<AsyncIterable<T> | Iterable<T> | AsyncIterator<T> | Iterator<T> | T>,
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
  if (it && typeof it === 'object') {
    if (Symbol.iterator in it) {
      return nextOfAsyncIterator(it[Symbol.iterator]());
    }
    if (Symbol.asyncIterator in it) {
      return nextOfAsyncIterator(it[Symbol.asyncIterator]());
    }
  }
  return [it];
}
