/**
 * A collection of utility functions for working with Promises.
 */
export class Promises {
  /**
   * Creates a new Promise and returns it in an object, along with its resolve and reject functions.
   * @returns An object with the properties `promise`, `resolve`, and `reject`.
   *
   * ```ts
   * const { promise, resolve, reject } = Promise.withResolvers<T>();
   * ```
   *
   * - Chrome 119, Safari 17.4
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
   */
  static withResolvers<T>(): PromiseWithResolvers<T> {
    if ('withResolvers' in Promise) {
      return Promise['withResolvers']() as any;
    }
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    // @ts-ignore
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
  }

  /**
   * Creates a new Promise and returns it in an object, along with its resolve and reject functions.
   * @param ms The number of milliseconds to wait before rejecting the promise.
   */
  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Returns `true` if the given value is a Promise.
   * @param v The value to check.
   */
  static isPromise<T>(v: any): v is Promise<T> {
    return v && (v instanceof Promise || (v.then && v.catch));
  }
}

interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}
