import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { resolveErrorDetail } from './resolveErrorDetail';

@Catch(Error)
export class ErrorFilter implements ExceptionFilter {
  private readonly log = new Logger(ErrorFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(error: Error, host: ArgumentsHost) {
    let detail = resolveErrorDetail(error);

    const { log } = this;
    const ctx = host.switchToHttp();
    const req = ctx.getRequest();

    let { status, code, message } = detail;
    log.error(`${req.method} ${req.url} ${status} ${code} ${req.headers['user-agent']} ${message}`);

    const { httpAdapter } = this.httpAdapterHost;
    httpAdapter.reply(
      ctx.getResponse(),
      {
        status,
        code,
        message,
      },
      status,
    );
  }
}
