export function timeout<T = any>(
  pending: Promise<T> | ((args: { signal: AbortSignal }) => Promise<T>),
  ms: number,
): Promise<T> {
  const error = new TimeoutError();
  let timeout: any;
  let ac: AbortController | undefined;
  if (typeof pending === 'function') {
    ac = new AbortController();
    pending = pending({ signal: ac.signal });
  }

  return Promise.race<T>([
    pending,
    new Promise((_resolve, reject) => {
      timeout = setTimeout(() => {
        ac?.abort(error);
        reject(error);
      }, ms);
    }),
  ]).finally(() => {
    clearTimeout(timeout);
  });
}

export class TimeoutError extends Error {
  constructor() {
    super('TimeoutError');
  }
}
