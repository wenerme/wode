import { getGlobalThis } from '../isomorphics/getGlobalThis';
import { FetchLike } from './types';

type RequestDelayFunction = (attempt: number, error: Error | null, response: Response | null) => number;
type RequestRetryOnFunction = (
  attempt: number,
  error: Error | null,
  response: Response | null,
) => boolean | Promise<boolean>;

export interface FetchWithRetryOptions {
  fetch?: FetchLike;
  retries?: number;
  retryDelay?: number | RequestDelayFunction;
  retryOn?: number[] | RequestRetryOnFunction;
}

export function createFetchWithRetry({
  fetch = getGlobalThis().fetch,
  retries = 3,
  retryDelay = 1000,
  retryOn = [],
}: FetchWithRetryOptions = {}): FetchLike {
  // https://github.com/jonbern/fetch-retry/blob/master/index.js

  return function fetchRetry(input: string | URL | Request, init?: RequestInit) {
    return new Promise(function (resolve, reject) {
      var wrappedFetch = function (attempt: number) {
        // As of node 18, this is no longer needed since node comes with native support for fetch:
        /* istanbul ignore next */
        var _input = typeof Request !== 'undefined' && input instanceof Request ? input.clone() : input;
        fetch(_input, init)
          .then(function (response) {
            if (Array.isArray(retryOn) && retryOn.indexOf(response.status) === -1) {
              resolve(response);
            } else if (typeof retryOn === 'function') {
              try {
                return Promise.resolve(retryOn(attempt, null, response))
                  .then(function (retryOnResponse) {
                    if (retryOnResponse) {
                      retry(attempt, null, response);
                    } else {
                      resolve(response);
                    }
                  })
                  .catch(reject);
              } catch (error) {
                reject(error);
              }
            } else {
              if (attempt < retries) {
                retry(attempt, null, response);
              } else {
                resolve(response);
              }
            }
            return;
          })
          .catch(function (error) {
            if (typeof retryOn === 'function') {
              try {
                // eslint-disable-next-line no-undef
                Promise.resolve(retryOn(attempt, error, null))
                  .then(function (retryOnResponse) {
                    if (retryOnResponse) {
                      retry(attempt, error, null);
                    } else {
                      reject(error);
                    }
                  })
                  .catch(function (error) {
                    reject(error);
                  });
              } catch (error) {
                reject(error);
              }
            } else if (attempt < retries) {
              retry(attempt, error, null);
            } else {
              reject(error);
            }
          });
      };

      function retry(attempt: number, error: any, response: Response | null) {
        let delay = typeof retryDelay === 'function' ? retryDelay(attempt, error, response) : retryDelay;
        setTimeout(function () {
          wrappedFetch(++attempt);
        }, delay);
      }

      wrappedFetch(0);
    });
  };
}
