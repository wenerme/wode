export type LazyPromise<T> = Promise<T> & {
  reject(e: any): void;
  resolve(v?: T | PromiseLike<T>): void;
};

export function createLazyPromise<T = any>(): LazyPromise<T> {
  const holder = {
    resolve(_: any): void {
      throw new Error('pending resolve');
    },
    reject(_: any): void {
      throw new Error('pending reject');
    },
  };
  return Object.assign(
    new Promise<T>((resolve, reject) => {
      holder.reject = reject;
      holder.resolve = resolve;
    }),
    {
      resolve(v: any) {
        holder.resolve(v);
      },
      reject(v: any) {
        holder.resolve(v);
      },
    },
  );
}
