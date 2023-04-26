import { MikroOrmModule } from '@mikro-orm/nestjs';
import { type DynamicModule } from '@nestjs/common';
import { type FetchLike } from '@wener/utils';
import { HttpRequestLog } from './HttpRequestLog';
import { KeyOfFetchCacheModuleOptions } from './const';
import { FetchCacheService } from './fetch-cache.service';
import { RequestController } from './request.controller';


export class FetchCacheModule {
  static forRoot(o: FetchCacheModuleOptions = {}): DynamicModule {
    return {
      module: FetchCacheModule,
      imports: [MikroOrmModule.forFeature([HttpRequestLog])],
      controllers: [RequestController],
      providers: [
        FetchCacheService,
        {
          provide: KeyOfFetchCacheModuleOptions,
          useValue: o,
        },
      ],
      exports: [FetchCacheService],
    };
  }
}

export interface FetchCacheModuleOptions {
  schema?: string;
  fetch?: FetchLike;
}
