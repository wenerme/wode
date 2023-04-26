import { Logger } from '@nestjs/common';
import { FetchLike } from '@wener/utils';
import { createFetchWithProxy } from '@wener/utils/server';
import { createFetchWithCache } from '../../modules/fetch-cache';

let _fetch: FetchLike;

const log = new Logger('CacheProxyFetch');

export function createFetchWithCacheProxy() {
  return (_fetch ||= createFetchWithCache({
    fetch: createFetchWithProxy({
      proxy: process.env.FETCH_PROXY,
      fetch: globalThis.fetch,
    }),
    config: {
      use: 'cache',
      expires: '5m',
      match: {
        cookie: false,
      },
      onBeforeFetch: ({ entry }) => {
        log.log(`fetch ${entry.method} ${entry.url}`);
      },
    },
    schema: 'cache',
  }));
}
