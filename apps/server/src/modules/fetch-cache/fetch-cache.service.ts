import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { createFetchWithCache, type CreateFetchWithCacheOptions } from './createFetchWithCache';
import { type FetchCacheModuleOptions } from './fetch-cache.module';
import {KeyOfFetchCacheModuleOptions} from './const';

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
