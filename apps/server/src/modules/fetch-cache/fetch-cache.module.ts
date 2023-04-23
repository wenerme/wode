import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { HttpRequestLog } from './HttpRequestLog';
import { FetchCacheService } from './fetch-cache.service';
import { RequestController } from './request.controller';

@Module({
  imports: [MikroOrmModule.forFeature([HttpRequestLog])],
  controllers: [RequestController],
  providers: [FetchCacheService],
  exports: [FetchCacheService],
})
export class FetchCacheModule {}
