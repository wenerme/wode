export function timeout<T = any>(v: Promise<T>, ms: number): Promise<T> {
  const error = new TimeoutError();
  let timeout: any;
  return Promise.race([
    v,
    new Promise((_resolve, reject) => {
      timeout = setTimeout(() => { reject(error); }, ms);
    }),
  ]).then(
    (v) => {
      clearTimeout(timeout);
      return v;
    },
    (e) => {
      clearTimeout(timeout);
      throw e;
    },
  ) as Promise<T>;
}

export class TimeoutError extends Error {
  constructor() {
    super('TimeoutError');
  }
}
