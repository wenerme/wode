import { createFetchWith } from './createFetchWith';
import { dumpRequest } from './dumpRequest';
import { dumpResponse } from './dumpResponse';
import type { FetchLike } from './types';

export function createFetchWithLogging({
  fetch,
  log = console.log,
}: {
  fetch?: FetchLike;
  log?: (s: string) => void;
} = {}): FetchLike {
  return createFetchWith({
    fetch,
    onRequest: ({ url, req }) => {
      void dumpRequest({ url, req, log });
    },
    onResponse: ({ url, req, res }) => {
      return dumpResponse({ url, req, res, log });
    },
  });
}
