import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { HttpRequestLog } from './HttpRequestLog';
import { FetchCacheService } from './fetch-cache.service';

@Module({
  imports: [MikroOrmModule.forFeature([HttpRequestLog])],
  providers: [FetchCacheService],
  exports: [FetchCacheService],
})
export class FetchCacheModule {}
