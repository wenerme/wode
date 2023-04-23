import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable, Logger } from '@nestjs/common';
import { createFetchWithCache, CreateFetchWithCacheOptions } from './createFetchWithCache';

@Injectable()
export class FetchCacheService {
  private readonly log = new Logger('FetchCacheService');

  constructor(private readonly em: EntityManager) {}

  createFetch(opts: CreateFetchWithCacheOptions = {}) {
    return createFetchWithCache({
      em: this.em,
      ...opts,
    });
  }
}
