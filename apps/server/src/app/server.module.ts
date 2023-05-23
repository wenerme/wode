import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ServerMiddleware } from './middleware/server.middleware';

@Module({})
export class ServerModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ServerMiddleware).forRoutes('*');
  }
}
