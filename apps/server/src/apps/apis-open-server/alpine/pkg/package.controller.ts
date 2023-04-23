import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Controller, Get, Logger, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ms } from '@wener/utils';
import { createFetchWithProxy } from '@wener/utils/server';
import { createFetchWithCache } from '../../../../modules/fetch-cache';
import { getFlagged } from './getFlagged';

@ApiTags('Alpine')
@Controller('alpine/pkg')
@UseInterceptors(CacheInterceptor)
export class PackageController {
  private readonly log = new Logger('PackageController');

  @Get()
  list() {}

  @CacheTTL(ms('5m'))
  @Get('/-/flagged')
  getFlagged() {
    const { log } = this;
    return getFlagged({
      fetch: createFetchWithCache({
        fetch: createFetchWithProxy({
          proxy: process.env.FETCH_PROXY,
          fetch: globalThis.fetch,
        }),
        config: {
          use: 'cache',
          expires: '15m',
          match: {
            cookie: false,
          },
          onBeforeFetch: ({ entry }) => {
            log.log(`fetch ${entry.method} ${entry.url}`);
          },
        },
      }),
    });
  }

  @Get(':pkg')
  getPkg() {}

  @Get(':arch/:repo/:pkg/:version')
  getVersion() {}
}
