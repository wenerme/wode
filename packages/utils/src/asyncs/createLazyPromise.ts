import { isPromise } from './isPromise';
import type { MaybePromise } from './MaybePromise';
import { Promises } from './Promises';

export type LazyPromise<T> = Promise<T> & {
  reject(reason?: any): void;
  resolve(v?: MaybePromise<T>): void;
  readonly status: 'pending' | 'resolved' | 'rejected';
  readonly value: T | undefined;
  readonly error: any;
};

/**
 * createLazyPromise return a promise that can be resolved or rejected manually.
 * if you pass a function to it, it will be executed when the promise try to resolve.
 */
export function createLazyPromise<T = any>(
  executor?: (resolve: LazyPromise<T>['resolve'], reject: LazyPromise<T>['reject']) => MaybePromise<T> | void,
): LazyPromise<T> {
  const { promise, resolve, reject } = Promises.withResolvers();
  const lazy = Object.assign(promise, {
    resolve,
    reject,
  }) as LazyPromise<T>;

  let executed = false;
  let pending = true;
  let status: 'pending' | 'resolved' | 'rejected' = 'pending';
  let value: T | undefined;
  let error: any;

  const _resolve = (v: T) => {
    resolve(v);
    if (!pending) return;
    pending = false;
    // do not delay this for sync status peek
    status = 'resolved';
    value = v;
  };
  const _reject = (v: any) => {
    reject(v);
    if (!pending) return;
    pending = false;
    status = 'rejected';
    error = v;
  };

  const like = Object.assign(
    {
      get status() {
        return status;
      },
      get value() {
        return value;
      },
      get error() {
        return error;
      },
    },
    {
      cache: lazy.catch.bind(lazy),
      finally: lazy.finally?.bind(lazy),
      resolve: _resolve,
      reject: _reject,
      then: (...args: any[]) => {
        if (executor && !executed) {
          executed = true;
          try {
            const result = executor(_resolve, _reject);
            // ensure resolve/reject is called
            if (isPromise(result)) {
              result.then(_resolve, _reject);
            } else if (result !== undefined) {
              _resolve(result);
            }
          } catch (e) {
            _reject(e);
          }
        }
        return lazy.then(...args);
      },
    },
  ) as any as LazyPromise<T>;

  if ('toStringTag' in Symbol) {
    Object.defineProperty(like, Symbol.toStringTag, {
      value: 'LazyPromise',
    });
  }

  return like;
}
