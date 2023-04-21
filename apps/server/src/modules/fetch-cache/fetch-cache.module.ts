import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { HttpRequestLog } from './HttpRequestLog';

@Module({
  imports: [MikroOrmModule.forFeature([HttpRequestLog])],
})
export class FetchCacheModule {}
