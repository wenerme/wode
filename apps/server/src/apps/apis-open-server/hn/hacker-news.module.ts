import { Module } from '@nestjs/common';
import { HnController } from './hn.controller';

@Module({
  controllers: [HnController],
})
export class HackerNewsModule {}
