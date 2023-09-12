import { MaybePromise } from './MaybePromise';

export function firstOfAsyncIterator<T>(it: MaybePromise<AsyncIterator<T> | Iterator<T>>): MaybePromise<T> {
  if ('then' in it) {
    return it.then((v) => firstOfAsyncIterator(v));
  }
  let next = it.next();
  if ('then' in next) {
    return next.then((v) => v.value);
  }
  return next.value;
}
