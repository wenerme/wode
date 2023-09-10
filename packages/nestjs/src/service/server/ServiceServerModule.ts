import { Module } from '@nestjs/common';
import { ServiceRegistry } from './ServiceRegistry';

@Module({
  imports: [],
  providers: [ServiceRegistry],
  exports: [ServiceRegistry],
})
export class ServiceServerModule {}
