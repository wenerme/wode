import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { ServerMiddleware } from './middleware/server-middleware.service';

@Module({})
export class ServerModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ServerMiddleware).forRoutes('*');
  }
}
