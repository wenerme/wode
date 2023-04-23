import { Controller, Get, HttpException, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FetchCache } from '../../../modules/fetch-cache';
import { requireResponseOk } from '../../../util/requireResponseOk';
import { createFetchWithCacheProxy } from '../createFetchWithCacheProxy';

@ApiTags('HackerNews')
@Controller('hn')
export class HnController {
  private readonly fetch = createFetchWithCacheProxy();

  @Get('item/:id.json')
  item(@Param('id', ParseIntPipe) id: number) {
    const { fetch } = this;
    if (!Number.isFinite(id)) {
      throw new HttpException('Invalid id', 400);
    }
    return FetchCache.run({ expires: '15m' }, () => {
      return fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        .then(requireResponseOk)
        .then((v) => v.json());
    });
  }
}
