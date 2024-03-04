import type { MaybePromise } from './MaybePromise';
import { isPromise } from './isPromise';

export type LazyPromise<T> = Promise<T> & {
  reject(reason?: any): void;
  resolve(v?: MaybePromise<T>): void;
};

/**
 * createLazyPromise return a promise that can be resolved or rejected manually.
 * if you pass a function to it, it will be executed when the promise try to resolve.
 */
export function createLazyPromise<T = any>(
  executor?:
    | ((resolve: LazyPromise<T>['resolve'], reject: LazyPromise<T>['reject']) => void)
    | ((resolve: LazyPromise<T>['resolve'], reject: LazyPromise<T>['reject']) => MaybePromise<T>),
): LazyPromise<T> {
  if (!executor && 'withResolvers' in Promise) {
    const { promise, resolve, reject } = (Promise as any).withResolvers();
    return Object.assign(promise, {
      resolve,
      reject,
      [Symbol.toStringTag]: 'LazyPromise',
    }) as LazyPromise<T>;
  }

  const holder = {
    resolve(_: any): void {
      throw new Error('pending resolve');
    },
    reject(_: any): void {
      throw new Error('pending reject');
    },
  };
  const future = Object.assign(
    new Promise<T>((resolve, reject) => {
      holder.reject = reject;
      holder.resolve = resolve;
    }),
    {
      [Symbol.toStringTag]: 'LazyPromise',
      resolve(v: any) {
        holder.resolve(v);
      },
      reject(v: any) {
        holder.resolve(v);
      },
    },
  );
  if (executor) {
    const r = holder.resolve;
    let shouldExec = true;
    holder.resolve = (v: any) => {
      shouldExec = false;
      r(v);
    };
    const then = future.then.bind(future);
    future.then = (...args) => {
      if (shouldExec) {
        shouldExec = false;
        try {
          // kind of bad
          const result = executor(holder.resolve, holder.reject);
          // ensure resolve/reject is called
          if (isPromise(result)) {
            result.then(holder.resolve, holder.reject);
          } else if (result !== undefined) {
            holder.resolve(result);
          }
        } catch (e) {
          holder.reject(e);
        }
      }
      return then(...args);
    };
    const like = holder as LazyPromise<T>;
    like.then = future.then;
    like.catch = future.catch.bind(future);
    if (future.finally) like.finally = future.finally;

    void Object.defineProperty(like, Symbol.species, {
      get() {
        return Promise;
      },
    });
    return like;
  }
  return future;
}
