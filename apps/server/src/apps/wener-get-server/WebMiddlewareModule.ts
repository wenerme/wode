import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Injectable, Logger, MiddlewareConsumer, Module, NestMiddleware, NestModule } from '@nestjs/common';
import { Currents } from '@wener/nestjs';
import { Contexts } from '@wener/nestjs/app';
import { NestRequest, NestResponse } from '../../app/types';

@Module({
  imports: [],
})
export class WebMiddlewareModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CurrentContextMiddleware, MikroOrmMiddleware).forRoutes('*');
  }
}

class CurrentContextMiddleware implements NestMiddleware {
  private log = new Logger(this.constructor.name);

  use(req: NestRequest, res: NestResponse, next: (error?: any) => void): any {
    const { ip, method, url, originalUrl, path = originalUrl } = req as any;
    const userAgent = (req as any).headers?.['user-agent'] || '';
    const requestId = (req as any).headers?.['x-request-id'] || '';

    // fixme
    // (response as any).on('close', () => {
    //   const { statusCode } = response;
    //   const contentLength = response.get('content-length');
    //
    //   this.logger.log(`${method} ${url} ${statusCode} ${contentLength} - ${userAgent} ${ip}`);
    // });

    this.log.log([requestId && `[${requestId}]`, `${method} ${path} - ${userAgent} ${ip}`].filter(Boolean).join(' '));

    return Currents.run(() => {
      Contexts.request.set(req);
      requestId && Contexts.requestId.set(requestId);

      return next();
    });
  }
}

@Injectable()
class MikroOrmMiddleware implements NestMiddleware {
  constructor(private readonly orm: MikroORM) {}

  use(req: unknown, res: unknown, next: (...args: any[]) => void) {
    return RequestContext.create(this.orm.em, next);
  }
}
