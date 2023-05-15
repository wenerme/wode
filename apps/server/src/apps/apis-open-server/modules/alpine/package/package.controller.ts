import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Controller, Get, Logger, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ms } from '@wener/utils';
import { createFetchWithCacheProxy } from '../../../createFetchWithCacheProxy';
import { getFlagged } from './getFlagged';

@ApiTags('Alpine')
@Controller('alpine/package')
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
      fetch: createFetchWithCacheProxy(),
    });
  }

  @Get(':pkg')
  getPkg() {}

  @Get(':arch/:repo/:pkg/:version')
  getVersion() {}
}
