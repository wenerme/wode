import { Injectable, Logger } from '@nestjs/common';
import { Currents } from '../context';
import { type NestMiddleware, type NestRequest, type NestResponse } from '../types';

@Injectable()
export class ServerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: NestRequest, response: NestResponse, next: (error?: Error | any) => void): void {
    const { ip, method, url, originalUrl, path = originalUrl } = req as any;
    const userAgent = (req as any).headers?.['user-agent'] || '';

    // fixme
    // (response as any).on('close', () => {
    //   const { statusCode } = response;
    //   const contentLength = response.get('content-length');
    //
    //   this.logger.log(`${method} ${url} ${statusCode} ${contentLength} - ${userAgent} ${ip}`);
    // });

    this.logger.log(`${method} ${path} - ${userAgent} ${ip}`);

    Currents.run(() => {
      next();
    });
  }
}
