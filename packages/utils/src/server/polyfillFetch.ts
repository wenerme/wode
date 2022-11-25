import type { MaybePromise } from '../asyncs/MaybePromise';

export function polyfillFetch(nodeFetch: typeof import('node-fetch')): boolean;
export function polyfillFetch(nodeFetch?: undefined): Promise<boolean>;
export function polyfillFetch(nodeFetch?: typeof import('node-fetch')): MaybePromise<boolean> {
  if ('fetch' in globalThis) {
    return false;
  }
  // sync mode
  if (nodeFetch) {
    const { default: fetch, Response, Headers, Request, AbortError, FetchError, FormData, Blob, File } = nodeFetch;
    Object.assign(globalThis, {
      fetch,
      Response,
      Headers,
      Request,
      AbortError,
      FetchError,
      FormData,
      Blob,
      File,
    });
    return true;
  }
  return import('node-fetch').then((v) => polyfillFetch(v));
}
