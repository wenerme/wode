import type { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { KeyOfFetchCacheModuleOptions } from './const';
import { createFetchWithCache, type CreateFetchWithCacheOptions } from './createFetchWithCache';
import type { FetchCacheModuleOptions } from './fetch-cache.module';

@Injectable()
export class FetchCacheService {
  private readonly log = new Logger('FetchCacheService');

  constructor(
    private readonly em: EntityManager,
    @Inject(KeyOfFetchCacheModuleOptions) private readonly options: FetchCacheModuleOptions,
  ) {}

  createFetch(opts: CreateFetchWithCacheOptions = {}) {
    const { schema, fetch } = this.options;
    return createFetchWithCache({
      getEntityManager: () => this.em,
      fetch,
      schema,
      ...opts,
    });
  }
}
